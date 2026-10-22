import type { RoomState } from "shared/model/retro/retro.events";
import type { RetroRoom } from "../domain/model/retroRoom.object";
import { canTransition, validate } from "./roomstate.validator";

describe("room state validator", () => {
  test("accepts warmup as a valid room state", () => {
    expect(validate("warmup")).toBe(true);
  });
});

describe("existing frontend stage transition policy", () => {
  const base = () =>
    ({
      roomState: "reflection" as RoomState,
      warmup: null,
      cards: [{ id: "card", parentCardId: null }],
    }) as RetroRoom;
  it.each([
    ["reflection", "group"],
    ["group", "vote"],
    ["vote", "discuss"],
    ["group", "reflection"],
    ["vote", "group"],
    ["discuss", "vote"],
  ] as const)("allows %s -> %s", (current, next) => {
    expect(canTransition({ ...base(), roomState: current }, next)).toBe(true);
  });
  it.each([
    ["reflection", "summary"],
    ["group", "discuss"],
    ["discuss", "reflection"],
    ["summary", "vote"],
    ["reflection", "reflection"],
    ["reflection", "warmup"],
  ] as const)("rejects %s -> %s", (current, next) => {
    expect(
      canTransition({ ...base(), roomState: current as RoomState }, next),
    ).toBe(false);
  });
  it("requires a root card for forward stages, but permits returning to reflection", () => {
    expect(canTransition({ ...base(), cards: [] }, "group")).toBe(false);
    expect(
      canTransition({ ...base(), roomState: "vote", cards: [] }, "discuss"),
    ).toBe(false);
    expect(
      canTransition({ ...base(), roomState: "group", cards: [] }, "reflection"),
    ).toBe(true);
  });
  it("only leaves warmup once revealed and only returns when warmup exists", () => {
    const room = base();
    room.warmup = { status: "pending" } as RetroRoom["warmup"];
    expect(canTransition(room, "warmup")).toBe(true);
    room.roomState = "warmup";
    expect(canTransition(room, "reflection")).toBe(false);
    room.warmup.status = "revealed";
    expect(canTransition(room, "reflection")).toBe(true);
  });
});
