import {axiosInstance} from "../AxiosInstance";
import {AuthParams, AuthResponse} from "./Auth.interface";

export const loginGoogle = (params: AuthParams): Promise<AuthResponse> => {
    return axiosInstance.get<AuthResponse>("google/login", {
        params
    })
        .then(res => res.data)
}