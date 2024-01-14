import { AuthParams, AuthResponse } from "shared/model/auth/Auth.interface";
import { axiosInstance } from "./AxiosInstance";

export const loginGoogle = (params: AuthParams): Promise<AuthResponse> => {
	return axiosInstance
		.get<AuthResponse>("google/login", {
			params,
		})
		.then((res) => res.data);
};
