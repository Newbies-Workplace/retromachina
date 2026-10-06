import type { RoomState } from "shared/model/retro/retro.events";

export const validate = (value: unknown): value is RoomState => {
  const possibleValues = ["warmup", "reflection", "group", "vote", "discuss"];

  return typeof value === "string" && possibleValues.includes(value);
};

// Mirrors nextRoomState/prevRoomState in the existing frontend; ending
// a retrospective uses the separate close-room command.
export const canTransition = (
  room: Pick<
    import("../domain/model/retroRoom.object").RetroRoom,
    "roomState" | "warmup" | "cards"
  >,
  next: unknown,
): boolean => {
  if (!validate(next) || next === room.roomState) return false;
  if (room.roomState === "warmup") {
    return next === "reflection" && room.warmup?.status === "revealed";
  }
  if (room.roomState === "reflection" && next === "warmup")
    return !!room.warmup;
  const forward: Partial<Record<RoomState, RoomState>> = {
    reflection: "group",
    group: "vote",
    vote: "discuss",
  };
  const backward: Partial<Record<RoomState, RoomState>> = {
    group: "reflection",
    vote: "group",
    discuss: "vote",
  };
  if (backward[room.roomState] === next) return true;
  return (
    forward[room.roomState] === next &&
    room.cards.some((card) => card.parentCardId === null)
  );
};
