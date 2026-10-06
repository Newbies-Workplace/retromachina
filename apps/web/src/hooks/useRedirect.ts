import dayjs from "dayjs";
import Cookies from "js-cookie";
import { organizationSubdomain } from "@/utils/organization-url";

const REDIRECT_COOKIE_NAME = "@redirect";
const domain = process.env.RETRO_WEB_ROOT_DOMAIN || "retromachine.eu";
const cookieOptions =
  window.location.hostname === domain ||
  (organizationSubdomain() && !window.location.hostname.endsWith(".localhost"))
    ? { domain, path: "/", secure: true, sameSite: "lax" as const }
    : { path: "/", sameSite: "lax" as const };

export const setRedirectPath = (path: string | null) => {
  let value = path;
  if (path === "/") {
    value = null;
  }

  Cookies.remove(REDIRECT_COOKIE_NAME, cookieOptions);

  if (value) {
    Cookies.set(REDIRECT_COOKIE_NAME, value, {
      ...cookieOptions,
      expires: dayjs().add(5, "m").toDate(),
    });
  }
};

export const getRedirectPath = (): string | null => {
  const path = Cookies.get(REDIRECT_COOKIE_NAME);
  if (!path) return null;
  try {
    const url = new URL(path, window.location.origin);
    const isProductionHost =
      url.hostname === domain ||
      (url.hostname.endsWith(`.${domain}`) &&
        !!organizationSubdomain(url.hostname));
    const isLocalHost =
      window.location.hostname === "localhost" &&
      (url.hostname === "localhost" || url.hostname.endsWith(".localhost")) &&
      url.port === window.location.port &&
      url.protocol === window.location.protocol;
    if (
      url.origin === window.location.origin ||
      isLocalHost ||
      (isProductionHost && url.protocol === "https:" && !url.port)
    )
      return url.href;
  } catch {
    /* Invalid redirect values are discarded. */
  }
  return null;
};
