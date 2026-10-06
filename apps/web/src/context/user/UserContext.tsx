import { AxiosError } from "axios";
import type React from "react";
import { createContext, useCallback, useEffect, useState } from "react";
import type { AuthParams } from "shared/model/auth/Auth.interface";
import type { UserWithTeamsResponse } from "shared/model/user/user.response";
import { AuthService } from "@/api/Auth.service";
import {
  addAuthTokenChangedListener,
  clearSession,
  getSessionGeneration,
  initializeSession,
  logoutSession,
  setSession,
} from "@/api/auth-session";
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
  const [tokenRevision, setTokenRevision] = useState(0);

  useEffect(() => {
    return addAuthTokenChangedListener(() =>
      setTokenRevision((revision) => revision + 1),
    );
  }, []);

  const refreshUser = useCallback(async () => {
    const requestGeneration = getSessionGeneration();
    const requestToken = localStorage.getItem("Bearer");
    try {
      setIsFetchingUser(true);
      const response = await UserService.getMyUser();
      if (
        getSessionGeneration() === requestGeneration &&
        localStorage.getItem("Bearer") === requestToken
      ) {
        setUser(response);
      }
    } catch (error) {
      if (
        getSessionGeneration() !== requestGeneration ||
        localStorage.getItem("Bearer") !== requestToken
      ) {
        return;
      }
      if ((error as AxiosError)?.status === 401) {
        setUser(null);
      } else {
        console.error(error);
      }
    } finally {
      setIsFetchingUser(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void initializeSession().then((token) => {
      if (active && token) void refreshUser();
      else if (active) setIsFetchingUser(false);
    });
    return () => {
      active = false;
    };
  }, [refreshUser]);

  useEffect(() => {
    if (tokenRevision === 0) return;
    if (localStorage.getItem("Bearer")) void refreshUser();
    else setUser(null);
  }, [refreshUser, tokenRevision]);

  const login = useCallback(async (params: AuthParams) => {
    const session = await AuthService.loginGoogle(params);
    setSession(session);
    const loginGeneration = getSessionGeneration();
    setIsFetchingUser(true);
    try {
      const response = await UserService.getMyUser();
      if (
        getSessionGeneration() === loginGeneration &&
        localStorage.getItem("Bearer") === session.access_token
      ) {
        setUser(response);
      }
    } finally {
      setIsFetchingUser(false);
    }
  }, []);

  const logout = useCallback(async () => {
    const version = localStorage.getItem(VERSION_KEY);
    const changelogDisabled = localStorage.getItem(DISABLED_KEY);
    try {
      await logoutSession();
    } finally {
      window.localStorage.clear();
      if (version !== null) localStorage.setItem(VERSION_KEY, version);
      if (changelogDisabled !== null)
        localStorage.setItem(DISABLED_KEY, changelogDisabled);
      clearSession();
      setUser(null);
    }
  }, []);

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
