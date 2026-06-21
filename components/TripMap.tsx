import { useEffect, useRef, useState } from 'react';
import type { ItineraryPlan } from '../types';
import { computeBounds, resolveVenues, dayLocality, type ResolvedVenue } from '../services/venueResolver';
import { geocode, geocodeBatch, geocodeDestination, placeGeocodeHit, inVietnamBbox, haversineKm } from '../services/geocoder';
import { fetchRoadRoute } from '../services/routing';
import { IconMapPin, IconRoute, IconInfo } from './icons';

interface TripMapProps {
  itinerary: ItineraryPlan;
}

// Reliable RASTER basemap (Carto Voyager). Carto's tile CDN loads in environments where the
// OpenFreeMap vector tiles did not (the map was rendering blank). Voyager labels Vietnamese places
// with their local (Vietnamese) name and contains NO "nine-dash line". Any China-imposed island
// label baked into the tiles is hidden by an opaque sea-coloured mask over the disputed zone
// (added on map load), and our own Vietnamese sovereignty labels are drawn on top.
const BASE_STYLE = {
  version: 8,
  sources: {
    base: {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
        'https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
        'https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
        'https://d.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors © CARTO',
    },
  },
  layers: [{ id: 'base', type: 'raster', source: 'base' }],
};

// Carto Voyager ocean colour — used to mask the disputed zone so it stays seamless sea.
const SEA_MASK_COLOR = '#cfe1ea';

// East Sea disputed zone (offshore, between Vietnam's coast and the Philippines/Borneo): covers
// Hoàng Sa (Paracel), the Macclesfield bank, and Trường Sa (Spratly). OSM tags features here with
// China-imposed administrative names ("Tam Sa"/Sansha, "Quận Nam Sa"/Nansha, Qilianyu, Yongle…),
// which live in name:vi too — so we HIDE every base label inside this polygon and rely solely on
// our own Vietnamese sovereignty labels. The box stays offshore (no mainland/coastal city labels).
const EAST_SEA_DISPUTED = {
  type: 'Polygon' as const,
  coordinates: [[
    [111.0, 7.0],
    [117.5, 7.0],
    [117.5, 17.5],
    [111.0, 17.5],
    [111.0, 7.0],
  ]],
};

// Journey sequence colours — a single start→end story (NOT a per-day rainbow): the departure point
// is green, the final stop rose, and the connecting line/arrows run green→rose so the order and
// direction of travel read at a glance.
const START_COLOR = '#22c55e'; // điểm xuất phát (marker)
const ROUTE_COLOR = '#14b8a6'; // đường route + các điểm giữa chặng (một màu duy nhất)
const END_COLOR = '#f43f5e'; // điểm cuối (marker)

// Max distance (km) a geocoded venue may sit from the trip's destination centre and still be
// treated as a precise location. Wide enough for regional multi-city trips (HCM↔Kiên Giang ≈ 260 km,
// including a real travel-leg departure point) yet far below the ~1200 km mis-geocodes that
// previously drew lines from the south up to Hà Nội. Per-day anchoring (below) does the fine
// accuracy work via bias; this radius is just the safety net against gross cross-country errors.
const MAX_TRIP_RADIUS_KM = 450;

// Per-stop acceptance radius around its OWN region anchor (day locality / departure origin). A stop
// whose geocode lands farther than this from its region is a cross-region mis-geocode (e.g. a Cà Mau
// venue placed in HCM, ~250 km away) and is rejected in favour of an in-region jitter. Region-scale
// (a province is ~100 km across) so genuine spread-out stops in one area are still accepted.
const DAY_RADIUS_KM = 110;

export function TripMap({ itinerary }: TripMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);
  const [venues, setVenues] = useState<ResolvedVenue[]>([]);
  const [selected, setSelected] = useState<ResolvedVenue | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeProgress, setGeocodeProgress] = useState<{ done: number; total: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const initial = resolveVenues(itinerary);
      setVenues(initial);

      const missing = initial.filter((v) => v.lat == null || v.lng == null);
      if (missing.length === 0) return;

      setGeocoding(true);
      setGeocodeProgress({ done: 0, total: missing.length });

      // The trip's FIRST inter-city travel leg is the departure: its ORIGIN is where point 1 sits, and
      // every stop from that leg onward belongs to the destination region(s). Stops before it (e.g. a
      // breakfast in the origin city) share the origin region too.
      const firstTravelIdx = initial.findIndex((v) => v.route?.from && v.route?.to);
      const isOriginRegion = (i: number) => firstTravelIdx >= 0 && i <= firstTravelIdx;
      // What to actually geocode for each stop: the ORIGIN for the departure leg (so point 1 = the
      // start city), the ARRIVAL for every other travel leg (so "Homestay … -> Bến xe Cà Mau" lands at
      // the Cà Mau end), and the plain venue otherwise.
      const queries = initial.map((v, i) =>
        v.route ? (i === firstTravelIdx ? v.route.from : v.route.to) || v.name : v.name,
      );
      const keyOf = (query: string) =>
        `${query.toLowerCase().trim()}|${itinerary.destination.toLowerCase().trim()}`;

      // Destination centre — overall bias + the region anchor for any day without a parseable locality.
      const destResult = await geocodeDestination(itinerary.destination);
      if (cancelled) return;
      const destCenter = destResult ? { lat: destResult.lat, lng: destResult.lng } : undefined;

      // Departure origin anchor (e.g. "TP.HCM"): geocoded as a STANDALONE place name (via
      // geocodeDestination, NOT geocode(..., destination) which would append "Cà Mau" and drag the
      // origin south). It is intentionally far from the destination, so it gets no destination bias.
      let originAnchor: { lat: number; lng: number } | undefined;
      const originName = firstTravelIdx >= 0 ? initial[firstTravelIdx].route?.from : undefined;
      if (originName) {
        const r = await geocodeDestination(originName);
        if (cancelled) return;
        if (r && inVietnamBbox(r)) originAnchor = { lat: r.lat, lng: r.lng };
      }

      // Per-day anchor from each day's locality (title) so stops bias/cluster to their own town.
      const dayAnchors = new Map<number, { lat: number; lng: number }>();
      const dayNums = Array.from(new Set(missing.map((v) => v.day)));
      await Promise.all(
        dayNums.map(async (dayNum) => {
          const locality = dayLocality(itinerary.timeline[dayNum - 1]?.title);
          if (!locality) return;
          const r = await geocode(locality, itinerary.destination, destCenter);
          if (cancelled || !r || !inVietnamBbox(r)) return;
          // Reject a day anchor that itself mis-geocoded far from the trip centre.
          if (destCenter && haversineKm(r, destCenter) > MAX_TRIP_RADIUS_KM) return;
          dayAnchors.set(dayNum, { lat: r.lat, lng: r.lng });
        }),
      );
      if (cancelled) return;

      const regionAnchor = (v: ResolvedVenue, i: number) =>
        isOriginRegion(i) ? originAnchor : dayAnchors.get(v.day) ?? destCenter;

      const batchResults = await geocodeBatch(
        initial
          .map((v, i) => ({ v, i }))
          .filter(({ v }) => v.lat == null || v.lng == null)
          .map(({ v, i }) => ({
            venue: queries[i],
            destination: itinerary.destination,
            bias: regionAnchor(v, i) ?? destCenter,
          })),
        (done, total) => {
          if (!cancelled) setGeocodeProgress({ done, total });
        },
        destCenter,
      );
      if (cancelled) return;

      // Place each stop, REJECTING cross-region mis-geocodes. The departure/origin stop accepts any
      // in-VN hit (no tight anchor — it is meant to be far); every other stop must land within
      // DAY_RADIUS_KM of its own region anchor, else it jitters there (flagged approximate).
      let jitterIndex = 0;
      const enriched = initial.map((v, i) => {
        if (v.lat != null && v.lng != null) return v;
        // The departure leg sits at its ORIGIN city centre (point 1) — assign it directly so it can
        // never be biased/jittered toward the destination.
        if (i === firstTravelIdx && originAnchor) return { ...v, lat: originAnchor.lat, lng: originAnchor.lng };
        const hit = batchResults.get(keyOf(queries[i])) ?? null;
        const origin = isOriginRegion(i);
        const acceptAnchor = origin ? originAnchor : dayAnchors.get(v.day) ?? destCenter;
        const fallbackAnchor = origin ? originAnchor ?? destCenter : dayAnchors.get(v.day) ?? destCenter;
        const placed = placeGeocodeHit(hit, acceptAnchor, fallbackAnchor, DAY_RADIUS_KM, jitterIndex);
        if (placed?.approximate) jitterIndex++;
        return placed ? { ...v, ...placed } : v;
      });
      setVenues(enriched);
      setGeocoding(false);
      setGeocodeProgress(null);
    })();
    return () => {
      cancelled = true;
    };
  }, [itinerary]);

  useEffect(() => {
    if (!containerRef.current) return;
    const located = venues.filter((v) => v.lat != null && v.lng != null);
    if (located.length === 0) return;
    let cancelled = false;
    (async () => {
      type MarkerLike = {
        setLngLat: (ll: [number, number]) => MarkerLike;
        addTo: (map: unknown) => MarkerLike;
        getElement: () => HTMLElement;
        remove: () => void;
      };
      type MapLike = {
        fitBounds: (b: number[][], opts?: unknown) => void;
        remove: () => void;
        on: (ev: string, fn: () => void) => void;
        addControl: (c: unknown) => void;
        addSource: (id: string, src: unknown) => void;
        addLayer: (layer: unknown) => void;
        addImage: (id: string, img: unknown, opts?: unknown) => void;
        hasImage: (id: string) => boolean;
        getSource: (id: string) => unknown;
        getStyle: () => { layers?: Array<{ id: string; type: string; layout?: Record<string, unknown>; filter?: unknown }> } | undefined;
        setLayoutProperty: (layerId: string, name: string, value: unknown) => void;
        setFilter: (layerId: string, filter: unknown) => void;
      };
      const mod = (await import('maplibre-gl')) as unknown as {
        default: {
          Map: new (opts: unknown) => MapLike;
          NavigationControl: new (opts?: unknown) => unknown;
          Marker: new (opts?: unknown) => MarkerLike;
        };
      };
      await import('maplibre-gl/dist/maplibre-gl.css');
      if (cancelled || !containerRef.current) return;

      const bounds = computeBounds(located);
      const center = bounds?.center ?? { lat: 16.0, lng: 107.5 };

      const map = new mod.default.Map({
        container: containerRef.current,
        style: BASE_STYLE,
        center: [center.lng, center.lat],
        zoom: bounds ? 10 : 5,
        attributionControl: true,
      });
      mapRef.current = map;
      map.addControl(new mod.default.NavigationControl({ showCompass: false }));

      const markers: MarkerLike[] = [];

      map.on('load', () => {
        if (cancelled) return;

        // Mask the East-Sea disputed zone with the ocean colour so any China-imposed island label
        // baked into the raster tiles (e.g. "Tam Sa", "Quận Nam Sa") is covered. The box is entirely
        // offshore, so the mask reads as seamless sea; our Vietnamese sovereignty labels sit on top.
        try {
          map.addSource('disputed-mask', {
            type: 'geojson',
            data: { type: 'Feature', properties: {}, geometry: EAST_SEA_DISPUTED },
          });
          map.addLayer({
            id: 'disputed-mask',
            type: 'fill',
            source: 'disputed-mask',
            paint: { 'fill-color': SEA_MASK_COLOR, 'fill-opacity': 1 },
          });
        } catch (err) {
          console.warn('[TripMap] could not add disputed-zone mask', err);
        }

        // ── One continuous, ORDER-CLEAR journey ────────────────────────────────────────────────
        // `located` is already in itinerary order (day ascending, then schedule order), so
        // located[0] is the trip's departure point and located[N-1] the final stop. Draw ONE line
        // through every stop in that order and number markers GLOBALLY (1 → N) — instead of the old
        // per-day rainbow with lines/numbers that restarted each day and read as disconnected.
        if (located.length >= 2) {
          const lineCoords: [number, number][] = located.map((v) => [v.lng as number, v.lat as number]);
          map.addSource('route', {
            type: 'geojson',
            data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: lineCoords } },
          });
          // White casing under the line so it stays legible over any basemap colour.
          map.addLayer({
            id: 'route-casing',
            type: 'line',
            source: 'route',
            layout: { 'line-cap': 'round', 'line-join': 'round' },
            paint: { 'line-color': '#ffffff', 'line-width': 7, 'line-opacity': 0.95 },
          });
          // ONE solid-colour line — the journey order/direction is carried by the numbered markers
          // (1 → N) and the arrows, so the line colour itself never needs interpreting.
          map.addLayer({
            id: 'route-line',
            type: 'line',
            source: 'route',
            layout: { 'line-cap': 'round', 'line-join': 'round' },
            paint: { 'line-color': ROUTE_COLOR, 'line-width': 4, 'line-opacity': 0.9 },
          });

          // Directional arrows along the line so the travel order is unmistakable. Self-contained
          // canvas icon — BASE_STYLE ships no glyphs, so a text-symbol arrow would not render.
          try {
            if (!map.hasImage('route-arrow')) {
              const s = 28;
              const cv = document.createElement('canvas');
              cv.width = s;
              cv.height = s;
              const ctx = cv.getContext('2d');
              if (ctx) {
                ctx.translate(s / 2, s / 2);
                ctx.beginPath();
                ctx.moveTo(-5, -6);
                ctx.lineTo(7, 0);
                ctx.lineTo(-5, 6);
                ctx.closePath();
                ctx.fillStyle = '#ffffff';
                ctx.strokeStyle = 'rgba(15,23,42,0.85)';
                ctx.lineWidth = 1.5;
                ctx.fill();
                ctx.stroke();
                map.addImage('route-arrow', ctx.getImageData(0, 0, s, s), { pixelRatio: 2 });
              }
            }
            map.addLayer({
              id: 'route-arrows',
              type: 'symbol',
              source: 'route',
              layout: {
                'symbol-placement': 'line',
                'symbol-spacing': 64,
                'icon-image': 'route-arrow',
                'icon-size': 0.7,
                'icon-rotation-alignment': 'map',
                'icon-allow-overlap': true,
                'icon-ignore-placement': true,
              },
            });
          } catch (err) {
            console.warn('[TripMap] could not add route arrows', err);
          }

          // Progressive enhancement: snap the ordered stops to the real road network. Only when the
          // whole ordered set fits OSRM's waypoint budget, so we never drop the tail of the journey.
          if (lineCoords.length <= 25) {
            void (async () => {
              const road = await fetchRoadRoute(located.map((v) => ({ lat: v.lat as number, lng: v.lng as number })));
              if (cancelled || !road || road.length < 2) return;
              const src = map.getSource('route') as { setData?: (d: unknown) => void } | undefined;
              src?.setData?.({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: road } });
            })();
          }
        }

        // Global sequential markers: 1 = departure → N = final stop. Start/end are larger with a
        // coloured halo so the journey's anchors stand out; the number is the trip-wide order.
        const total = located.length;
        for (let i = 0; i < total; i++) {
          const v = located[i];
          if (v.lat == null || v.lng == null) continue;
          const isStart = i === 0;
          const isEnd = i === total - 1 && total > 1;
          const color = isStart ? START_COLOR : isEnd ? END_COLOR : ROUTE_COLOR;
          const seq = i + 1;
          const el = document.createElement('button');
          el.type = 'button';
          el.className =
            'flex items-center justify-center text-white font-bold shadow-lg cursor-pointer';
          const size = isStart || isEnd ? 36 : 30;
          el.style.width = `${size}px`;
          el.style.height = `${size}px`;
          el.style.fontSize = isStart || isEnd ? '13px' : '12px';
          el.style.borderRadius = '50%';
          el.style.backgroundColor = color;
          el.style.border = v.approximate ? '2px dashed #ffffff' : '2.5px solid #ffffff';
          if (isStart || isEnd) el.style.boxShadow = `0 0 0 3px ${color}55, 0 2px 8px rgba(0,0,0,.45)`;
          if (v.approximate) el.style.opacity = '0.82';
          el.textContent = String(seq);
          const role = isStart ? ' (điểm xuất phát)' : isEnd ? ' (điểm cuối)' : '';
          const approx = v.approximate ? ' — vị trí ước lượng quanh trung tâm' : '';
          el.setAttribute('aria-label', `Điểm ${seq}/${total} · Ngày ${v.day} · ${v.name}${role}${approx}`);
          el.onclick = () => setSelected(v);
          const marker = new mod.default.Marker({ element: el }).setLngLat([v.lng, v.lat]).addTo(map);
          markers.push(marker);
        }

        // Chủ quyền Việt Nam: luôn hiển thị Hoàng Sa & Trường Sa trên bản đồ.
        // Tile nền (OSM) gán nhãn tiếng Anh/trung lập, nên ta phủ nhãn tiếng Việt cố định
        // tại đúng toạ độ để bản đồ luôn thể hiện hai quần đảo thuộc Việt Nam.
        const SOVEREIGNTY: { name: string; lngLat: [number, number] }[] = [
          { name: 'Quần đảo Hoàng Sa (Việt Nam)', lngLat: [112.0, 16.5] },
          { name: 'Quần đảo Trường Sa (Việt Nam)', lngLat: [113.8, 9.6] },
        ];
        for (const s of SOVEREIGNTY) {
          const wrap = document.createElement('div');
          wrap.className = 'flex flex-col items-center select-none';
          wrap.style.pointerEvents = 'none';
          const dot = document.createElement('div');
          dot.style.cssText =
            'width:9px;height:9px;border-radius:50%;background:#ef4444;border:2px solid #ffffff;box-shadow:0 0 6px rgba(0,0,0,.55);';
          const label = document.createElement('div');
          label.textContent = s.name;
          label.style.cssText =
            'margin-top:3px;font-size:10px;font-weight:700;color:#ffffff;background:rgba(220,38,38,.88);padding:1px 6px;border-radius:6px;white-space:nowrap;text-shadow:0 1px 2px rgba(0,0,0,.6);';
          wrap.appendChild(dot);
          wrap.appendChild(label);
          const sMarker = new mod.default.Marker({ element: wrap }).setLngLat(s.lngLat).addTo(map);
          markers.push(sMarker);
        }

        if (bounds && located.length > 1) {
          map.fitBounds(
            [
              [bounds.west, bounds.south],
              [bounds.east, bounds.north],
            ],
            { padding: 60, maxZoom: 13, duration: 0 },
          );
        }
        setMapReady(true);
      });
    })();
    return () => {
      cancelled = true;
      const m = mapRef.current as { remove: () => void } | null;
      if (m?.remove) m.remove();
      mapRef.current = null;
    };
  }, [venues]);

  // Keep maplibre's canvas in sync with its container. When the map is lifted into the result
  // 2-column layout, the right column's width changes at the lg breakpoint (and the sticky panel
  // may resize), which otherwise leaves clipped/blank tiles until the next interaction. A
  // ResizeObserver on the container calls map.resize() so tiles always fill the panel.
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => {
      const m = mapRef.current as { resize?: () => void } | null;
      m?.resize?.();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [mapReady]);

  const located = venues.filter((v) => v.lat != null && v.lng != null);
  const approximate = located.filter((v) => v.approximate);
  const exact = located.filter((v) => !v.approximate);
  const totalVenues = venues.length;

  if (totalVenues === 0) {
    return (
      <div className="rounded-2xl glass-dark border border-white/10 p-6 text-center text-slate-300 text-sm">
        <IconMapPin className="w-8 h-8 mx-auto mb-2 text-slate-400" />
        Lịch trình này chưa có địa điểm cụ thể.
      </div>
    );
  }

  if (geocoding && located.length === 0) {
    return (
      <div className="rounded-2xl glass-dark border border-white/10 p-6 text-center text-slate-300 text-sm">
        <IconRoute className="w-8 h-8 mx-auto mb-2 text-teal-400 animate-pulse" />
        <p className="font-semibold mb-1">Đang tìm vị trí địa điểm…</p>
        {geocodeProgress && (
          <p className="text-xs text-slate-400">
            {geocodeProgress.done}/{geocodeProgress.total} địa điểm
          </p>
        )}
      </div>
    );
  }

  if (located.length === 0) {
    return (
      <div className="rounded-2xl glass-dark border border-white/10 p-6 text-center text-slate-300 text-sm">
        <IconMapPin className="w-8 h-8 mx-auto mb-2 text-slate-400" />
        <p className="font-semibold mb-1 text-base">Chưa tìm thấy toạ độ cho lịch trình này.</p>
        <p className="text-sm text-slate-400 leading-relaxed">
          Mơ đã thử tìm {totalVenues} địa điểm nhưng kết nối tới dịch vụ bản đồ bị gián đoạn.
          Hãy thử lại sau, hoặc xem tên + giờ ở phần lịch trình bên dưới.
        </p>
      </div>
    );
  }

  return (
    <div className="relative rounded-2xl overflow-hidden border border-white/10">
      <div ref={containerRef} className="w-full h-72 sm:h-96 bg-slate-900" aria-label="Bản đồ chuyến đi" />

      {!mapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/70 text-slate-300 text-sm pointer-events-none">
          <div className="flex flex-col items-center gap-2">
            <IconRoute className="w-6 h-6 animate-pulse" />
            Đang tải bản đồ…
          </div>
        </div>
      )}

      {geocoding && mapReady && geocodeProgress && (
        <div className="absolute top-3 left-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950/85 border border-white/10 text-xs text-slate-200">
          <IconRoute className="w-3.5 h-3.5 animate-pulse text-teal-400" />
          Đang tìm vị trí · {geocodeProgress.done}/{geocodeProgress.total}
        </div>
      )}

      {mapReady && located.length > 0 && !geocoding && (
        <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-950/85 border border-white/10 text-xs text-slate-200">
            <IconMapPin className="w-3.5 h-3.5 text-teal-400" />
            {exact.length} chính xác{approximate.length > 0 ? ` · ${approximate.length} ước lượng` : ''}
          </div>
          {approximate.length > 0 && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-[11px] text-amber-200 max-w-[260px]">
              <IconInfo className="w-3.5 h-3.5 text-amber-300 flex-shrink-0" />
              <span className="leading-tight">Marker viền nét đứt là vị trí ước lượng quanh trung tâm.</span>
            </div>
          )}
        </div>
      )}

      {mapReady && located.length > 1 && !geocoding && !selected && (
        <div className="absolute bottom-3 left-3 inline-flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-slate-950/85 border border-white/10 text-[11px] text-slate-200">
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full border border-white/70" style={{ backgroundColor: '#22c55e' }} />
            Xuất phát (1)
          </span>
          <span className="text-slate-500">→</span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full border border-white/70" style={{ backgroundColor: '#f43f5e' }} />
            Điểm cuối ({located.length})
          </span>
        </div>
      )}

      {selected && (
        <div className="absolute bottom-3 left-3 right-3 p-3 rounded-xl bg-slate-950/95 border border-teal-500/30 backdrop-blur shadow-xl">
          <p className="text-white font-semibold text-sm mb-1">
            {(() => {
              const idx = located.indexOf(selected);
              return idx >= 0 ? `Điểm ${idx + 1}/${located.length} · ` : '';
            })()}
            Ngày {selected.day} · {selected.time}
          </p>
          <p className={`text-slate-200 text-sm ${selected.approximate ? 'mb-1' : 'mb-2.5'}`}>{selected.name}</p>
          {selected.approximate && (
            <p className="text-amber-300 text-[11px] mb-2.5 inline-flex items-start gap-1">
              <IconInfo className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span>Vị trí ước lượng quanh trung tâm — chưa tìm thấy chính xác trên OpenStreetMap.</span>
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {selected.mapsLink && (
              <a
                href={selected.mapsLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 min-h-[44px] px-2.5 py-1.5 text-xs rounded-md bg-white/10 hover:bg-white/15 text-teal-300 transition-colors"
              >
                <IconMapPin className="w-3.5 h-3.5" />
                Google Maps
              </a>
            )}
            {selected.lat != null && selected.lng != null && (
              <a
                href={`https://www.openstreetmap.org/directions?from=&to=${selected.lat}%2C${selected.lng}#map=14/${selected.lat}/${selected.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 min-h-[44px] px-2.5 py-1.5 text-xs rounded-md bg-white/10 hover:bg-white/15 text-cyan-300 transition-colors"
              >
                <IconRoute className="w-3.5 h-3.5" />
                Chỉ đường
              </a>
            )}
            {selected.tiktokQuery && (
              <a
                href={selected.tiktokQuery}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 min-h-[44px] px-2.5 py-1.5 text-xs rounded-md bg-white/10 hover:bg-white/15 text-pink-300 transition-colors"
              >
                TikTok
              </a>
            )}
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="ml-auto min-h-[44px] px-3 text-slate-400 text-xs hover:text-white transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
