import { createServerFn } from "@tanstack/react-start";

export type DataverseStats = { stations: number; regions: number; fallback: boolean };

const FALLBACK: DataverseStats = { stations: 180, regions: 13, fallback: true };

/**
 * Counts stations and distinct regions from Microsoft Dataverse.
 * Credentials stay server-side; the client only receives the two numbers.
 */
export const getDataverseStats = createServerFn({ method: "GET" }).handler(
  async (): Promise<DataverseStats> => {
    const tenantId = process.env["DATAVERSE_TENANT_ID"];
    const clientId = process.env["DATAVERSE_CLIENT_ID"];
    const clientSecret = process.env["DATAVERSE_CLIENT_SECRET"];
    const apiUrl = process.env["DATAVERSE_API_URL"];

    if (!tenantId || !clientId || !clientSecret || !apiUrl) return FALLBACK;

    try {
      const resource = new URL(apiUrl).origin;
      const tokenRes = await fetch(
        `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
        {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            grant_type: "client_credentials",
            client_id: clientId,
            client_secret: clientSecret,
            scope: `${resource}/.default`,
          }),
        },
      );
      if (!tokenRes.ok) throw new Error(`token ${tokenRes.status}`);
      const token = ((await tokenRes.json()) as { access_token?: string }).access_token;
      if (!token) throw new Error("no access_token");

      const res = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "OData-Version": "4.0",
          "OData-MaxVersion": "4.0",
          Prefer: "odata.maxpagesize=5000",
        },
      });
      if (!res.ok) throw new Error(`dataverse ${res.status}`);
      const payload = (await res.json()) as { value?: Array<Record<string, unknown>> };
      const rows = payload.value ?? [];
      if (rows.length === 0) return FALLBACK;

      // Region field name is not guaranteed; pick the first key that looks regional.
      const sample = rows[0]!;
      const regionKey = Object.keys(sample).find((k) =>
        /(region|province|area|governorate|city)/i.test(k) && !k.startsWith("_") && !/@/.test(k),
      );

      const regions = new Set<string>();
      if (regionKey) {
        for (const r of rows) {
          const v = r[regionKey];
          if (typeof v === "string" && v.trim()) regions.add(v.trim().toLowerCase());
          else if (typeof v === "number") regions.add(String(v));
        }
      }

      return {
        stations: rows.length,
        regions: regions.size || FALLBACK.regions,
        fallback: false,
      };
    } catch (err) {
      console.error("[dataverse] stats fetch failed:", err);
      return FALLBACK;
    }
  },
);
