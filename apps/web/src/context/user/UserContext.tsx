import { AxiosError } from "axios";
import type React from "react";
import { createContext, useCallback, useEffect, useRef, useState } from "react";
import type {
  AuthParams,
  AuthResponse,
} from "shared/model/auth/Auth.interface";
import type { UserWithTeamsResponse } from "shared/model/user/user.response";
import { AuthService } from "@/api/Auth.service";
import { axiosInstance } from "@/api/AxiosInstance";
import { setAccessToken } from "@/api/session-token";
import { UserService } from "@/api/User.service";
import { DISABLED_KEY, VERSION_KEY } from "@/store/useChangelogStore";

interface UserContext {
  user: UserWithTeamsResponse | null;
  isFetchingUser: boolean;
  refreshUser: () => Promise<void>;
  login: (params: AuthParams) => Promise<void>;
  logout: () => Promise<void>;
}

export const UserContext = createContext<UserContext>({
  user: null,
  isFetchingUser: false,
  refreshUser: () => {
    return Promise.reject();
  },
  login: () => {
    return Promise.reject();
  },
  logout: () => {
    return Promise.reject();
  },
});

export const UserContextProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const [user, setUser] = useState<UserWithTeamsResponse | null>(null);
  const [isFetchingUser, setIsFetchingUser] = useState(true);

  const restoring = useRef(false);

  const clearAuthentication = useCallback(() => {
    setAccessToken(null);
    delete axiosInstance.defaults.headers.Authorization;
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      setUser(await UserService.getMyUser());
    } catch (error) {
      if ((error as AxiosError).response?.status === 401) clearAuthentication();
      else throw error;
    }
  }, [clearAuthentication]);

  const restoreSession = useCallback(async () => {
    if (restoring.current) return;
    restoring.current = true;
    try {
      let response: AuthResponse;
      try {
        response = await AuthService.getSession();
      } catch (error) {
        const isLegacySession =
          localStorage.getItem("Bearer") &&
          localStorage.getItem("shared-session") !== "true";
        if ((error as AxiosError).response?.status !== 401 || !isLegacySession)
          throw error;
        response = await AuthService.migrateSession();
      }
      setAccessToken(response.access_token);
      localStorage.setItem("shared-session", "true");
      axiosInstance.defaults.headers.Authorization = `Bearer ${response.access_token}`;
      await refreshUser();
    } catch (error) {
      if ((error as AxiosError).response?.status === 401) clearAuthentication();
      else console.error(error);
    } finally {
      restoring.current = false;
      setIsFetchingUser(false);
    }
  }, [clearAuthentication, refreshUser]);

  useEffect(() => {
    if (window.location.pathname !== "/loading") void restoreSession();
    const onVisible = () => {
      if (document.visibilityState === "visible") void restoreSession();
    };
    window.addEventListener("focus", onVisible);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [restoreSession]);

  const login = useCallback(
    async (params: AuthParams) => {
      setIsFetchingUser(true);
      try {
        const response = await AuthService.loginGoogle(params);
        setAccessToken(response.access_token);
        localStorage.setItem("shared-session", "true");
        axiosInstance.defaults.headers.Authorization = `Bearer ${response.access_token}`;
        await refreshUser();
      } finally {
        setIsFetchingUser(false);
      }
    },
    [refreshUser],
  );

  const logout = async () => {
    await AuthService.logout();
    const version = localStorage.getItem(VERSION_KEY);
    const changelogDisabled = localStorage.getItem(DISABLED_KEY);
    window.localStorage.clear();
    localStorage.setItem("shared-session", "true");
    if (version !== null) localStorage.setItem(VERSION_KEY, version);
    if (changelogDisabled !== null)
      localStorage.setItem(DISABLED_KEY, changelogDisabled);
    clearAuthentication();
  };

  return (
    <UserContext.Provider
      value={{
        user: user,
        isFetchingUser: isFetchingUser,
        refreshUser: refreshUser,
        login: login,
        logout: logout,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
