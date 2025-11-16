export interface RetroCreateRequest {
  teamId: string;
  columns: {
    id?: string;
    name: string;
    desc: string | null;
  }[];
}
