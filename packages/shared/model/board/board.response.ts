import { TaskResponse } from "shared/model/task/task.response";
import { BoardColumnDto } from "./editBoard.dto";

export interface BoardResponse {
	columns: BoardColumnDto[];
	defaultColumnId: string;
	tasks: TaskResponse[];
}
