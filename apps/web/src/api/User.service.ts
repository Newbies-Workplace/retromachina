import type {
  UserInTeamResponse,
  UserWithTeamsResponse,
} from "shared/model/user/user.response";
import { axiosInstance } from "@/api/AxiosInstance";

export const getMyUser = (): Promise<UserWithTeamsResponse> => {
  return axiosInstance
    .get<UserWithTeamsResponse>("users/@me")
    .then((res) => res.data);
};

export const getUsersByTeamId = async (
  teamId: string,
): Promise<UserInTeamResponse[]> => {
  return axiosInstance
    .get<UserInTeamResponse[]>(`users?team_id=${teamId}`)
    .then((res) => res.data);
};
