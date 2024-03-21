import type { Task } from "@prisma/client";
import type { TaskResponse } from "shared/model/task/task.response";

export const toTaskResponse = (task: Task): TaskResponse => {
  return {
    id: task.id,
    ownerId: task.owner_id,
    columnId: task.column_id,
    text: task.description,
  };
};
