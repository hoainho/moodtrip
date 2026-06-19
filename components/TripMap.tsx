import { useEffect, useRef, useState } from 'react';
import type { ItineraryPlan } from '../types';
import { computeBounds, resolveVenues, dayLocality, type ResolvedVenue } from '../services/venueResolver';
import { geocode, geocodeBatch, geocodeDestination, jitterAround, inVietnamBbox, haversineKm } from '../services/geocoder';
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

const DAY_COLORS = ['#14b8a6', '#f97316', '#a855f7', '#3b82f6', '#ef4444', '#10b981', '#f59e0b'];

// Max distance (km) a geocoded venue may sit from the trip's destination centre and still be
// treated as a precise location. Wide enough for regional multi-city trips (HCM↔Kiên Giang ≈ 260 km,
// including a real travel-leg departure point) yet far below the ~1200 km mis-geocodes that
// previously drew lines from the south up to Hà Nội. Per-day anchoring (below) does the fine
// accuracy work via bias; this radius is just the safety net against gross cross-country errors.
const MAX_TRIP_RADIUS_KM = 450;

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

      // Geocode the trip destination FIRST as an overall fallback bias/centre.
      const destResult = await geocodeDestination(itinerary.destination);
      if (cancelled) return;
      const destCenter = destResult ? { lat: destResult.lat, lng: destResult.lng } : undefined;

      // Then geocode EACH day's own locality (from its title, e.g. "Hà Tiên", "Quần đảo Nam Du") to
      // get a per-day anchor. Anchoring a venue to its own town — instead of one trip-wide centre —
      // makes the bias far stronger and lets us reject venues that mis-geocode out of the day's area.
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

      const batchResults = await geocodeBatch(
        missing.map((v) => ({
          venue: v.name,
          destination: itinerary.destination,
          bias: dayAnchors.get(v.day) ?? destCenter,
        })),
        (done, total) => {
          if (!cancelled) setGeocodeProgress({ done, total });
        },
        destCenter,
      );
      if (cancelled) return;

      let fallbackIndex = 0;
      const enriched = initial.map((v) => {
        if (v.lat != null && v.lng != null) return v;
        const key = `${v.name.toLowerCase().trim()}|${itinerary.destination.toLowerCase().trim()}`;
        const hit = batchResults.get(key);

        // The per-day anchor already biased this lookup to the right town, so most hits are accurate.
        // Accept a hit if it is inside Vietnam and within the trip radius of the destination centre.
        // We clamp to the TRIP centre (not the tight day centre) so a genuine travel-leg point — e.g.
        // the HCM departure "Bến xe Miền Tây", 225 km from the Hà Tiên day — stays precise. Only gross
        // cross-country mis-geocodes (e.g. → Hà Nội, 1260 km) are rejected here.
        const near = !destCenter || (hit != null && haversineKm(hit, destCenter) <= MAX_TRIP_RADIUS_KM);
        if (hit && inVietnamBbox(hit) && near) {
          return { ...v, lat: hit.lat, lng: hit.lng };
        }

        // No usable hit → estimate around the day's own anchor (better than the trip centre: a
        // failed Hà Tiên stop lands near Hà Tiên, not at the trip's geographic midpoint).
        const anchor = dayAnchors.get(v.day) ?? destCenter;
        if (anchor) {
          const j = jitterAround(anchor, fallbackIndex++);
          return { ...v, lat: j.lat, lng: j.lng, approximate: true };
        }
        return v;
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

        const byDay = new Map<number, ResolvedVenue[]>();
        for (const v of located) {
          if (!byDay.has(v.day)) byDay.set(v.day, []);
          byDay.get(v.day)!.push(v);
        }

        type RouteFeature = {
          type: 'Feature';
          properties: { day: number; color: string; kind: 'road' | 'estimate' };
          geometry: { type: 'LineString'; coordinates: [number, number][] };
        };
        const features: RouteFeature[] = [];
        const roadDays: Array<{ day: number; points: { lat: number; lng: number }[] }> = [];

        for (const [day, dayVenues] of byDay) {
          if (dayVenues.length < 2) continue;
          const color = DAY_COLORS[(day - 1) % DAY_COLORS.length];
          // Snap to real roads through the PRECISELY-located stops (skip jittered "approximate"
          // ones). Only when a day has fewer than 2 precise stops do we fall back to a dashed
          // straight line. This still draws a real car route even if a few stops couldn't geocode.
          const precise = dayVenues.filter((v) => !v.approximate && v.lat != null && v.lng != null);
          if (precise.length >= 2) {
            features.push({
              type: 'Feature',
              properties: { day, color, kind: 'road' },
              geometry: { type: 'LineString', coordinates: precise.map((v) => [v.lng as number, v.lat as number] as [number, number]) },
            });
            roadDays.push({ day, points: precise.map((v) => ({ lat: v.lat as number, lng: v.lng as number })) });
          } else {
            features.push({
              type: 'Feature',
              properties: { day, color, kind: 'estimate' },
              geometry: { type: 'LineString', coordinates: dayVenues.map((v) => [v.lng as number, v.lat as number] as [number, number]) },
            });
          }
        }

        if (features.length > 0) {
          map.addSource('routes', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features },
          });
          // Estimated days (some stops only approximately located): dashed straight line.
          map.addLayer({
            id: 'routes-estimate',
            type: 'line',
            source: 'routes',
            filter: ['==', ['get', 'kind'], 'estimate'],
            layout: { 'line-cap': 'round', 'line-join': 'round' },
            paint: {
              'line-color': ['get', 'color'],
              'line-width': 3,
              'line-opacity': 0.6,
              'line-dasharray': [2, 1.6],
            },
          });
          // Precise days: solid line, upgraded from straight to the real road geometry once OSRM responds.
          map.addLayer({
            id: 'routes-road',
            type: 'line',
            source: 'routes',
            filter: ['==', ['get', 'kind'], 'road'],
            layout: { 'line-cap': 'round', 'line-join': 'round' },
            paint: {
              'line-color': ['get', 'color'],
              'line-width': 4,
              'line-opacity': 0.85,
            },
          });

          // Progressive enhancement: snap each precise day's line to the actual road network.
          if (roadDays.length > 0) {
            void (async () => {
              let changed = false;
              for (const rd of roadDays) {
                const road = await fetchRoadRoute(rd.points);
                if (cancelled) return;
                if (road && road.length >= 2) {
                  const f = features.find((ft) => ft.properties.day === rd.day);
                  if (f) {
                    f.geometry.coordinates = road;
                    changed = true;
                  }
                }
              }
              if (changed && !cancelled) {
                const src = map.getSource('routes') as { setData?: (d: unknown) => void } | undefined;
                src?.setData?.({ type: 'FeatureCollection', features });
              }
            })();
          }
        }

        for (let i = 0; i < located.length; i++) {
          const v = located[i];
          if (v.lat == null || v.lng == null) continue;
          const color = DAY_COLORS[(v.day - 1) % DAY_COLORS.length];
          const orderInDay = (byDay.get(v.day) || []).indexOf(v) + 1;
          const el = document.createElement('button');
          el.type = 'button';
          el.className =
            'flex items-center justify-center text-white text-xs font-bold shadow-lg cursor-pointer';
          el.style.width = '32px';
          el.style.height = '32px';
          el.style.borderRadius = '50%';
          el.style.backgroundColor = color;
          if (v.approximate) {
            el.style.border = '2px dashed #ffffff';
            el.style.opacity = '0.72';
            el.setAttribute(
              'aria-label',
              `Ngày ${v.day} · ${orderInDay}. ${v.name} (vị trí ước lượng quanh trung tâm thành phố)`,
            );
          } else {
            el.style.border = '2px solid #ffffff';
            el.setAttribute('aria-label', `Ngày ${v.day} · ${orderInDay}. ${v.name}`);
          }
          el.textContent = String(orderInDay);
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

      {selected && (
        <div className="absolute bottom-3 left-3 right-3 p-3 rounded-xl bg-slate-950/95 border border-teal-500/30 backdrop-blur shadow-xl">
          <p className="text-white font-semibold text-sm mb-1">
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
