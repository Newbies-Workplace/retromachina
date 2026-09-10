export interface RetroStartedEvent {
  type: "retro-started";
  retroId: string;
  teamId: string;
  teamName: string;
  startedAt: string;
}
