import type { WarmupState } from "shared/model/warmup/warmup";
import { RetroRoom, type RetroRoomSnapshotV1 } from "./retroRoom.object";

const warmup = (): WarmupState => ({
  candidates: [
    {
      id: "one",
      name: "One",
      description: "First",
      url: "https://example.com/",
    },
    {
      id: "two",
      name: "Two",
      description: null,
      url: "https://example.org/",
    },
  ],
  status: "pending",
  selectedWarmupId: "two",
  result: null,
  spinEndsAt: null,
  sharedRoomUrl: null,
  sharedRoomUrlRevision: 0,
  sharedRoomUrlUpdatedBy: null,
});

describe("RetroRoom warmup", () => {
  test("draws the preselected warmup and persists it", () => {
    const room = new RetroRoom("retro", "team", [], warmup());

    const draw = room.startWarmupDraw(0);
    room.revealWarmupIfFinished();

    expect(draw.resultId).toBe("two");
    expect(room.warmup.status).toBe("revealed");
    expect(room.getSnapshot().warmup.result.id).toBe("two");
  });

  test("allows a room link only after the result is revealed", () => {
    const room = new RetroRoom("retro", "team", [], warmup());

    expect(room.updateWarmupRoomUrl("https://room.test", "admin")).toBe(false);
    room.startWarmupDraw(0);
    expect(room.updateWarmupRoomUrl("https://room.test", "admin")).toBe(true);
    expect(room.warmup.sharedRoomUrlRevision).toBe(1);
    expect(room.warmup.sharedRoomUrlUpdatedBy).toBe("admin");
  });

  test("restores an old snapshot without a warmup", () => {
    const room = new RetroRoom("retro", "team", []);
    const snapshot = room.getSnapshot();
    delete (snapshot as Partial<RetroRoomSnapshotV1>).warmup;

    const restored = RetroRoom.restore("retro", "team", snapshot);

    expect(restored.warmup).toBeNull();
    expect(restored.roomState).toBe("reflection");
  });
});
