export interface TaskCreatedEvent {
  taskId: string;
  columnId: string;
  ownerId: string;
  text: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskUpdatedEvent {
  taskId: string;
  columnId: string;
  ownerId: string;
  text: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskDeletedEvent {
  taskId: string;
}
