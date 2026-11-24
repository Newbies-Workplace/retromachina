import type { PokerSyncEvent } from "shared/model/poker/poker.events";
import {
  getDefaultPokerDeck,
  type PokerCard,
  type PokerDeck,
  type PokerDeckId,
} from "shared/model/poker/poker.types";
import type { UserRole } from "shared/model/user/user.role";

type SocketId = string;

const copyDeck = ({ id, name, cards }: PokerDeck): PokerDeck => ({
  id,
  name,
  cards: [...cards],
});

const defaultDeck = (): PokerDeck => {
  const deck = getDefaultPokerDeck();
  if (!deck) throw new Error("Default poker deck is missing");
  return copyDeck(deck);
};

export type PokerRoomUser = {
  userId: string;
  nick: string;
  avatarLink: string;
  role: UserRole;
};

export class PokerRoom {
  connectedUsers: Map<SocketId, PokerRoomUser> = new Map();
  deck: PokerDeck = defaultDeck();
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

  /** Switches to an already validated deck and starts a fresh round. */
  selectDeck(deck: PokerDeck) {
    this.deck = copyDeck(deck);
    this.cardsRevealed = false;
    this.selectedCards.clear();
    this.revealedCards.clear();
  }

  /**
   * Applies an edit of the active deck. Picks that are no longer in the deck
   * are dropped; the rest of the round is kept. Returns whether anything changed.
   */
  updateDeck(deck: PokerDeck) {
    if (deck.id !== this.deck.id) return false;

    this.deck = copyDeck(deck);
    for (const cards of [this.selectedCards, this.revealedCards]) {
      for (const [userId, card] of cards) {
        if (card !== null && !this.deck.cards.includes(card)) {
          cards.set(userId, null);
        }
      }
    }
    return true;
  }

  /** Falls back to the default deck when the active deck was deleted. */
  removeDeck(deckId: PokerDeckId) {
    if (deckId !== this.deck.id) return false;

    this.selectDeck(defaultDeck());
    return true;
  }

  selectCard(userId: string, card: unknown) {
    if (card === null) {
      this.selectedCards.set(userId, null);
      return true;
    }

    if (typeof card !== "string" || !this.deck.cards.includes(card))
      return false;

    this.selectedCards.set(userId, card);
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
      deck: copyDeck(this.deck),
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
