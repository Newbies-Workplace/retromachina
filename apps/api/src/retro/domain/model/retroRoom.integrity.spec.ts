import type { Card, RetroColumn } from "shared/model/retro/retroRoom.interface";
import { RetroRoom } from "./retroRoom.object";

const columns: RetroColumn[] = [
  {
    id: "one",
    name: "One",
    description: "",
    cards: [],
    teamCardsAmount: 0,
    isWriting: false,
  },
  {
    id: "two",
    name: "Two",
    description: "",
    cards: [],
    teamCardsAmount: 0,
    isWriting: false,
  },
];
const card = (
  id: string,
  columnId = "one",
  parentCardId: string | null = null,
): Card => ({
  id,
  text: id,
  authorId: "author",
  columnId,
  parentCardId,
});
const roomWith = (...cards: Card[]) => {
  const room = new RetroRoom("retro", "team", structuredClone(columns));
  room.cards = cards;
  return room;
};

describe("RetroRoom domain integrity", () => {
  test("unknown card and column IDs leave the snapshot unchanged", () => {
    const room = roomWith(card("a"), card("b"));
    const before = structuredClone(room.getSnapshot());

    expect(room.pushCardToEnd("missing")).toBeUndefined();
    expect(room.moveCardToColumn("missing", "two")).toBe(false);
    expect(room.moveCardToColumn("a", "missing-column")).toBe(false);
    expect(room.getSnapshot()).toEqual(before);
  });

  test.each([
    ["missing parent", "missing", "child"],
    ["missing child", "parent", "missing"],
    ["self grouping", "parent", "parent"],
    ["same group", "parent", "child"],
    ["nested group", "child", "other"],
  ])("rejects %s without changing state", (_case, parentId, childId) => {
    const room = roomWith(
      card("parent"),
      card("child", "one", "parent"),
      card("other"),
    );
    const before = structuredClone(room.getSnapshot());

    expect(room.addCardToCard(parentId, childId)).toBe(false);
    expect(room.getSnapshot()).toEqual(before);
  });

  test("moves a group under another root and ungroups it into a column", () => {
    const room = roomWith(
      card("parent"),
      card("child", "one", "parent"),
      card("destination", "two"),
    );

    expect(room.addCardToCard("destination", "parent")).toBe(true);
    expect(room.cards).toEqual([
      card("parent", "two", "destination"),
      card("destination", "two"),
      card("child", "two", "destination"),
    ]);

    expect(room.moveCardToColumn("child", "one")).toBe(true);
    expect(room.cards).toEqual([
      card("parent", "two", "destination"),
      card("destination", "two"),
      card("child", "one"),
    ]);
  });

  test("rejects grouping when the destination has an invalid column", () => {
    const room = roomWith(card("parent", "missing-column"), card("child"));
    const before = structuredClone(room.getSnapshot());

    expect(room.addCardToCard("parent", "child")).toBe(false);
    expect(room.getSnapshot()).toEqual(before);
  });

  test("only existing root cards can become the discussion card", () => {
    const room = roomWith(card("parent"), card("child", "one", "parent"));
    room.discussionCardId = "parent";
    const before = structuredClone(room.getSnapshot());

    expect(room.changeDiscussionCard("missing")).toBe(false);
    expect(room.changeDiscussionCard("child")).toBe(false);
    expect(room.changeDiscussionCard("parent")).toBe(false);
    expect(room.getSnapshot()).toEqual(before);
  });

  test("initializes discussion safely when there are no cards", () => {
    const room = roomWith();

    expect(() => room.changeState("discuss")).not.toThrow();
    expect(room.discussionCardId).toBeNull();
  });
});
