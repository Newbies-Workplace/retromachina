import type {
  AuthParams,
  AuthResponse,
} from "shared/model/auth/Auth.interface";
import { axiosInstance } from "@/api/AxiosInstance";

const loginGoogle = (params: AuthParams): Promise<AuthResponse> => {
  return axiosInstance
    .get<AuthResponse>("google/login", {
      params,
    })
    .then((res) => res.data);
};

export const AuthService = {
  loginGoogle,
};
