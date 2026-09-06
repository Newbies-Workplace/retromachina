import type { UserRole } from "shared/model/user/user.role";

export interface ActiveBoardUser {
  userId: string;
  avatar_link: string;
  role: UserRole;
}

export interface BoardSyncEvent {
  users: ActiveBoardUser[];
}

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
