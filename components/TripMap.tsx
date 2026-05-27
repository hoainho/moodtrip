import { useEffect, useRef, useState } from 'react';
import type { ItineraryPlan } from '../types';
import { computeBounds, resolveVenues, type ResolvedVenue } from '../services/venueResolver';

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

export function TripMap({ itinerary }: TripMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);
  const [venues, setVenues] = useState<ResolvedVenue[]>([]);
  const [selected, setSelected] = useState<ResolvedVenue | null>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    setVenues(resolveVenues(itinerary));
  }, [itinerary]);

  useEffect(() => {
    if (!containerRef.current || venues.length === 0) return;
    let cancelled = false;
    (async () => {
      type MarkerLike = {
        setLngLat: (ll: [number, number]) => MarkerLike;
        addTo: (map: unknown) => MarkerLike;
        getElement: () => HTMLElement;
      };
      const mod = (await import('maplibre-gl')) as unknown as {
        default: {
          Map: new (opts: unknown) => {
            fitBounds: (b: number[][], opts?: unknown) => void;
            remove: () => void;
            on: (ev: string, fn: () => void) => void;
            addControl: (c: unknown) => void;
          };
          NavigationControl: new (opts?: unknown) => unknown;
          Marker: new (opts?: unknown) => MarkerLike;
        };
      };
      await import('maplibre-gl/dist/maplibre-gl.css');
      if (cancelled || !containerRef.current) return;

      const bounds = computeBounds(venues);
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

      map.on('load', () => {
        if (cancelled) return;
        for (const v of venues) {
          if (v.lat == null || v.lng == null) continue;
          const el = document.createElement('button');
          el.className =
            'w-7 h-7 rounded-full bg-teal-500 border-2 border-white shadow-md text-white text-xs font-bold flex items-center justify-center';
          el.textContent = String(v.day);
          el.setAttribute('aria-label', `${v.name} - Ngày ${v.day}`);
          el.onclick = () => setSelected(v);
          new mod.default.Marker({ element: el }).setLngLat([v.lng, v.lat]).addTo(map);
        }
        if (bounds && venues.filter((v) => v.lat != null).length > 1) {
          map.fitBounds(
            [
              [bounds.west, bounds.south],
              [bounds.east, bounds.north],
            ],
            { padding: 48, maxZoom: 13, duration: 0 },
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

  if (venues.filter((v) => v.lat != null).length === 0) {
    return (
      <div className="rounded-2xl glass-dark border border-white/10 p-6 text-center text-slate-400 text-sm">
        Không có toạ độ địa điểm trong lịch trình này — bản đồ chưa hiển thị được.
      </div>
    );
  }

  return (
    <div className="relative rounded-2xl overflow-hidden border border-white/10">
      <div ref={containerRef} className="w-full h-72 sm:h-96 bg-slate-900" aria-label="Bản đồ chuyến đi" />
      {!mapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/70 text-slate-400 text-sm pointer-events-none">
          Đang tải bản đồ…
        </div>
      )}
      {selected && (
        <div className="absolute bottom-3 left-3 right-3 p-3 rounded-xl bg-slate-950/90 border border-teal-500/30 backdrop-blur">
          <p className="text-white font-medium text-sm mb-1">
            Ngày {selected.day} · {selected.time}
          </p>
          <p className="text-slate-300 text-xs mb-2">{selected.name}</p>
          <div className="flex flex-wrap gap-2">
            {selected.mapsLink && (
              <a
                href={selected.mapsLink}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2 py-1 text-xs rounded-md bg-white/10 hover:bg-white/15 text-teal-300"
              >
                Mở Google Maps ↗
              </a>
            )}
            {selected.tiktokQuery && (
              <a
                href={selected.tiktokQuery}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2 py-1 text-xs rounded-md bg-white/10 hover:bg-white/15 text-pink-300"
              >
                Xem TikTok về địa điểm ↗
              </a>
            )}
            <button
              onClick={() => setSelected(null)}
              className="ml-auto text-slate-400 text-xs hover:text-white"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
