import { describe, expect, it } from "vitest";
import { eventArgs, visitorCookies } from "./eventCookies";

const VID = "3f2b8c1e-9a4d-4e2b-8f1a-2c3d4e5f6a7b";
const base = { nocount: undefined, visitorId: undefined, testerParam: null, secure: true, newId: () => VID };

describe("visitorCookies", () => {
  it("creates a 180-day httpOnly visitor id when missing", () => {
    const [c] = visitorCookies(base);
    expect(c).toEqual({
      name: "llego_vid",
      value: VID,
      options: { httpOnly: true, sameSite: "lax", secure: true, path: "/", maxAge: 180 * 86400 },
    });
  });

  it("keeps an existing visitor id", () => {
    expect(visitorCookies({ ...base, visitorId: VID })).toEqual([]);
  });

  it("replaces a visitor id that isn't a UUID", () => {
    expect(visitorCookies({ ...base, visitorId: "nope", newId: () => "new" })[0].value).toBe("new");
  });

  it("sets a 90-day tester tag only for u1–u9", () => {
    const tag = (t: string) =>
      visitorCookies({ ...base, visitorId: VID, testerParam: t }).find((c) => c.name === "llego_t");
    expect(tag("u3")).toMatchObject({ value: "u3", options: { maxAge: 90 * 86400 } });
    for (const bad of ["u0", "u10", "U3", "<script>", "u3 ", ""]) expect(tag(bad)).toBeUndefined();
  });

  it("touches nothing once opted out", () => {
    expect(visitorCookies({ ...base, nocount: "1", testerParam: "u3" })).toEqual([]);
  });
});

describe("eventArgs", () => {
  const fields = { day_type: "laborable", slot: "04:45", limit_min: 0, state: "sin_margen" } as const;

  it("builds the RPC arguments, with no account or location", () => {
    expect(eventArgs("view", fields, { visitorId: VID, tester: "u3" })).toEqual({
      p_visitor_id: VID,
      p_tester: "u3",
      p_name: "view",
      p_day_type: "laborable",
      p_slot: "04:45",
      p_limit_min: 0,
      p_state: "sin_margen",
    });
  });

  it("sends nulls for fields a ride doesn't have", () => {
    expect(eventArgs("ride_logged", { day_type: "sabado", slot: "05:00" }, { visitorId: VID })).toMatchObject({
      p_tester: null,
      p_limit_min: null,
      p_state: null,
    });
  });

  it("drops a bad tester tag", () => {
    expect(eventArgs("view", fields, { visitorId: VID, tester: "admin" })?.p_tester).toBeNull();
  });

  it("logs nothing when opted out or without a visitor id", () => {
    expect(eventArgs("view", fields, { visitorId: VID, nocount: "1" })).toBeNull();
    expect(eventArgs("view", fields, {})).toBeNull();
    expect(eventArgs("view", fields, { visitorId: "not-a-uuid" })).toBeNull();
  });
});
