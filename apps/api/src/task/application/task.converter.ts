import { Task } from '@prisma/client';
import { TaskResponse } from './model/task.response';

export const toTaskResponse = (task: Task): TaskResponse => {
  return {
    id: task.id,
    ownerId: task.owner_id,
    columnId: task.column_id,
    text: task.description,
  }
}