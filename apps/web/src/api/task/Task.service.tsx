import { axiosInstance } from "../AxiosInstance";
import {TaskResponse} from "./Task.interface";

export const getTasksByRetroId = async (retroId: string): Promise<TaskResponse[]> => {
    return axiosInstance.get(`tasks`, {
        params: {
            retro_id: retroId
        }
    }).then(res => res.data);
}