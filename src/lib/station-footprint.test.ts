import { describe, expect, it } from "vitest";
import { STATION_STATS_FALLBACK } from "./stations.functions";

describe("marketing station footprint", () => {
  it("keeps the full 224-station total independent of locator filtering", () => {
    expect(STATION_STATS_FALLBACK.stationsCount).toBe(224);
  });
});