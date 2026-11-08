import { PokerRoom } from "./pokerRoom.object";

const user = (userId: string) => ({
  userId,
  nick: userId,
  avatarLink: "",
  role: "USER" as const,
});

describe("PokerRoom", () => {
  const roomWithTwoPlayers = () => {
    const room = new PokerRoom("team");
    room.addUser("socket-a", user("a"));
    room.addUser("socket-b", user("b"));
    room.selectCard("a", "8");
    return room;
  };

  it("hides other players' cards before the reveal", () => {
    const room = roomWithTwoPlayers();

    const forB = room.getRoomSyncData("b").users.find((u) => u.userId === "a");
    const forA = room.getRoomSyncData("a").users.find((u) => u.userId === "a");

    expect(forB).toMatchObject({ hasSelectedCard: true, selectedCard: null });
    expect(forA).toMatchObject({ hasSelectedCard: true, selectedCard: "8" });
  });

  it("shows revealed cards to everyone", () => {
    const room = roomWithTwoPlayers();
    room.revealCards();

    const forB = room.getRoomSyncData("b").users.find((u) => u.userId === "a");

    expect(forB?.revealedCard).toBe("8");
  });

  it.each([
    "constructor",
    "toString",
    "__proto__",
    "unknown",
    42,
    null,
  ])("rejects deck id %p", (deckId) => {
    const room = roomWithTwoPlayers();

    expect(room.selectDeck(deckId)).toBe(false);
    expect(room.deckId).toBe("standard");
    expect(room.selectCard("b", "1")).toBe(true);
  });

  it.each([
    "XL",
    42,
    {},
    undefined,
  ])("rejects card %p from another deck or of a wrong type", (card) => {
    const room = roomWithTwoPlayers();

    expect(room.selectCard("b", card)).toBe(false);
    expect(room.getRoomSyncData("b").users[1].hasSelectedCard).toBe(false);
  });
});
