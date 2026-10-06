const RESERVED = new Set([
  "api",
  "www",
  "admin",
  "mail",
  "app",
  "assets",
  "static",
  "cdn",
  "hero",
  "signin",
  "loading",
  "privacy",
  "team",
  "retro",
  "invitation",
  "organizations",
  "gramophone",
  "404",
]);

export function teamSlug(name: string): string {
  const slug =
    name
      .trim()
      .toLowerCase()
      .replace(/ł/g, "l")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80)
      .replace(/-+$/g, "") || "team";
  return RESERVED.has(slug) ? `${slug}-team` : slug;
}

export function isReservedOrganizationSlug(slug: string): boolean {
  return RESERVED.has(slug);
}
