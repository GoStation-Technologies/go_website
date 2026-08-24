import { useCallback, useEffect, useState } from "react";

export type Coords = { lat: number; lng: number };
export type GeoStatus = "idle" | "prompting" | "granted" | "denied" | "unavailable";

/**
 * Browser geolocation with graceful fallback.
 * `auto` requests the position once on mount (client-only).
 */
export function useGeolocation(auto = false) {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [status, setStatus] = useState<GeoStatus>("idle");

  const request = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("unavailable");
      return;
    }
    setStatus("prompting");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setStatus("granted");
      },
      () => setStatus("denied"),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
    );
  }, []);

  useEffect(() => {
    if (auto) request();
  }, [auto, request]);

  return { coords, status, request };
}
