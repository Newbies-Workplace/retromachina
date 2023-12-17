import { axiosInstance } from "../AxiosInstance";
import {TaskResponse} from "shared/model/task/task.response";

export const getTasksByRetroId = async (retroId: string): Promise<TaskResponse[]> => {
    return axiosInstance.get(`tasks`, {
        params: {
            retro_id: retroId
        }
    }).then(res => res.data);
}
