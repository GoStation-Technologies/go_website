/**
 * Server-only Dataverse → database sync for GoStation locations.
 *
 * Pulls every `ah_locationses` record, upserts the distinct area values into
 * `public.regions`, then upserts the stations themselves keyed by
 * `dataverse_id` (= `ah_locationsid`).
 */

type DvRow = Record<string, unknown>;

/** The 13 official KSA provinces as encoded in the Dataverse `ah_region` option set. */
const MASTER_REGION_CODES: Record<number, string> = {
  120870000: "الرياض",
  120870001: "الشرقية",
  120870002: "عسير",
  120870003: "مكة المكرمة",
  120870004: "نجران",
  120870005: "جازان",
  120870006: "تبوك",
  120870007: "المدينة المنورة",
  120870008: "الحدود الشمالية",
  120870009: "حائل",
  120870010: "الباحة",
  120870011: "القصيم",
  120870012: "الجوف",
};

const STATUS_LABELS: Record<number, string> = {
  120870000: "مفتوحة",
  120870001: "مغلقة",
  120870002: "تحت التطوير",
  120870003: "تحت التاهيل",
  120870004: "تحت الانشاء",
  120870005: "اخرى",
};

/** Dataverse `ah_stationsitems` multi-select option set → internal fuel codes. */
const FUEL_CODES: Record<number, string> = {
  120870000: "91",
  120870001: "95",
  120870003: "98",
  120870002: "diesel",
  120870004: "kerosene",
};

/** Parse "120870000,120870001" into distinct internal fuel codes. */
function parseFuelTypes(v: unknown): string[] {
  if (typeof v !== "string" || !v.trim()) return [];
  const out = new Set<string>();
  for (const part of v.split(",")) {
    const code = FUEL_CODES[Number(part.trim())];
    if (code) out.add(code);
  }
  return [...out];
}

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);

async function getAccessToken(tenantId: string, clientId: string, clientSecret: string, resource: string) {
  const res = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
      scope: `${resource}/.default`,
    }),
  });
  if (!res.ok) throw new Error(`oauth ${res.status}`);
  const json = (await res.json()) as { access_token?: string };
  if (!json.access_token) throw new Error("no access_token");
  return json.access_token;
}

async function fetchAllLocations(apiUrl: string, token: string): Promise<DvRow[]> {
  const rows: DvRow[] = [];
  let next: string | null = apiUrl;
  let guard = 0;
  while (next && guard++ < 50) {
    const res: Response = await fetch(next, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "OData-Version": "4.0",
        "OData-MaxVersion": "4.0",
        Prefer: "odata.maxpagesize=5000",
      },
    });
    if (!res.ok) throw new Error(`dataverse ${res.status}`);
    const payload = (await res.json()) as { value?: DvRow[]; "@odata.nextLink"?: string };
    rows.push(...(payload.value ?? []));
    next = payload["@odata.nextLink"] ?? null;
  }
  return rows;
}

export type SyncResult = {
  ok: boolean;
  fetched: number;
  regions: number;
  stationsUpserted: number;
  error?: string;
};

export async function syncDataverseLocations(): Promise<SyncResult> {
  const tenantId = process.env["DATAVERSE_TENANT_ID"];
  const clientId = process.env["DATAVERSE_CLIENT_ID"];
  const clientSecret = process.env["DATAVERSE_CLIENT_SECRET"];
  const apiUrl = process.env["DATAVERSE_API_URL"];
  if (!tenantId || !clientId || !clientSecret || !apiUrl) {
    return { ok: false, fetched: 0, regions: 0, stationsUpserted: 0, error: "missing_dataverse_env" };
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const resource = new URL(apiUrl).origin;
  const token = await getAccessToken(tenantId, clientId, clientSecret, resource);
  const rows = await fetchAllLocations(apiUrl, token);
  if (rows.length === 0) {
    return { ok: false, fetched: 0, regions: 0, stationsUpserted: 0, error: "empty_payload" };
  }

  // 1. Distinct dynamic areas (city values) + the 13 master provinces.
  const areaNames = new Set<string>();
  for (const r of rows) {
    const city = str(r["ah_city"]);
    if (city) areaNames.add(city);
  }
  const masterNames = new Set(Object.values(MASTER_REGION_CODES));

  const regionRows = [
    ...[...areaNames].map((name) => ({
      name,
      name_ar: name,
      is_master_ksa: masterNames.has(name),
    })),
  ];
  if (regionRows.length) {
    const { error } = await supabaseAdmin
      .from("regions")
      .upsert(regionRows, { onConflict: "name", ignoreDuplicates: true });
    if (error) throw new Error(`regions upsert: ${error.message}`);
  }

  const { data: allRegions, error: regionsErr } = await supabaseAdmin
    .from("regions")
    .select("id, name, dataverse_code");
  if (regionsErr) throw new Error(`regions read: ${regionsErr.message}`);

  const byName = new Map((allRegions ?? []).map((r) => [r.name, r.id]));
  const byCode = new Map(
    (allRegions ?? []).filter((r) => r.dataverse_code !== null).map((r) => [r.dataverse_code as number, r.id]),
  );

  // 2. Stations upsert keyed by dataverse_id.
  const stationRows = rows
    .map((r) => {
      const dataverseId = str(r["ah_locationsid"]);
      if (!dataverseId) return null;
      const city = str(r["ah_city"]);
      const statusCode = num(r["ah_stationstatus"]);
      const status = statusCode !== null ? (STATUS_LABELS[statusCode] ?? null) : null;
      const nameAr = str(r["ah_lastname"]) ?? str(r["ah_gocode"]) ?? "GoStation";
      const nameEn = str(r["ah_gocode"]) ?? nameAr;
      const regionCode = num(r["ah_region"]);
      return {
        dataverse_id: dataverseId,
        name_ar: nameAr,
        name_en: nameEn,
        city_ar: city ?? "—",
        city_en: city ?? "—",
        district_ar: str(r["ah_district"]),
        district_en: str(r["ah_district"]),
        address_ar: str(r["ah_street"]),
        address_en: str(r["ah_street"]),
        fuel_types: parseFuelTypes(r["ah_stationsitems"]),
        lat: num(r["ah_latitudey"]),
        lng: num(r["ah_longitudex"]),
        status,
        is_active: status === "مفتوحة",
        region_id: city ? (byName.get(city) ?? null) : null,
        master_region_id: regionCode !== null ? (byCode.get(regionCode) ?? null) : null,
        updated_at: new Date().toISOString(),
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  let upserted = 0;
  for (let i = 0; i < stationRows.length; i += 200) {
    const chunk = stationRows.slice(i, i + 200);
    const { error } = await supabaseAdmin
      .from("stations")
      .upsert(chunk, { onConflict: "dataverse_id" });
    if (error) throw new Error(`stations upsert: ${error.message}`);
    upserted += chunk.length;
  }

  return { ok: true, fetched: rows.length, regions: regionRows.length, stationsUpserted: upserted };
}
