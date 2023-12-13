import {TaskResponse} from "../task/Task.interface";

export interface Board {
    columns: BoardColumn[]
    defaultColumnId: string
    tasks: TaskResponse[]
}

export interface BoardColumn {
    id: string
    name: string
    color: string
    order: number
}