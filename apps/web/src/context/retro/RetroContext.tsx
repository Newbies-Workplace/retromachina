import type React from "react";
import { createContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";
import type {
  AddCardToCardCommand,
  AddCardVoteCommand,
  ChangeCurrentDiscussCardCommand,
  ChangeSlotMachineVisibilityCommand,
  ChangeTimerCommand,
  ChangeVoteAmountCommand,
  CreateCardCommand,
  CreateTaskCommand,
  DeleteCardCommand,
  DeleteTaskCommand,
  DrawMachineCommand,
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
  SlotMachineDrawnEvent,
  TimerChangedEvent,
} from "shared/model/retro/retro.events";
import type {
  Card,
  RetroColumn,
  RetroTask,
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

export type SlotMachineDrawnListener = (event: {
  highlightedUserId: string;
  actorId: string;
}) => void;

interface RetroContext {
  retroId: string;
  teamId: string | null;
  columns: RetroColumn[];
  cards: Card[];
  teamUsers: UserResponse[];
  activeUsers: User[];

  // common
  roomState: RoomState;
  nextRoomState: () => void;
  prevRoomState: () => void;
  endRetro: () => void;

  timerEnds: number | null;
  setTimer: (time: number | null) => void;

  ready: boolean;
  setReady: (ready: boolean) => void;
  readyPercentage: number;

  // reflection
  setWriting: (value: boolean, columnId: string) => void;
  createCard: (text: string, columnId: string) => void;
  updateCard: (cardId: string, text: string) => void;
  deleteCard: (cardId: string) => void;

  // group
  slotMachineVisible: boolean;
  setSlotMachineVisible: (visible: boolean) => void;
  drawMachine: () => void;
  highlightedUserId: string | null;
  addDrawSlotMachineListener: (listener: SlotMachineDrawnListener) => void;
  removeDrawSlotMachineListener: (listener: SlotMachineDrawnListener) => void;
  moveCard: (action: CardMoveAction) => void;

  // vote
  removeVote: (parentCardId: string) => void;
  addVote: (parentCardId: string) => void;
  votes: Vote[];
  maxVotes: number;
  setMaxVotesAmount: (amount: number) => void;

  // discuss
  discussionCardId: string | null;
  setCreatingTask: (creatingTask: boolean) => void;
  createTask: (text: string, ownerId: string) => void;
  updateTask: (actionPointId: string, userId: string, text: string) => void;
  deleteTask: (actionPointId: string) => void;
  tasks: RetroTask[];
}

export const RetroContext = createContext<RetroContext>({
  retroId: "",
  teamId: null,
  columns: [],
  cards: [],
  teamUsers: [],
  activeUsers: [],

  // common
  roomState: "reflection",
  nextRoomState: () => {},
  prevRoomState: () => {},
  endRetro: () => {},

  timerEnds: null,
  setTimer: () => {},

  ready: false,
  setReady: () => {},
  readyPercentage: 0,

  // reflection
  setWriting: () => {},
  createCard: () => {},
  updateCard: () => {},
  deleteCard: () => {},

  // group
  slotMachineVisible: false,
  setSlotMachineVisible: () => {},
  drawMachine: () => {},
  highlightedUserId: null,
  addDrawSlotMachineListener: () => {},
  removeDrawSlotMachineListener: () => {},
  moveCard: () => {},

  // vote
  removeVote: () => {},
  addVote: () => {},
  votes: [],
  maxVotes: 0,
  setMaxVotesAmount: () => {},

  // discuss
  discussionCardId: null,
  setCreatingTask: () => {},
  createTask: () => {},
  updateTask: () => {},
  deleteTask: () => {},
  tasks: [],
});

export const RetroContextProvider: React.FC<
  React.PropsWithChildren<RetroContextParams>
> = ({ children, retroId }) => {
  const { user } = useUser();
  const navigate = useNavigate();

  const timeOffset = useRef<number>();
  const socket = useRef<Socket>();
  const [teamId, setTeamId] = useState<string | null>(null);
  const [columns, setColumns] = useState<RetroColumn[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [teamUsers, setTeamUsers] = useState<UserResponse[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [roomState, setRoomState] = useState<RoomState>("reflection");
  const [timerEnds, setTimerEnds] = useState<number | null>(null);

  const [isReady, setIsReady] = useState(false);
  const [usersReady, setUsersReady] = useState<number>(0);
  const readyPercentage = (usersReady / users.length) * 100;

  const slotMachineDrawnListeners = useRef<SlotMachineDrawnListener[]>([]);
  const [isSlotMachineVisible, setIsSlotMachineVisible] =
    useState<boolean>(false);
  const [highlightedUserId, setHighlightedUserId] = useState<string | null>(
    null,
  );

  const [votes, setVotes] = useState<Vote[]>([]);
  const [maxVotes, setMaxVotes] = useState<number>(0);

  const [discussionCardId, setDiscussionCardId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<RetroTask[]>([]);

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
      reconnection: true,
      reconnectionAttempts: Number.POSITIVE_INFINITY,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 8000,
      randomizationFactor: 0.5,
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
      setIsSlotMachineVisible(roomData.slotMachineVisible);
      setHighlightedUserId(roomData.highlightedUserId);
      setUsers(roomData.users);
      setTasks(roomData.tasks);
      setDiscussionCardId(roomData.discussionCardId);

      const serverTimeOffset = roomData.serverTime - new Date().valueOf();
      timeOffset.current = serverTimeOffset;
      handleTimerChanged(roomData.timerEnds, serverTimeOffset);
    });

    createdSocket.on("event_timer_change", (e: TimerChangedEvent) => {
      handleTimerChanged(e.timerEnds, timeOffset.current ?? 0);
    });

    createdSocket.on(
      "event_slot_machine_drawn",
      (event: SlotMachineDrawnEvent) => {
        setHighlightedUserId(event.highlightedUserId);

        for (const listener of slotMachineDrawnListeners.current) {
          listener({
            highlightedUserId: event.highlightedUserId,
            actorId: event.actorId,
          });
        }
      },
    );

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

  // common
  const setReady = (ready: boolean) => {
    const command: UpdateReadyStateCommand = {
      readyState: ready,
    };
    socket.current?.emit("command_ready", command);
    setIsReady(ready);
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

  const endRetro = () => {
    socket.current?.emit("command_close_room");
  };

  // reflection
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

  // group
  const drawMachine = () => {
    const command: DrawMachineCommand = {};
    socket.current?.emit("command_draw_slot_machine", command);
  };

  const setSlotMachineVisible = (visible: boolean) => {
    const command: ChangeSlotMachineVisibilityCommand = {
      isVisible: visible,
    };
    socket.current?.emit("command_change_slot_machine_visibility", command);
  };

  const addDrawSlotMachineListener = (listener: SlotMachineDrawnListener) => {
    slotMachineDrawnListeners.current.push(listener);
  };

  const removeDrawSlotMachineListener = (
    listener: SlotMachineDrawnListener,
  ) => {
    slotMachineDrawnListeners.current =
      slotMachineDrawnListeners.current.filter((l) => l !== listener);
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

  // vote
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

  // discuss
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

  const setCreatingTask = (creatingTask: boolean) => {
    const command: UpdateCreatingTaskStateCommand = {
      creatingTaskState: creatingTask,
    };
    socket.current?.emit("command_creating_task_state", command);
  };

  const createTask = (text: string, ownerId: string) => {
    const command: CreateTaskCommand = {
      description: text,
      ownerId: ownerId,
    };
    socket.current?.emit("command_create_action_point", command);
    setCreatingTask(false);
  };

  const updateTask = (taskId: string, userId: string, text: string) => {
    const command: UpdateTaskCommand = {
      taskId: taskId,
      ownerId: userId,
      description: text,
    };
    socket.current?.emit("command_update_action_point", command);
  };

  const deleteTask = (taskId: string) => {
    const command: DeleteTaskCommand = {
      taskId: taskId,
    };

    socket.current?.emit("command_delete_action_point", command);
  };

  return (
    <RetroContext.Provider
      value={{
        retroId: retroId,
        teamId: teamId,
        columns: columns,
        cards: cards,
        teamUsers: teamUsers,
        activeUsers: users,

        roomState: roomState,
        nextRoomState: nextRoomState,
        prevRoomState: prevRoomState,
        endRetro: endRetro,

        timerEnds: timerEnds,
        setTimer: setTimer,

        ready: isReady,
        setReady: setReady,
        readyPercentage: readyPercentage,

        // reflection
        setWriting: setWriting,
        createCard: createCard,
        updateCard: updateCard,
        deleteCard: deleteCard,

        // group
        slotMachineVisible: isSlotMachineVisible,
        setSlotMachineVisible: setSlotMachineVisible,
        drawMachine: drawMachine,
        highlightedUserId: highlightedUserId,
        addDrawSlotMachineListener: addDrawSlotMachineListener,
        removeDrawSlotMachineListener: removeDrawSlotMachineListener,
        moveCard: moveCard,

        // vote
        removeVote: removeVote,
        addVote: addVote,
        votes: votes,
        maxVotes: maxVotes,
        setMaxVotesAmount: setMaxVotesAmount,

        // discuss
        discussionCardId: discussionCardId,
        setCreatingTask: setCreatingTask,
        createTask: createTask,
        updateTask: updateTask,
        deleteTask: deleteTask,
        tasks: tasks,
      }}
    >
      {children}
    </RetroContext.Provider>
  );
};
