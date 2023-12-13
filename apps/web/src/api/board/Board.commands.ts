export interface TaskCreateCommand {
    taskId: string
    columnId: string
    ownerId: string
    text: string
}

export interface TaskUpdateCommand {
    taskId: string
    columnId?: string
    ownerId?: string
    text?: string
}

export interface TaskDeleteCommand {
    taskId: string
}