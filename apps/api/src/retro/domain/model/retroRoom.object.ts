import { RoomState } from 'src/retro/application/roomstate.validator';
import { RoomSyncEvent } from '../../application/model/retro.events';
import { ActionPoint, Card, RetroColumn, User, Vote } from './retroRoom.interface';
import { v4 as uuid } from 'uuid';

export class RetroRoom {
  users: Map<string, User> = new Map();

  roomState: RoomState = 'reflection';
  maxVotes?: number = 3;
  timerEnds?: number = null;
  discussionCardId = null;
  cards: Card[] = [];
  votes: Vote[] = [];

  actionPoints: ActionPoint[] = [];

  createdDate: Date = new Date();
  lastDisconnectionDate: Date = new Date();

  constructor(
    public id: string,
    public teamId: string,
    public scrumMasterId: string,
    public retroColumns: RetroColumn[],
  ) {}

  getFrontData() {
    const tempUsers = Array.from(this.users.values());

    const roomData: RoomSyncEvent = {
      id: this.id,
      teamId: this.teamId,
      createdDate: this.createdDate,
      maxVotes: this.maxVotes,
      usersReady: tempUsers.filter(user => user.isReady).length,
      roomState: this.roomState,
      timerEnds: this.timerEnds,
      cards: this.cards,
      votes: this.votes,
      discussionCardId: this.discussionCardId,
      actionPoints: this.actionPoints,
      retroColumns: this.retroColumns.map((column) => {
        column.cards = this.cards.filter((card) => {
          return card.columnId == column.id;
        });
        column.isWriting = tempUsers.filter(
          user => Array.from(user.writingInColumns.values()).includes(column.id)
        ).length > 0
        column.teamCardsAmount = column.cards.length;
        return column;
      }),
      users: tempUsers.map((user) => {
        return {
          id: user.userId,
          isReady: user.isReady,
        };
      }),
      serverTime: new Date().valueOf(),
    };

    return roomData;
  }

  setVoteAmount(value: number) {
    this.maxVotes = value;

    const userVotes = {};

    const votesCopy = [...this.votes];
    votesCopy.reverse();

    const filteredVotes = votesCopy.filter((vote) => {
      let voter = userVotes[vote.voterId];

      if (!voter) {
        userVotes[vote.voterId] = { amount: 0 };
        voter = userVotes[vote.voterId];
      }

      if (voter.amount < this.maxVotes) {
        userVotes[vote.voterId].amount++;
        return true;
      }

      return false;
    });

    filteredVotes.reverse();
    this.votes = filteredVotes;
  }

  addUser(socketId: string, userId: string) {
    const result = Array.from(this.users.entries()).find(([key, localUser]) => {
      return localUser.userId == userId;
    });

    if (!result) {
      this.users.set(socketId, {
        userId,
        isReady: false,
        writingInColumns: new Set<string>(),
      });
    } else {
      this.users.delete(result[0]);
      this.users.set(socketId, result[1]);
    }
  }

  removeUser(socketId: string, userId: string) {
    const result = Array.from(this.users.entries()).find(([key, localUser]) => {
      return localUser.userId == userId;
    });

    if (result) {
      this.users.delete(result[0]);
      this.lastDisconnectionDate = new Date();
    }
  }

  addCardToCard(parentCardId: string, cardId: string) {
    const card = this.pushCardToEnd(cardId);
    const parentCard = this.cards.find((card) => card.id === parentCardId);
    const childCards = this.cards.filter(
      (card) => card.parentCardId === cardId,
    );

    childCards.forEach((card) => {
      this.pushCardToEnd(card.id);
      card.parentCardId = parentCardId;
      card.columnId = parentCard.columnId;
    });

    card.parentCardId = parentCardId;
    card.columnId = parentCard.columnId;
  }

  addVote(userId: string, parentCardId: string) {
    this.votes.unshift({
      parentCardId,
      voterId: userId,
    });
  }

  addActionPoint(text: string, ownerId: string) {
    this.actionPoints.push({
      id: uuid(),
      text,
      ownerId,
      parentCardId: this.discussionCardId,
    });
  }

  moveCardToColumn(cardId: string, columnId: string) {
    const card = this.pushCardToEnd(cardId);
    card.columnId = columnId;

    if (!card.parentCardId) {
      const groupedCards = this.cards.filter(
        (_card) => _card.parentCardId === card.id,
      );
      groupedCards.forEach((card) => {
        card.columnId = columnId;
      });
    }

    card.parentCardId = null;
  }

  deleteActionPoint(actionPointId: string) {
    this.actionPoints = this.actionPoints.filter(
      (actionPoint) => actionPoint.id !== actionPointId,
    );
  }

  removeVote(userId: string, parentCardId: string) {
    const voteIndex = this.votes.findIndex(
      (vote) => vote.parentCardId === parentCardId && vote.voterId === userId,
    );
    this.votes.splice(voteIndex, 1);
  }

  changeState(roomState: RoomState) {
    this.timerEnds = null;
    this.roomState = roomState;

    this.clearUsersReady();

    if (roomState === 'discuss') {
      this.initDiscussionCard();
    }
  }

  updateActionPoint(actionPointId: string, newOwnerId: string, newText: string) {
    const actionPoint = this.actionPoints.find(
      (actionPoint) => actionPoint.id === actionPointId,
    );
    actionPoint.ownerId = newOwnerId;
    actionPoint.text = newText;
  }

  changeDiscussionCard(cardId: string) {
    this.discussionCardId = cardId;
    this.clearUsersReady();
  }

  pushCardToEnd(cardId: string): Card {
    let card: Card;
    let cardIndex: number;

    for (let i = 0; i < this.cards.length; i++) {
      if (this.cards[i].id === cardId) {
        card = this.cards[i];
        cardIndex = i;
        break;
      }
    }

    this.cards.splice(cardIndex, 1);
    this.cards.push(card);

    return card;
  }

  private clearUsersReady() {
    for (const [key, user] of this.users) {
      user.isReady = false;
    }
  }

  private initDiscussionCard() {
    const sortedCards = this.cards
      .filter((c) => c.parentCardId === null)
      .map((parent) => {
        const groupCards = [
          parent,
          ...this.cards.filter((c) => c.parentCardId === parent.id),
        ];
        const count = groupCards
          .map((c) => this.votes.filter((v) => v.parentCardId === c.id).length)
          .reduce((a, c) => a + c, 0);

        return {
          parentCardId: parent.id,
          cards: groupCards,
          votes: count,
        };
      })
      .sort((a, b) => b.votes - a.votes);

    this.discussionCardId = sortedCards[0].parentCardId;
  }
}
