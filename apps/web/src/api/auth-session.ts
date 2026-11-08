import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";
import type { AuthResponse } from "shared/model/auth/Auth.interface";

const TOKEN_KEY = "Bearer";
const EXPIRY_KEY = "BearerExpiresAt";
const CHANGED_EVENT = "auth-token-changed";
const REFRESH_HEADER = "X-Requested-With";
const REFRESH_VALUE = "Retromachina";

let generation = 0;
let refreshInFlight: Promise<string | null> | null = null;
let refreshTimer: number | undefined;
let expiry = Number(localStorage.getItem(EXPIRY_KEY) || 0);
let clearAuthorizationHeader: (() => void) | undefined;
let setAuthorizationHeader: ((token: string) => void) | undefined;

window.addEventListener("storage", (event) => {
  if (event.key !== TOKEN_KEY && event.key !== EXPIRY_KEY) return;
  generation++;
  expiry = Number(localStorage.getItem(EXPIRY_KEY) || 0);
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) setAuthorizationHeader?.(token);
  else clearAuthorizationHeader?.();
  scheduleRefresh();
});

const apiUrl = process.env.RETRO_WEB_API_URL;

const notifyTokenChanged = () => window.dispatchEvent(new Event(CHANGED_EVENT));

export const setSession = (session: AuthResponse) => {
  generation++;
  expiry = session.expires_at;
  localStorage.setItem(TOKEN_KEY, session.access_token);
  localStorage.setItem(EXPIRY_KEY, String(expiry));
  setAuthorizationHeader?.(session.access_token);
  notifyTokenChanged();
  scheduleRefresh();
};

export const clearSession = () => {
  generation++;
  if (refreshTimer !== undefined) window.clearTimeout(refreshTimer);
  refreshTimer = undefined;
  expiry = 0;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EXPIRY_KEY);
  clearAuthorizationHeader?.();
  notifyTokenChanged();
};

export const getSessionGeneration = () => generation;

const refresh = async (): Promise<string | null> => {
  const currentGeneration = generation;
  const tokenAtStart = localStorage.getItem(TOKEN_KEY);
  const doRefresh = async () => {
    const existingToken = localStorage.getItem(TOKEN_KEY);
    const existingExpiry = Number(localStorage.getItem(EXPIRY_KEY) || 0);
    if (
      existingToken &&
      existingToken !== tokenAtStart &&
      existingExpiry > Date.now() + 30_000
    ) {
      expiry = existingExpiry;
      setAuthorizationHeader?.(existingToken);
      scheduleRefresh();
      return existingToken;
    }

    const response = await axios.post<AuthResponse>(
      `${apiUrl}auth/refresh`,
      undefined,
      {
        withCredentials: true,
        headers: { [REFRESH_HEADER]: REFRESH_VALUE },
        timeout: 5000,
      },
    );
    if (generation !== currentGeneration) return null;
    setSession(response.data);
    return response.data.access_token;
  };

  try {
    const locks = navigator.locks;
    return locks
      ? await locks.request("retromachina-auth-refresh", doRefresh)
      : await doRefresh();
  } catch (error) {
    const status = axios.isAxiosError(error)
      ? error.response?.status
      : undefined;
    if (generation === currentGeneration && status === 401) clearSession();
    else if (
      generation === currentGeneration &&
      localStorage.getItem(TOKEN_KEY)
    ) {
      scheduleRefresh(Math.min(10_000, Math.max(1_000, expiry - Date.now())));
    }
    return null;
  }
};

export const refreshSession = (): Promise<string | null> => {
  if (!refreshInFlight) {
    refreshInFlight = refresh().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
};

function scheduleRefresh(delay?: number) {
  if (refreshTimer !== undefined) window.clearTimeout(refreshTimer);
  if (!expiry) return;
  refreshTimer = window.setTimeout(
    () => void refreshSession(),
    delay ??
      (expiry - Date.now() > 60_000
        ? expiry - Date.now() - 60_000
        : Math.max(0, expiry - Date.now())),
  );
}

export const initializeSession = async () => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token && expiry > Date.now() + 30_000) {
    setAuthorizationHeader?.(token);
    scheduleRefresh();
    return token;
  }
  return refreshSession();
};

export const addAuthTokenChangedListener = (listener: () => void) => {
  window.addEventListener(CHANGED_EVENT, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(CHANGED_EVENT, listener);
    window.removeEventListener("storage", listener);
  };
};

const isAuthEndpoint = (url = "") =>
  /(?:google\/login|auth\/(?:refresh|logout))/.test(url);

export const installAuthInterceptors = (instance: AxiosInstance) => {
  setAuthorizationHeader = (token) => {
    instance.defaults.headers.common.Authorization = `Bearer ${token}`;
  };
  clearAuthorizationHeader = () => {
    delete instance.defaults.headers.common.Authorization;
  };
  instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      (
        config as InternalAxiosRequestConfig & { _authTokenAtAttempt?: string }
      )._authTokenAtAttempt = token;
    } else delete config.headers.Authorization;
    return config;
  });

  instance.interceptors.response.use(undefined, async (error) => {
    const config = error.config as
      | (InternalAxiosRequestConfig & {
          _authRetried?: boolean;
          _authTokenAtAttempt?: string;
        })
      | undefined;
    if (
      error.response?.status !== 401 ||
      !config ||
      isAuthEndpoint(config.url)
    ) {
      return Promise.reject(error);
    }

    if (config._authRetried) {
      if (
        config._authTokenAtAttempt &&
        localStorage.getItem(TOKEN_KEY) === config._authTokenAtAttempt
      ) {
        clearSession();
      }
      return Promise.reject(error);
    }

    config._authRetried = true;
    const token = await refreshSession();
    if (!token) return Promise.reject(error);
    if (token === config._authTokenAtAttempt) {
      clearSession();
      return Promise.reject(error);
    }
    config.headers.Authorization = `Bearer ${token}`;
    return instance.request(config);
  });
};

export const logoutSession = async () => {
  const revoke = async () => {
    clearSession();
    await axios.post(`${apiUrl}auth/logout`, undefined, {
      withCredentials: true,
      headers: { [REFRESH_HEADER]: REFRESH_VALUE },
      timeout: 5000,
    });
  };
  const locks = navigator.locks;
  if (locks) await locks.request("retromachina-auth-refresh", revoke);
  else await revoke();
};
