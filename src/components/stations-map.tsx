import { useEffect, useRef } from "react";

type Point = {
  id: string;
  lat: number;
  lng: number;
  title: string;
  subtitle?: string;
  href?: string;
};

type Props = {
  points: Point[];
  className?: string;
  center?: [number, number];
  zoom?: number;
  onSelect?: (id: string) => void;
  /** Current user position — rendered as a distinct blue pin, map pans to it. */
  userLocation?: { lat: number; lng: number } | null;
  userLabel?: string;
};

/**
 * Client-only Leaflet map (OpenStreetMap tiles, no API key).
 * Dynamically imports leaflet so SSR/build never touches window.
 */
export function StationsMap({
  points,
  className,
  center = [24.7136, 46.6753], // Riyadh
  zoom = 6,
  onSelect,
  userLocation = null,
  userLabel = "You are here",
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<unknown>(null);
  const layerRef = useRef<unknown>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!containerRef.current) return;
      const L = (await import("leaflet")).default;
      // Load CSS once
      const cssId = "leaflet-css";
      if (typeof document !== "undefined" && !document.getElementById(cssId)) {
        const link = document.createElement("link");
        link.id = cssId;
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
        link.crossOrigin = "";
        document.head.appendChild(link);
      }
      if (cancelled) return;
      if (!mapRef.current) {
        const map = L.map(containerRef.current, {
          center,
          zoom,
          scrollWheelZoom: false,
          zoomControl: true,
        });
        L.tileLayer(
          "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
          {
            attribution: "&copy; OpenStreetMap &copy; CARTO",
            maxZoom: 19,
            subdomains: "abcd",
          },
        ).addTo(map);
        mapRef.current = map;
      }
      const map = mapRef.current as import("leaflet").Map;
      if (layerRef.current) (layerRef.current as import("leaflet").LayerGroup).remove();

      const icon = L.divIcon({
        className: "gs-marker",
        html: `<span class="gs-marker-dot"></span><span class="gs-marker-pulse"></span>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });

      const markers = points
        .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng))
        .map((p) => {
          const m = L.marker([p.lat, p.lng], { icon, title: p.title });
          const html = `<div style="min-width:160px"><strong>${escapeHtml(p.title)}</strong>${
            p.subtitle ? `<div style="font-size:12px;opacity:.7;margin-top:2px">${escapeHtml(p.subtitle)}</div>` : ""
          }${
            p.href
              ? `<div style="margin-top:6px"><a href="${p.href}" target="_blank" rel="noreferrer" style="color:#ea580c;font-weight:600;font-size:12px">Directions →</a></div>`
              : ""
          }</div>`;
          m.bindPopup(html);
          if (onSelect) m.on("click", () => onSelect(p.id));
          return m;
        });
      const layers = [...markers];

      if (userLocation && Number.isFinite(userLocation.lat) && Number.isFinite(userLocation.lng)) {
        const userIcon = L.divIcon({
          className: "gs-marker",
          html: `<span class="gs-user-dot"></span><span class="gs-user-pulse"></span>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });
        const um = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon, title: userLabel });
        um.bindPopup(`<strong>${escapeHtml(userLabel)}</strong>`);
        layers.push(um);
      }

      const group = L.layerGroup(layers).addTo(map);
      layerRef.current = group;

      if (userLocation) {
        map.setView([userLocation.lat, userLocation.lng], 11);
      } else if (markers.length) {
        const bounds = L.latLngBounds(markers.map((m) => m.getLatLng()));
        map.fitBounds(bounds, { padding: [30, 30], maxZoom: 12 });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [points, center, zoom, onSelect, userLocation, userLabel]);

  useEffect(() => {
    return () => {
      const map = mapRef.current as import("leaflet").Map | null;
      if (map) map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={className ?? "h-[480px] w-full overflow-hidden rounded-xl"}
      style={{ background: "var(--muted)" }}
    />
  );
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
