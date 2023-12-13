import React, {createContext, useEffect, useRef, useState} from "react";
import io, {Socket} from "socket.io-client";
import {
  ActionPoint,
  TimerChangeEvent,
  RoomSyncEvent,
  SocketCard,
  SocketColumn, SocketUser,
  SocketVote
} from "../../api/retro/Retro.events";
import {
  AddVoteCommand,
  DeleteCardCommand,
  SetMaxVotesCommand,
  CreateCardCommand,
  ReadyCommand,
  RemoveVoteCommand,
  RoomState,
  RoomStateCommand,
  SetTimerCommand,
  WriteStateCommand,
  MoveCardToColumnCommand,
  AddCardToCardCommand,
  UpdateActionPointCommand,
  CreateActionPointCommand,
  DeleteActionPointCommand, ChangeCurrentDiscussCardCommand, UpdateCardCommand
} from "../../api/retro/Retro.commands";
import {UserResponse} from "../../api/user/User.interfaces";
import {v4 as uuidv4} from "uuid";
import {useUser} from "../user/UserContext.hook";
import {getUsersByTeamId} from "../../api/user/User.service";
import {CardMoveAction} from "../../interfaces/CardMoveAction.interface";
import { useNavigate } from "react-router";
import {useCardGroups} from "../useCardGroups";
import {toast} from "react-toastify";

interface RetroContextParams {
  retroId: string
}

interface RetroContext {
  retroId: string
  teamId: string | null
  columns: SocketColumn[]
  cards: SocketCard[]
  teamUsers: UserResponse[]
  activeUsers: SocketUser[]
  roomState: RoomState

  discussionCardId: string | null
  timerEnds: number | null
  setTimer: (time: number | null) => void

  ready: boolean
  setReady: (ready: boolean) => void
  readyPercentage: number

  setWriting: (value: boolean, columnId: string) => void

  createCard: (text: string, columnId: string) => void
  updateCard: (cardId: string, text: string) => void
  deleteCard: (cardId: string) => void

  nextRoomState: () => void
  prevRoomState: () => void
  removeVote: (parentCardId: string) => void
  addVote: (parentCardId: string) => void
  votes: SocketVote[]
  maxVotes: number
  setMaxVotesAmount: (amount: number) => void

  moveCard: (action: CardMoveAction) => void

  endRetro: () => void

  updateActionPoint: (actionPointId: string, userId: string, text: string) => void
  createActionPoint: (text: string, ownerId: string) => void
  deleteActionPoint: (actionPointId: string) => void
  actionPoints: ActionPoint[]
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

export const RetroContextProvider: React.FC<React.PropsWithChildren<RetroContextParams>> = (
    {
      children,
      retroId,
    }
) => {
  const socket = useRef<Socket>()
  const timeOffset = useRef<number>()
  const [teamId, setTeamId] = useState<string | null>(null)
  const [votes, setVotes] = useState<SocketVote[]>([])
  const [maxVotes, setMaxVotes] = useState<number>(0)
  const [timerEnds, setTimerEnds] = useState<number | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [roomState, setRoomState] = useState<RoomState>("reflection")
  const [teamUsers, setTeamUsers] = useState<UserResponse[]>([])
  const [columns, setColumns] = useState<SocketColumn[]>([])
  const [cards, setCards] = useState<SocketCard[]>([])
  const [usersReady, setUsersReady] = useState<number>(0)
  const [users, setUsers] = useState<SocketUser[]>([])
  const [actionPoint,setActionPoint] = useState<ActionPoint[]>([])
  const [discussionCardId, setDiscussionCardId] = useState<string | null>(null);

  const {user} = useUser()
  const navigate = useNavigate()
  const readyPercentage = (usersReady / users.length) * 100

  useEffect(() => {
    const createdSocket = io(
        `${process.env.RETRO_SOCKET_URL}/retro`,
        {
          query: {
            retro_id: retroId,
          },
          extraHeaders: {
            //@ts-ignore
            Authorization: window.localStorage.getItem("Bearer"),
          },
          forceNew: true
        }
    );
    socket.current = createdSocket;

    createdSocket.on("error", (e) => {
      console.log(e)
      toast.error('Wystąpił błąd')
    });

    createdSocket.on("event_room_sync", ({roomData}: RoomSyncEvent) => {
      setRoomState(roomData.roomState)
      setTeamId(roomData.teamId)
      setColumns(roomData.retroColumns)
      setCards(roomData.cards)
      setUsersReady(roomData.usersReady)
      setVotes(roomData.votes)
      setMaxVotes(roomData.maxVotes)
      setIsReady(roomData.users.find((u) => u.id === user?.id)?.isReady || false)
      setUsers(roomData.users)
      setActionPoint(roomData.actionPoints)
      setDiscussionCardId(roomData.discussionCardId)

      const serverTimeOffset = roomData.serverTime - new Date().valueOf()
      timeOffset.current = serverTimeOffset
      handleTimerChanged(roomData.timerEnds, serverTimeOffset)
    })

    createdSocket.on("event_timer_change", (e: TimerChangeEvent) => {
      handleTimerChanged(e.timerEnds, timeOffset.current ?? 0)
    });

    createdSocket.on("event_close_room", () => {
      navigate(`/retro/${retroId}/summary`)
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
  }, [teamId])

  const createActionPoint = (text: string, ownerId: string) => {
    const command: CreateActionPointCommand = {
      text: text,
      ownerId: ownerId,
    }
    socket.current?.emit("command_create_action_point", command)
  }

  const deleteActionPoint = (actionPointId: string) => {
    const command: DeleteActionPointCommand = {
      actionPointId: actionPointId
    }

    socket.current?.emit("command_delete_action_point", command)
  }

  const updateActionPoint = (apId: string, userId: string, text: string) => {
    const command: UpdateActionPointCommand = {
      actionPointId: apId,
      ownerId: userId,
      text: text
    }
    socket.current?.emit("command_update_action_point", command)
  }

  const endRetro = () => {
    socket.current?.emit("command_close_room")
  }

  const addVote = (parentCardId: string) => {
    const command: AddVoteCommand = {
      parentCardId: parentCardId
    }
    socket.current?.emit("command_vote_on_card", command)
  }

  const removeVote = (parentCardId: string) => {
    const command: RemoveVoteCommand = {
      parentCardId: parentCardId
    }
    socket.current?.emit("command_remove_vote_on_card", command)
  }

  const setMaxVotesAmount = (amount: number) => {
    const command: SetMaxVotesCommand = {
      votesAmount: amount
    }
    socket.current?.emit("command_change_vote_amount", command)
  }

  const setReady = (ready: boolean) => {
    const command: ReadyCommand = {
      readyState: ready
    }
    socket.current?.emit("command_ready", command);
    setIsReady(ready);
  };

  const setWriting = (value: boolean, columnId: string) => {
    const command: WriteStateCommand = {
      columnId: columnId,
      writeState: value,
    }
    socket.current?.emit("command_write_state", command);
  }

  const createCard = (text: string, columnId: string) => {
    const command: CreateCardCommand = {
      id: uuidv4(),
      text: text,
      columnId: columnId,
      authorId: user!.id,
    }
    socket.current?.emit("command_create_card", command)
    setWriting(false, columnId)
  }

  const updateCard = (cardId: string, text: string) => {
    const command: UpdateCardCommand = {
      cardId: cardId,
      text: text,
    }
    socket.current?.emit("command_update_card", command)
  }

  const deleteCard = (cardId: string) => {
    const command: DeleteCardCommand = {
      cardId: cardId
    }
    socket.current?.emit("command_delete_card", command)
  }

  const setTimer = (time: number | null) => {
    setTimerEnds(time)
    const command: SetTimerCommand = {
      timestamp: time ? time + (timeOffset.current ?? 0) : null
    }
    socket.current?.emit("command_timer_change", command)
  }

  const handleTimerChanged = (time: number | null, serverOffset: number) => {
    setTimerEnds(time ? time - serverOffset : null)
  }

  const nextRoomState = () => {
    let state: RoomState;
    switch (roomState) {
      case "reflection":
        state = "group"
        break;
      case "group":
        state = "vote";
        break;
      case "vote":
        state = "discuss";
        break;
      case "discuss":
        changeDiscussCard("next")
        return;
    }

    const command: RoomStateCommand = {
      roomState: state
    }

    socket.current?.emit("command_room_state", command)
  }

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

    const command: RoomStateCommand = {
      roomState: state
    }
    socket.current?.emit("command_room_state", command)
  }

  const changeDiscussCard = (to: "next" | "prev") => {
    const groups = useCardGroups(cards, votes).sort((a, b) => b.votes - a.votes)

    if (!discussionCardId) {
      return false;
    }
    const currentIndex = groups.findIndex(g => g.parentCardId === discussionCardId)
    const targetIndex = to === "next"
        ? currentIndex + 1
        : currentIndex - 1

    if (to === "next" && targetIndex >= groups.length) {
      return true;
    } else if (to === "prev" && targetIndex < 0) {
      return true;
    }

    const targetCardId = groups[targetIndex]?.parentCardId

    const command: ChangeCurrentDiscussCardCommand = {
      cardId: targetCardId
    }
    socket.current?.emit("command_change_discussion_card", command)

    return false
  }

  const moveCard = (move: CardMoveAction) => {
    if (move.targetType == 'column') {
      const command: MoveCardToColumnCommand = {
        cardId: move.cardId,
        columnId: move.targetId,
      }
      socket.current?.emit("command_move_card_to_column", command)
    } else if (move.targetType == 'card') {
      const command: AddCardToCardCommand = {
        cardId: move.cardId,
        parentCardId: move.targetId,
      }
      socket.current?.emit("command_card_add_to_card", command)
    }
  }

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
            endRetro:endRetro,
            updateActionPoint: updateActionPoint,
            createActionPoint: createActionPoint,
            deleteActionPoint: deleteActionPoint,
            actionPoints: actionPoint,
          }}
      >
        {children}
      </RetroContext.Provider>
  );
};
