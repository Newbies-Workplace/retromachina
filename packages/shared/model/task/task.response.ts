export interface TaskResponse {
  id: string;
  ownerId: string | null;
  columnId: string;
  text: string;
  createdAt: Date;
  updatedAt: Date;
}
