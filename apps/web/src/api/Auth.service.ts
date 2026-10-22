import type {
  AuthParams,
  AuthResponse,
} from "shared/model/auth/Auth.interface";
import { axiosInstance, sessionAxiosInstance } from "@/api/AxiosInstance";

const loginGoogle = (params: AuthParams): Promise<AuthResponse> => {
  return axiosInstance
    .get<AuthResponse>("google/login", {
      params,
    })
    .then((res) => res.data);
};

export const AuthService = {
  loginGoogle,
  getSession: () =>
    sessionAxiosInstance
      .get<AuthResponse>("google/session")
      .then((res) => res.data),
  migrateSession: () =>
    axiosInstance.post<AuthResponse>("google/session").then((res) => res.data),
  logout: () => sessionAxiosInstance.post("google/logout"),
};
