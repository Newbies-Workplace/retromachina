import type {
  AuthParams,
  AuthResponse,
} from "shared/model/auth/Auth.interface";
import { axiosInstance } from "@/api/AxiosInstance";

const loginRequests = new Map<string, Promise<AuthResponse>>();

const loginGoogle = (params: AuthParams): Promise<AuthResponse> => {
  const key = JSON.stringify(params);
  const existing = loginRequests.get(key);
  if (existing) return existing;
  const request = axiosInstance
    .get<AuthResponse>("google/login", { params, withCredentials: true })
    .then((res) => res.data);
  loginRequests.set(key, request);
  void request.catch(() => loginRequests.delete(key));
  return request;
};

export const AuthService = {
  loginGoogle,
};
