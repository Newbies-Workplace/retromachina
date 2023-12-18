import { BoardColumnDto } from './editBoard.dto';
import { TaskResponse } from 'shared/model/task/task.response';

export interface BoardResponse {
  columns: BoardColumnDto[]
  defaultColumnId: string
  tasks: TaskResponse[]
}
