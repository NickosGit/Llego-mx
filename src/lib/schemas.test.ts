import { describe, expect, it } from "vitest";
import { z } from "zod";
import { tripIdSchema, tripSchema } from "./schemas";

const valid = { dia: "martes", slot: "04:45", wait_min: "16", ride_min: "34", seated: "no" };

function errors(input: object) {
  const result = tripSchema.safeParse(input);
  return result.success ? {} : z.flattenError(result.error).fieldErrors;
}

describe("tripSchema", () => {
  it("accepts a valid ride and converts its minutes", () => {
    expect(tripSchema.parse(valid)).toEqual({ ...valid, wait_min: 16, ride_min: 34 });
  });

  it("accepts the limits", () => {
    expect(tripSchema.safeParse({ ...valid, wait_min: "0", ride_min: "5" }).success).toBe(true);
    expect(tripSchema.safeParse({ ...valid, wait_min: "180", ride_min: "300" }).success).toBe(true);
  });

  it("rejects -5, 999 and a blank seated with Spanish errors", () => {
    const fields = errors({ ...valid, seated: undefined, wait_min: "-5", ride_min: "999" });
    expect(fields.wait_min).toEqual(["Escribe un número entero de 0 a 180."]);
    expect(fields.ride_min).toEqual(["Escribe un número entero de 5 a 300."]);
    expect(fields.seated).toEqual(["Dinos si fuiste sentado."]);
  });

  it("does not read an empty field as 0 minutes", () => {
    expect(errors({ ...valid, wait_min: "" }).wait_min).toBeDefined();
    expect(errors({ ...valid, wait_min: "   " }).wait_min).toBeDefined();
  });

  it("rejects decimals and text", () => {
    expect(errors({ ...valid, ride_min: "33.5" }).ride_min).toBeDefined();
    expect(errors({ ...valid, ride_min: "mucho" }).ride_min).toBeDefined();
  });

  it("rejects slots off the 15-minute list", () => {
    expect(errors({ ...valid, slot: "04:47" }).slot).toBeDefined();
    expect(errors({ ...valid, slot: "02:45" }).slot).toBeDefined();
  });

  it("drops fields it doesn't know, like a forged user_id", () => {
    const parsed = tripSchema.parse({ ...valid, user_id: "someone-else", is_simulated: "true" });
    expect(parsed).not.toHaveProperty("user_id");
    expect(parsed).not.toHaveProperty("is_simulated");
  });
});

describe("tripIdSchema", () => {
  it("only accepts a uuid", () => {
    expect(tripIdSchema.safeParse("not-a-uuid").success).toBe(false);
    expect(tripIdSchema.safeParse("3f2b8c1e-7a4d-4e9b-8c21-5d6f7a8b9c0d").success).toBe(true);
  });
});
