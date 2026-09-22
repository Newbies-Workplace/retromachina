import type { WarmupSelection } from "../warmup/warmup";

export interface RetroCreateRequest {
  teamId: string;
  warmup: WarmupSelection;
  columns: {
    id?: string;
    name: string;
    desc: string | null;
  }[];
}
