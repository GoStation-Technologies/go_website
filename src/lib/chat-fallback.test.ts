import { describe, expect, it } from "vitest";
import { generalChatFallback, matchingStations, type FallbackStation } from "./chat-fallback";
const station: FallbackStation = {name_ar: "GO1 - الرياض",name_en:"GO1 - Riyadh",city_ar:"الرياض",city_en:"Riyadh",services:["cafe","car_wash","atm","restaurant"],is_active:true};
describe("local station knowledge", () => {
  it.each(["كافيه", "غسيل", "صراف"])("matches %s to recorded service codes", keyword => {
    expect(matchingStations(keyword,[station]).map(s=>s.name_en)).toEqual(["GO1 - Riyadh"]);
  });
  it("requires an explicit Romansiah brand rather than any restaurant", () => {
    expect(matchingStations("في أي محطة أجد مطعم الرومانسية",[station])).toEqual([]);
    expect(matchingStations("الرومانسية",[{...station,services:["الرومانسية"]}])).toHaveLength(1);
  });
  it("applies city and service together", () => {
    expect(matchingStations("كافيه الرياض",[station,{...station,name_en:"GO2 - Jeddah",city_ar:"جدة",city_en:"Jeddah"}]).map(s=>s.name_en)).toEqual(["GO1 - Riyadh"]);
  });
  it("provides the specified customer-service number without inventing station matches", () => {
    expect(generalChatFallback("ar").includes("920007168")).toBe(true);
    expect(matchingStations("كافيه",[{...station,services:[]}])).toEqual([]);
  });
});