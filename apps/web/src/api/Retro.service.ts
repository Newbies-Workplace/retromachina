import {axiosInstance} from "./AxiosInstance";
import {RetroResponse} from "shared/model/retro/retro.response";
import {RetroCreateRequest} from "shared/model/retro/retro.request";

export const getRetrosByTeamId = (teamId: string): Promise<RetroResponse[]> => {
    return axiosInstance.get<RetroResponse[]>("retros", {
        params: {
            team_id: teamId
        }
    })
        .then(res => res.data)
}

export const getRetroByRetroId = (retroId: string) => {
    return axiosInstance.get<RetroResponse>(`retros/${retroId}`)
        .then(res => res.data);
}

export const createRetro = (request: RetroCreateRequest) => {
    return axiosInstance.post("/retros",request)
}
