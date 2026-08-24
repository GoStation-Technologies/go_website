/** Straight-line (Haversine) distance in kilometres. */
export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

/** "1.2 km away" / "على بعد 1.2 كم" */
export function formatDistance(km: number, ar: boolean): string {
  const v = km < 10 ? km.toFixed(1) : Math.round(km).toString();
  return ar ? `على بعد ${v} كم` : `${v} km away`;
}
