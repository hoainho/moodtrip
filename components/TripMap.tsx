import { useEffect, useRef, useState } from 'react';
import type { ItineraryPlan } from '../types';
import { computeBounds, resolveVenues, type ResolvedVenue } from '../services/venueResolver';
import { geocodeBatch, geocodeDestination, jitterAround } from '../services/geocoder';
import { IconMapPin, IconRoute, IconInfo } from './icons';

interface TripMapProps {
  itinerary: ItineraryPlan;
}

const OSM_STYLE = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
};

const DAY_COLORS = ['#14b8a6', '#f97316', '#a855f7', '#3b82f6', '#ef4444', '#10b981', '#f59e0b'];

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

      const [destResult, batchResults] = await Promise.all([
        geocodeDestination(itinerary.destination),
        geocodeBatch(
          missing.map((v) => ({ venue: v.name, destination: itinerary.destination })),
          (done, total) => {
            if (!cancelled) setGeocodeProgress({ done, total });
          },
        ),
      ]);
      if (cancelled) return;

      const MAX_VENUE_DISTANCE_KM = 60;
      const KM_PER_DEG_LAT = 111.32;
      const haversineKm = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
        const dLat = (a.lat - b.lat) * KM_PER_DEG_LAT;
        const meanLat = ((a.lat + b.lat) / 2) * (Math.PI / 180);
        const dLng = (a.lng - b.lng) * KM_PER_DEG_LAT * Math.cos(meanLat);
        return Math.sqrt(dLat * dLat + dLng * dLng);
      };

      let fallbackIndex = 0;
      const enriched = initial.map((v) => {
        if (v.lat != null && v.lng != null) return v;
        const key = `${v.name.toLowerCase().trim()}|${itinerary.destination.toLowerCase().trim()}`;
        const hit = batchResults.get(key);

        if (hit && destResult) {
          const dist = haversineKm({ lat: hit.lat, lng: hit.lng }, { lat: destResult.lat, lng: destResult.lng });
          if (dist > MAX_VENUE_DISTANCE_KM) {
            const j = jitterAround({ lat: destResult.lat, lng: destResult.lng }, fallbackIndex++);
            return { ...v, lat: j.lat, lng: j.lng, approximate: true };
          }
          return { ...v, lat: hit.lat, lng: hit.lng };
        }

        if (hit) return { ...v, lat: hit.lat, lng: hit.lng };

        if (destResult) {
          const j = jitterAround({ lat: destResult.lat, lng: destResult.lng }, fallbackIndex++);
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
        style: OSM_STYLE,
        center: [center.lng, center.lat],
        zoom: bounds ? 10 : 5,
        attributionControl: true,
      });
      mapRef.current = map;
      map.addControl(new mod.default.NavigationControl({ showCompass: false }));

      const markers: MarkerLike[] = [];

      map.on('load', () => {
        if (cancelled) return;

        const byDay = new Map<number, ResolvedVenue[]>();
        for (const v of located) {
          if (!byDay.has(v.day)) byDay.set(v.day, []);
          byDay.get(v.day)!.push(v);
        }

        const features: object[] = [];
        for (const [day, dayVenues] of byDay) {
          if (dayVenues.length < 2) continue;
          features.push({
            type: 'Feature',
            properties: { day, color: DAY_COLORS[(day - 1) % DAY_COLORS.length] },
            geometry: {
              type: 'LineString',
              coordinates: dayVenues.map((v) => [v.lng as number, v.lat as number]),
            },
          });
        }

        if (features.length > 0) {
          map.addSource('routes', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features },
          });
          map.addLayer({
            id: 'routes-line',
            type: 'line',
            source: 'routes',
            paint: {
              'line-color': ['get', 'color'],
              'line-width': 3,
              'line-opacity': 0.75,
              'line-dasharray': [2, 1.5],
            },
          });
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
                className="inline-flex items-center gap-1 min-h-[36px] px-2.5 py-1.5 text-xs rounded-md bg-white/10 hover:bg-white/15 text-teal-300 transition-colors"
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
                className="inline-flex items-center gap-1 min-h-[36px] px-2.5 py-1.5 text-xs rounded-md bg-white/10 hover:bg-white/15 text-cyan-300 transition-colors"
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
                className="inline-flex items-center gap-1 min-h-[36px] px-2.5 py-1.5 text-xs rounded-md bg-white/10 hover:bg-white/15 text-pink-300 transition-colors"
              >
                TikTok
              </a>
            )}
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="ml-auto min-h-[36px] px-3 text-slate-400 text-xs hover:text-white transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
