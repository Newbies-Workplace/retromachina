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

  const customDeck = {
    id: "team-deck",
    name: "Fibonacci",
    cards: ["1", "2", "3", "5", "8"],
  };

  it("switches to a custom deck and starts a fresh round", () => {
    const room = roomWithTwoPlayers();

    room.selectDeck(customDeck);

    expect(room.getRoomSyncData("a").deck).toEqual(customDeck);
    expect(room.getRoomSyncData("a").users[0].hasSelectedCard).toBe(false);
    expect(room.selectCard("b", "3")).toBe(true);
    expect(room.selectCard("b", "4")).toBe(false);
  });

  it("keeps its own copy of the deck", () => {
    const room = new PokerRoom("team");
    const deck = { ...customDeck, cards: [...customDeck.cards] };
    room.selectDeck(deck);

    deck.cards.push("13");

    expect(room.selectCard("a", "13")).toBe(false);
  });

  it("applies edits of the active deck and drops picks that no longer exist", () => {
    const room = roomWithTwoPlayers();
    room.selectDeck(customDeck);
    room.selectCard("a", "8");
    room.selectCard("b", "2");
    room.revealCards();

    const changed = room.updateDeck({
      ...customDeck,
      name: "Fibonacci 2",
      cards: ["1", "2", "3", "5", "13"],
    });

    expect(changed).toBe(true);
    const sync = room.getRoomSyncData("a");
    expect(sync.deck.name).toBe("Fibonacci 2");
    expect(sync.cardsRevealed).toBe(true);
    expect(sync.users.map((u) => u.revealedCard)).toEqual([null, "2"]);
    expect(sync.users.map((u) => u.hasSelectedCard)).toEqual([false, true]);
  });

  it("ignores edits of a deck that is not active", () => {
    const room = roomWithTwoPlayers();

    expect(room.updateDeck({ ...customDeck, cards: ["1", "8"] })).toBe(false);
    expect(room.getRoomSyncData("a").deck.id).toBe("standard");
    expect(room.getRoomSyncData("a").users[0].selectedCard).toBe("8");
  });

  it("falls back to the default deck when the active deck is deleted", () => {
    const room = roomWithTwoPlayers();
    room.selectDeck(customDeck);
    room.selectCard("a", "5");

    expect(room.removeDeck("other-deck")).toBe(false);
    expect(room.removeDeck(customDeck.id)).toBe(true);

    const sync = room.getRoomSyncData("a");
    expect(sync.deck.id).toBe("standard");
    expect(sync.users[0].hasSelectedCard).toBe(false);
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
