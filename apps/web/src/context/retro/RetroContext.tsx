import type React from "react";
import { createContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";
import type {
  AddCardToCardCommand,
  AddCardVoteCommand,
  ChangeCurrentDiscussCardCommand,
  ChangeTimerCommand,
  ChangeVoteAmountCommand,
  CreateCardCommand,
  CreateTaskCommand,
  DeleteCardCommand,
  DeleteTaskCommand,
  MoveCardToColumnCommand,
  RemoveCardVoteCommand,
  UpdateCardCommand,
  UpdateCreatingTaskStateCommand,
  UpdateReadyStateCommand,
  UpdateRoomStateCommand,
  UpdateTaskCommand,
  UpdateWriteStateCommand,
} from "shared/model/retro/retro.commands";
import type {
  RoomState,
  RoomSyncEvent,
  TimerChangedEvent,
} from "shared/model/retro/retro.events";
import type {
  ActionPoint,
  Card,
  RetroColumn,
  User,
  Vote,
} from "shared/model/retro/retroRoom.interface";
import type { UserResponse } from "shared/model/user/user.response";
import io, { type Socket } from "socket.io-client";
import { v4 as uuidv4 } from "uuid";
import { getUsersByTeamId } from "../../api/User.service";
import type { CardMoveAction } from "../../interfaces/CardMoveAction.interface";
import { useCardGroups } from "../useCardGroups";
import { useUser } from "../user/UserContext.hook";

interface RetroContextParams {
  retroId: string;
}

interface RetroContext {
  retroId: string;
  teamId: string | null;
  columns: RetroColumn[];
  cards: Card[];
  teamUsers: UserResponse[];
  activeUsers: User[];
  roomState: RoomState;

  discussionCardId: string | null;
  timerEnds: number | null;
  setTimer: (time: number | null) => void;

  ready: boolean;
  setReady: (ready: boolean) => void;
  readyPercentage: number;

  setWriting: (value: boolean, columnId: string) => void;
  setCreatingTask: (creatingTask: boolean) => void;

  createCard: (text: string, columnId: string) => void;
  updateCard: (cardId: string, text: string) => void;
  deleteCard: (cardId: string) => void;

  nextRoomState: () => void;
  prevRoomState: () => void;
  removeVote: (parentCardId: string) => void;
  addVote: (parentCardId: string) => void;
  votes: Vote[];
  maxVotes: number;
  setMaxVotesAmount: (amount: number) => void;

  moveCard: (action: CardMoveAction) => void;

  endRetro: () => void;

  updateActionPoint: (
    actionPointId: string,
    userId: string,
    text: string,
  ) => void;
  createActionPoint: (text: string, ownerId: string) => void;
  deleteActionPoint: (actionPointId: string) => void;
  actionPoints: ActionPoint[];
}

export const RetroContext = createContext<RetroContext>({
  columns: [],
  cards: [],
  retroId: "",
  teamId: null,
  roomState: "reflection",
  timerEnds: null,
  discussionCardId: null,
  setTimer: () => {},
  ready: false,
  readyPercentage: 0,
  teamUsers: [],
  activeUsers: [],
  setReady: () => {},
  setWriting: () => {},
  setCreatingTask: () => {},
  createCard: () => {},
  updateCard: () => {},
  deleteCard: () => {},
  nextRoomState: () => {},
  prevRoomState: () => {},
  removeVote: () => {},
  addVote: () => {},
  votes: [],
  maxVotes: 0,
  setMaxVotesAmount: () => {},
  moveCard: () => {},
  endRetro: () => {},
  updateActionPoint: () => {},
  createActionPoint: () => {},
  deleteActionPoint: () => {},
  actionPoints: [],
});

export const RetroContextProvider: React.FC<
  React.PropsWithChildren<RetroContextParams>
> = ({ children, retroId }) => {
  const socket = useRef<Socket>();
  const timeOffset = useRef<number>();
  const [teamId, setTeamId] = useState<string | null>(null);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [maxVotes, setMaxVotes] = useState<number>(0);
  const [timerEnds, setTimerEnds] = useState<number | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [roomState, setRoomState] = useState<RoomState>("reflection");
  const [teamUsers, setTeamUsers] = useState<UserResponse[]>([]);
  const [columns, setColumns] = useState<RetroColumn[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [usersReady, setUsersReady] = useState<number>(0);
  const [users, setUsers] = useState<User[]>([]);
  const [actionPoint, setActionPoint] = useState<ActionPoint[]>([]);
  const [discussionCardId, setDiscussionCardId] = useState<string | null>(null);

  const { user } = useUser();
  const navigate = useNavigate();
  const readyPercentage = (usersReady / users.length) * 100;

  useEffect(() => {
    const createdSocket = io(`${process.env.RETRO_WEB_SOCKET_URL}/retro`, {
      query: {
        retro_id: retroId,
      },
      extraHeaders: {
        //@ts-ignore
        Authorization: window.localStorage.getItem("Bearer"),
      },
      forceNew: true,
    });
    socket.current = createdSocket;

    createdSocket.on("error", (e) => {
      console.log(e);
      toast.error("Wystąpił błąd");
    });

    createdSocket.on("event_room_sync", (roomData: RoomSyncEvent) => {
      setRoomState(roomData.roomState);
      setTeamId(roomData.teamId);
      setColumns(roomData.retroColumns);
      setCards(roomData.cards);
      setUsersReady(roomData.usersReady);
      setVotes(roomData.votes);
      setMaxVotes(roomData.maxVotes);
      setIsReady(
        roomData.users.find((u) => u.userId === user?.id)?.isReady || false,
      );
      setUsers(roomData.users);
      setActionPoint(roomData.tasks);
      setDiscussionCardId(roomData.discussionCardId);

      const serverTimeOffset = roomData.serverTime - new Date().valueOf();
      timeOffset.current = serverTimeOffset;
      handleTimerChanged(roomData.timerEnds, serverTimeOffset);
    });

    createdSocket.on("event_timer_change", (e: TimerChangedEvent) => {
      handleTimerChanged(e.timerEnds, timeOffset.current ?? 0);
    });

    createdSocket.on("event_close_room", () => {
      navigate(`/retro/${retroId}/summary`);
    });

    return () => {
      createdSocket.removeAllListeners();
      createdSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (teamId) {
      getUsersByTeamId(teamId)
        .then((users) => setTeamUsers(users))
        .catch(console.log);
    }
  }, [teamId]);

  const createTask = (text: string, ownerId: string) => {
    const command: CreateTaskCommand = {
      description: text,
      ownerId: ownerId,
    };
    socket.current?.emit("command_create_action_point", command);
    setCreatingTask(false);
  };

  const deleteTask = (taskId: string) => {
    const command: DeleteTaskCommand = {
      taskId: taskId,
    };

    socket.current?.emit("command_delete_action_point", command);
  };

  const updateTask = (taskId: string, userId: string, text: string) => {
    const command: UpdateTaskCommand = {
      taskId: taskId,
      ownerId: userId,
      description: text,
    };
    socket.current?.emit("command_update_action_point", command);
  };

  const endRetro = () => {
    socket.current?.emit("command_close_room");
  };

  const addVote = (parentCardId: string) => {
    const command: AddCardVoteCommand = {
      parentCardId: parentCardId,
    };
    socket.current?.emit("command_vote_on_card", command);
  };

  const removeVote = (parentCardId: string) => {
    const command: RemoveCardVoteCommand = {
      parentCardId: parentCardId,
    };
    socket.current?.emit("command_remove_vote_on_card", command);
  };

  const setMaxVotesAmount = (amount: number) => {
    const command: ChangeVoteAmountCommand = {
      votesAmount: amount,
    };
    socket.current?.emit("command_change_vote_amount", command);
  };

  const setReady = (ready: boolean) => {
    const command: UpdateReadyStateCommand = {
      readyState: ready,
    };
    socket.current?.emit("command_ready", command);
    setIsReady(ready);
  };

  const setCreatingTask = (creatingTask: boolean) => {
    const command: UpdateCreatingTaskStateCommand = {
      creatingTaskState: creatingTask,
    };
    socket.current?.emit("command_creating_task_state", command);
  };

  const setWriting = (value: boolean, columnId: string) => {
    const command: UpdateWriteStateCommand = {
      columnId: columnId,
      writeState: value,
    };
    socket.current?.emit("command_write_state", command);
  };

  const createCard = (text: string, columnId: string) => {
    const command: CreateCardCommand = {
      id: uuidv4(),
      text: text,
      columnId: columnId,
    };
    socket.current?.emit("command_create_card", command);
    setWriting(false, columnId);
  };

  const updateCard = (cardId: string, text: string) => {
    const command: UpdateCardCommand = {
      cardId: cardId,
      text: text,
    };
    socket.current?.emit("command_update_card", command);
  };

  const deleteCard = (cardId: string) => {
    const command: DeleteCardCommand = {
      cardId: cardId,
    };
    socket.current?.emit("command_delete_card", command);
  };

  const setTimer = (time: number | null) => {
    setTimerEnds(time);
    const command: ChangeTimerCommand = {
      timestamp: time ? time + (timeOffset.current ?? 0) : null,
    };
    socket.current?.emit("command_timer_change", command);
  };

  const handleTimerChanged = (time: number | null, serverOffset: number) => {
    setTimerEnds(time ? time - serverOffset : null);
  };

  const nextRoomState = () => {
    let state: RoomState;

    switch (roomState) {
      case "reflection":
        state = "group";
        break;
      case "group":
        state = "vote";
        break;
      case "vote":
        state = "discuss";
        break;
      case "discuss":
        changeDiscussCard("next");
        return;
    }

    const command: UpdateRoomStateCommand = {
      roomState: state,
    };

    socket.current?.emit("command_room_state", command);
  };

  const prevRoomState = () => {
    let state: RoomState;
    switch (roomState) {
      case "reflection":
        return;
      case "group":
        state = "reflection";
        break;
      case "vote":
        state = "group";
        break;
      case "discuss":
        if (changeDiscussCard("prev")) {
          state = "vote";
          break;
        }

        return;
    }

    const command: UpdateRoomStateCommand = {
      roomState: state,
    };
    socket.current?.emit("command_room_state", command);
  };

  const changeDiscussCard = (to: "next" | "prev") => {
    const groups = useCardGroups(cards, votes).sort(
      (a, b) => b.votes - a.votes,
    );

    if (!discussionCardId) {
      return false;
    }
    const currentIndex = groups.findIndex(
      (g) => g.parentCardId === discussionCardId,
    );
    const targetIndex = to === "next" ? currentIndex + 1 : currentIndex - 1;

    if (to === "next" && targetIndex >= groups.length) {
      return true;
    }
    if (to === "prev" && targetIndex < 0) {
      return true;
    }

    const targetCardId = groups[targetIndex]?.parentCardId;

    const command: ChangeCurrentDiscussCardCommand = {
      cardId: targetCardId,
    };
    socket.current?.emit("command_change_discussion_card", command);

    return false;
  };

  const moveCard = (move: CardMoveAction) => {
    if (move.targetType === "column") {
      const command: MoveCardToColumnCommand = {
        cardId: move.cardId,
        columnId: move.targetId,
      };
      socket.current?.emit("command_move_card_to_column", command);
    } else if (move.targetType === "card") {
      const command: AddCardToCardCommand = {
        cardId: move.cardId,
        parentCardId: move.targetId,
      };
      socket.current?.emit("command_card_add_to_card", command);
    }
  };

  return (
    <RetroContext.Provider
      value={{
        retroId: retroId,
        teamId: teamId,
        columns: columns,
        cards: cards,
        roomState: roomState,
        teamUsers: teamUsers,
        activeUsers: users,
        timerEnds: timerEnds,
        discussionCardId: discussionCardId,
        setTimer: setTimer,
        ready: isReady,
        setReady: setReady,
        readyPercentage: readyPercentage,
        setCreatingTask: setCreatingTask,
        setWriting: setWriting,
        createCard: createCard,
        updateCard: updateCard,
        deleteCard: deleteCard,
        nextRoomState: nextRoomState,
        prevRoomState: prevRoomState,
        removeVote: removeVote,
        addVote: addVote,
        votes: votes,
        maxVotes: maxVotes,
        setMaxVotesAmount: setMaxVotesAmount,
        moveCard: moveCard,
        endRetro: endRetro,
        updateActionPoint: updateTask,
        createActionPoint: createTask,
        deleteActionPoint: deleteTask,
        actionPoints: actionPoint,
      }}
    >
      {children}
    </RetroContext.Provider>
  );
};
