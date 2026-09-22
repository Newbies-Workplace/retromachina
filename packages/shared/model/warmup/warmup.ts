export interface WarmupLink {
  id: string;
  name: string;
  description: string | null;
  url: string;
}

export interface WarmupLinkResponse extends WarmupLink {
  source: "default" | "team";
}

export interface WarmupLinkRequest {
  name: string;
  description?: string | null;
  url: string;
}

export type WarmupSelection =
  | { mode: "none" }
  | { mode: "selected"; warmupId: string }
  | { mode: "deferred-random" };

export type WarmupStatus = "pending" | "spinning" | "revealed";

export interface WarmupState {
  candidates: WarmupLink[];
  status: WarmupStatus;
  selectedWarmupId: string | null;
  result: WarmupLink | null;
  spinEndsAt: number | null;
  sharedRoomUrl: string | null;
  sharedRoomUrlRevision: number;
  sharedRoomUrlUpdatedBy: string | null;
}
