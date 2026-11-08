import type { PokerSyncEvent } from "shared/model/poker/poker.events";
import {
  POKER_DECKS,
  type PokerCard,
  type PokerDeckId,
} from "shared/model/poker/poker.types";
import type { UserRole } from "shared/model/user/user.role";

type SocketId = string;

// Own keys only, so names such as "constructor" are not accepted as decks.
const POKER_DECK_IDS: readonly string[] = Object.keys(POKER_DECKS);

export type PokerRoomUser = {
  userId: string;
  nick: string;
  avatarLink: string;
  role: UserRole;
};

export class PokerRoom {
  connectedUsers: Map<SocketId, PokerRoomUser> = new Map();
  deckId: PokerDeckId = "standard";
  cardsRevealed = false;
  selectedCards: Map<string, PokerCard | null> = new Map();
  revealedCards: Map<string, PokerCard | null> = new Map();

  constructor(public id: string) {}

  addUser(socketId: SocketId, user: PokerRoomUser) {
    this.connectedUsers.set(socketId, user);

    if (!this.selectedCards.has(user.userId)) {
      this.selectedCards.set(user.userId, null);
    }
    if (!this.revealedCards.has(user.userId)) {
      this.revealedCards.set(user.userId, null);
    }
  }

  removeUser(socketId: SocketId) {
    const user = this.connectedUsers.get(socketId);
    if (!user) return;

    this.connectedUsers.delete(socketId);

    const hasAnotherConnection = Array.from(this.connectedUsers.values()).some(
      (connectedUser) => connectedUser.userId === user.userId,
    );
    if (!hasAnotherConnection) {
      this.selectedCards.delete(user.userId);
      this.revealedCards.delete(user.userId);
    }
  }

  selectDeck(deckId: unknown) {
    if (typeof deckId !== "string" || !POKER_DECK_IDS.includes(deckId))
      return false;

    this.deckId = deckId as PokerDeckId;
    this.cardsRevealed = false;
    this.selectedCards.clear();
    this.revealedCards.clear();
    return true;
  }

  selectCard(userId: string, card: unknown) {
    if (card === null) {
      this.selectedCards.set(userId, null);
      return true;
    }

    const deck = POKER_DECKS[this.deckId] as readonly string[];
    if (typeof card !== "string" || !deck.includes(card)) return false;

    this.selectedCards.set(userId, card as PokerCard);
    return true;
  }

  revealCards() {
    this.revealedCards = new Map(this.selectedCards);
    this.cardsRevealed = true;
  }

  clearTable() {
    this.cardsRevealed = false;
    this.selectedCards.clear();
    this.revealedCards.clear();

    for (const user of this.connectedUsers.values()) {
      this.selectedCards.set(user.userId, null);
      this.revealedCards.set(user.userId, null);
    }
  }

  /**
   * Builds the sync event for one viewer. Before the reveal only the viewer's
   * own card is included, so other estimates cannot be read from the socket.
   */
  getRoomSyncData(viewerUserId: string): PokerSyncEvent {
    const uniqueUsers = new Map(
      Array.from(this.connectedUsers.values()).map((user) => [
        user.userId,
        user,
      ]),
    );

    return {
      deckId: this.deckId,
      cardsRevealed: this.cardsRevealed,
      users: Array.from(uniqueUsers.values()).map((user) => ({
        userId: user.userId,
        nick: user.nick,
        avatarLink: user.avatarLink,
        role: user.role,
        hasSelectedCard: (this.selectedCards.get(user.userId) ?? null) !== null,
        selectedCard:
          user.userId === viewerUserId
            ? (this.selectedCards.get(user.userId) ?? null)
            : null,
        revealedCard: this.revealedCards.get(user.userId) ?? null,
      })),
    };
  }
}
