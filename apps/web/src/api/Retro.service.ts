import type { RetroCreateRequest } from "shared/model/retro/retro.request";
import type { RetroResponse } from "shared/model/retro/retro.response";
import { axiosInstance } from "@/api/AxiosInstance";

const getRetrosByTeamId = (teamId: string): Promise<RetroResponse[]> => {
  return axiosInstance
    .get<RetroResponse[]>("retros", {
      params: {
        team_id: teamId,
      },
    })
    .then((res) => res.data);
};

const getRetroByRetroId = (retroId: string) => {
  return axiosInstance
    .get<RetroResponse>(`retros/${retroId}`)
    .then((res) => res.data);
};

const createRetro = (request: RetroCreateRequest) => {
  return axiosInstance.post("/retros", request);
};

export const RetroService = {
  getRetrosByTeamId,
  getRetroByRetroId,
  createRetro,
};
