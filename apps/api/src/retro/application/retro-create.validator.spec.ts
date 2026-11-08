import { BadRequestException } from "@nestjs/common";
import {
  MAX_COLUMN_NAME_LENGTH,
  MAX_RETRO_COLUMNS,
  validateRetroCreateRequest,
} from "./retro-create.validator";

const valid = () => ({
  teamId: "team",
  warmup: { mode: "none" },
  columns: [{ name: "Good", desc: null }],
});

describe("validateRetroCreateRequest", () => {
  it.each([
    valid(),
    { ...valid(), warmup: undefined },
    { ...valid(), warmup: { mode: "selected", warmupId: "warmup" } },
    { ...valid(), warmup: { mode: "deferred-random" } },
    { ...valid(), columns: [{ id: "c", name: "Good", desc: "Why" }] },
  ])("accepts %j", (request) => {
    expect(validateRetroCreateRequest(request)).toBe(request);
  });

  it.each([
    null,
    "text",
    { ...valid(), teamId: { not: "a string" } },
    { ...valid(), teamId: "" },
    { ...valid(), columns: [] },
    { ...valid(), columns: "Good" },
    { ...valid(), columns: [{ name: "", desc: null }] },
    { ...valid(), columns: [{ name: 42, desc: null }] },
    {
      ...valid(),
      columns: [{ name: "x".repeat(MAX_COLUMN_NAME_LENGTH + 1), desc: null }],
    },
    {
      ...valid(),
      columns: Array.from({ length: MAX_RETRO_COLUMNS + 1 }, () => ({
        name: "Column",
        desc: null,
      })),
    },
    { ...valid(), warmup: { mode: "selected" } },
    { ...valid(), warmup: { mode: "unknown" } },
  ])("rejects %j", (request) => {
    expect(() => validateRetroCreateRequest(request)).toThrow(
      BadRequestException,
    );
  });
});
