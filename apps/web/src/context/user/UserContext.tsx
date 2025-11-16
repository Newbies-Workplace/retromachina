import { AxiosError } from "axios";
import type React from "react";
import { createContext, useEffect, useState } from "react";
import type { AuthParams } from "shared/model/auth/Auth.interface";
import type { UserWithTeamsResponse } from "shared/model/user/user.response";
import { AuthService } from "@/api/Auth.service";
import { axiosInstance } from "@/api/AxiosInstance";
import { UserService } from "@/api/User.service";

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

export const UserContextProvider: React.FC<any> = ({ children }) => {
  const [user, setUser] = useState<UserWithTeamsResponse | null>(null);
  const [isFetchingUser, setIsFetchingUser] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("Bearer");

    if (token && !user) {
      refreshUser();
    } else {
      setIsFetchingUser(false);
    }
  }, []);

  const refreshUser = async () => {
    try {
      setIsFetchingUser(true);
      const response = await UserService.getMyUser();
      setUser(response);
    } catch (error) {
      if ((error as AxiosError)?.status === 401) {
        setUser(null);
      } else {
        console.error(error);
      }
    } finally {
      setIsFetchingUser(false);
    }
  };

  const login = (params: AuthParams) => {
    return AuthService.loginGoogle(params)
      .then((res) => {
        localStorage.setItem("Bearer", res.access_token);

        axiosInstance.defaults.headers.Authorization = `Bearer ${res.access_token}`;
        setIsFetchingUser(true);
        UserService.getMyUser()
          .then((response) => {
            setUser(response);
          })
          .finally(() => {
            setIsFetchingUser(false);
          });
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const logout = async () => {
    window.localStorage.clear();
    setUser(null);
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
