import { Task } from "@prisma/client";
import { UserRole } from "shared/.dist/model/user/user.role";
import { RoomState, RoomSyncEvent } from "shared/model/retro/retro.events";
import {
  Card,
  RetroColumn,
  User,
  Vote,
} from "shared/model/retro/retroRoom.interface";

type RetroTask = Task & { parentCardId: string };

export class RetroRoom {
  users: Map<string, User> = new Map();

  roomState: RoomState = "reflection";
  timerEnds?: number = null;
  cards: Card[] = [];

  createdDate: Date = new Date();
  lastDisconnectionDate: Date = new Date();

  // group
  slotMachineVisible = false;
  userIdsQueue: string[] = [];
  highlightedUserId: string | null = null;
  maxVotes?: number = 3;

  // vote
  votes: Vote[] = [];

  // discuss
  discussionCardId = null;
  tasks: RetroTask[] = [];

  constructor(
    public id: string,
    public teamId: string,
    public scrumMasterId: string,
    public retroColumns: RetroColumn[],
  ) {}

  getRoomSyncData() {
    const tempUsers = Array.from(this.users.values());

    const roomData: RoomSyncEvent = {
      id: this.id,
      teamId: this.teamId,
      createdDate: this.createdDate,
      maxVotes: this.maxVotes,
      usersReady: tempUsers.filter((user) => user.isReady).length,
      roomState: this.roomState,
      timerEnds: this.timerEnds,
      cards: this.cards,
      votes: this.votes,
      discussionCardId: this.discussionCardId,
      slotMachineVisible: this.slotMachineVisible,
      highlightedUserId: this.highlightedUserId,
      tasks: this.tasks.map((task) => {
        return {
          id: task.id,
          description: task.description,
          ownerId: task.owner_id,
          parentCardId: task.parentCardId,
        };
      }),
      retroColumns: this.retroColumns.map((column) => {
        column.cards = this.cards.filter((card) => {
          return card.columnId === column.id;
        });
        column.isWriting =
          tempUsers.filter((user) =>
            Array.from(user.writingInColumns.values()).includes(column.id),
          ).length > 0;
        column.teamCardsAmount = column.cards.length;
        return column;
      }),
      users: tempUsers.map((user) => {
        return {
          userId: user.userId,
          isReady: user.isReady,
          role: user.role,
          isCreatingTask: user.isCreatingTask,
          writingInColumns: new Set<string>(),
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

  addUser(socketId: string, userId: string, role: UserRole) {
    const result = Array.from(this.users.entries()).find(([_, localUser]) => {
      return localUser.userId === userId;
    });

    if (!result) {
      this.users.set(socketId, {
        userId,
        role: role,
        isReady: false,
        isCreatingTask: false,
        writingInColumns: new Set<string>(),
      });
    } else {
      this.users.delete(result[0]);
      this.users.set(socketId, result[1]);
    }
  }

  removeUser(socketId: string, userId: string) {
    const result = Array.from(this.users.entries()).find(([key, localUser]) => {
      return localUser.userId === userId;
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

    for (const childCard of childCards) {
      this.pushCardToEnd(childCard.id);
      childCard.parentCardId = parentCardId;
      childCard.columnId = parentCard.columnId;
    }

    card.parentCardId = parentCardId;
    card.columnId = parentCard.columnId;
  }

  addVote(userId: string, parentCardId: string) {
    this.votes.unshift({
      parentCardId,
      voterId: userId,
    });
  }

  addTask(task: RetroTask) {
    this.tasks.push(task);
  }

  moveCardToColumn(cardId: string, columnId: string) {
    const card = this.pushCardToEnd(cardId);
    card.columnId = columnId;

    if (!card.parentCardId) {
      const groupedCards = this.cards.filter(
        (_card) => _card.parentCardId === card.id,
      );
      for (const card1 of groupedCards) {
        card1.columnId = columnId;
      }
    }

    card.parentCardId = null;
  }

  deleteTask(taskId: string) {
    this.tasks = this.tasks.filter((task) => task.id !== taskId);
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

    if (roomState === "discuss") {
      this.initDiscussionCard();
    }
    if (roomState !== "group") {
      this.slotMachineVisible = false;
    }
  }

  updateTask(task: Task) {
    this.tasks = this.tasks.map((t) => {
      return t.id === task.id ? { ...t, ...task } : t;
    });
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
    for (const [, user] of this.users) {
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

  drawMachine() {
    //todo randomized from queue
    const randomUser = Array.from(this.users.values())[
      Math.floor(Math.random() * this.users.size)
    ];
    this.highlightedUserId = randomUser.userId;
  }

  setSlotMachineVisibility(isVisible: boolean) {
    this.slotMachineVisible = isVisible;
  }
}
