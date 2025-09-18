import type { TaskResponse } from "shared/model/task/task.response";
import { axiosInstance } from "@/api/AxiosInstance";

export const getTasksByRetroId = async (
  retroId: string,
): Promise<TaskResponse[]> => {
  return axiosInstance
    .get("tasks", {
      params: {
        retro_id: retroId,
      },
    })
    .then((res) => res.data);
};
