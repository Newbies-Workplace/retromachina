import { validate } from "./roomstate.validator";

describe("room state validator", () => {
  test("accepts warmup as a valid room state", () => {
    expect(validate("warmup")).toBe(true);
  });
});
