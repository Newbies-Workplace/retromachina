export interface RetroTemplateResponse {
  id: number;
  name: string;
  desc: string | null;
  columns: {
    name: string;
    desc: string | null;
  }[];
}
