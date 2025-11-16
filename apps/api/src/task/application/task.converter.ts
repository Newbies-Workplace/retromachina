import { Task } from "generated/prisma/client";
import { TaskResponse } from "shared/model/task/task.response";

export const toTaskResponse = (task: Task): TaskResponse => {
  return {
    id: task.id,
    ownerId: task.owner_id,
    columnId: task.column_id,
    text: task.description,
    createdAt: task.created_at,
    updatedAt: task.updated_at,
  };
};
