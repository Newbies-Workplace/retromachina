import { axiosInstance } from "../AxiosInstance";
import {UserInTeamResponse, UserWithTeamsResponse} from "shared/model/user/user.response";

export const getMyUser = (): Promise<UserWithTeamsResponse> => {
  return axiosInstance.get<UserWithTeamsResponse>("users/@me").then((res) => res.data);
};

export const getUsersByTeamId = async (
  teamId: string
): Promise<UserInTeamResponse[]> => {
  return axiosInstance
    .get<UserInTeamResponse[]>(`users?team_id=${teamId}`)
    .then((res) => res.data);
};
