export function organizationSubdomain(
  hostname = window.location.hostname,
): string | null {
  const rootDomain = process.env.RETRO_WEB_ROOT_DOMAIN || "retromachine.eu";
  const base = hostname.endsWith(".localhost") ? "localhost" : rootDomain;
  if (!hostname.endsWith(`.${base}`)) return null;
  const slug = hostname.slice(0, -base.length - 1);
  return /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(slug) && slug !== "www"
    ? slug
    : null;
}

export function organizationUrl(slug: string, path = "/"): string {
  const rootDomain = process.env.RETRO_WEB_ROOT_DOMAIN || "retromachine.eu";
  if (
    window.location.hostname === "localhost" ||
    window.location.hostname.endsWith(".localhost")
  ) {
    return `http://${slug}.localhost:${window.location.port}${path}`;
  }
  return `https://${slug}.${rootDomain}${path}`;
}

export function organizationTeamUrl(
  organizationSlug: string,
  teamSlug: string,
): string {
  return organizationUrl(organizationSlug, `/${encodeURIComponent(teamSlug)}`);
}
