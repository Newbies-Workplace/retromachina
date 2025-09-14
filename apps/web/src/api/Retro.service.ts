import type { RetroCreateRequest } from "shared/model/retro/retro.request";
import type { RetroResponse } from "shared/model/retro/retro.response";
import { axiosInstance } from "@/api/AxiosInstance";

export const getRetrosByTeamId = (teamId: string): Promise<RetroResponse[]> => {
  return axiosInstance
    .get<RetroResponse[]>("retros", {
      params: {
        team_id: teamId,
      },
    })
    .then((res) => res.data);
};

export const getRetroByRetroId = (retroId: string) => {
  return axiosInstance
    .get<RetroResponse>(`retros/${retroId}`)
    .then((res) => res.data);
};

export const createRetro = (request: RetroCreateRequest) => {
  return axiosInstance.post("/retros", request);
};
