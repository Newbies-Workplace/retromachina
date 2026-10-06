import { teamSlug } from "./team-slug";

describe("team slugs", () => {
  it.each([
    ["  Zespół Żółć — Łódź!  ", "zespol-zolc-lodz"],
    ["Café & Platform", "cafe-platform"],
    ["Hero", "hero-team"],
    ["🚀", "team-team"],
  ])("normalizes %s", (name, expected) =>
    expect(teamSlug(name)).toBe(expected));

  it("leaves room for collision suffixes", () => {
    expect(teamSlug("a".repeat(200))).toHaveLength(80);
  });
});
