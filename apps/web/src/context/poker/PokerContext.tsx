import type React from "react";
import { createContext, useEffect, useRef, useState } from "react";
import type {
  SelectPokerCardCommand,
  SelectPokerDeckCommand,
} from "shared/model/poker/poker.commands";
import type {
  ActivePokerUser,
  PokerSyncEvent,
} from "shared/model/poker/poker.events";
import type { PokerCard, PokerDeckId } from "shared/model/poker/poker.types";
import io, { type Socket } from "socket.io-client";
import { toast } from "sonner";
import { useUser } from "@/context/user/UserContext.hook";

type PokerContextParams = {
  teamId: string;
};

type PokerContextValue = {
  teamId: string;
  deckId: PokerDeckId;
  selectedCard?: PokerCard;
  activeUsers: ActivePokerUser[];
  selectDeck: (deckId: PokerDeckId) => void;
  selectCard: (card: PokerCard | null) => void;
};

export const PokerContext = createContext<PokerContextValue>({
  teamId: "",
  deckId: "standard",
  activeUsers: [],
  selectDeck: () => {},
  selectCard: () => {},
});

export const PokerContextProvider: React.FC<
  React.PropsWithChildren<PokerContextParams>
> = ({ children, teamId }) => {
  const { user } = useUser();
  const socket = useRef<Socket>(undefined);
  const [deckId, setDeckId] = useState<PokerDeckId>("standard");
  const [selectedCard, setSelectedCard] = useState<PokerCard>();
  const [activeUsers, setActiveUsers] = useState<ActivePokerUser[]>([]);

  useEffect(() => {
    const createdSocket = io(`${process.env.RETRO_WEB_SOCKET_URL}/poker`, {
      query: { team_id: teamId },
      extraHeaders: {
        // @ts-expect-error Socket.IO accepts the nullable localStorage result.
        Authorization: window.localStorage.getItem("Bearer"),
      },
      reconnection: true,
      reconnectionAttempts: Number.POSITIVE_INFINITY,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 8000,
      randomizationFactor: 0.5,
    });
    socket.current = createdSocket;

    createdSocket.on("event_poker_sync", (event: PokerSyncEvent) => {
      setDeckId(event.deckId);
      setActiveUsers(event.users);
      setSelectedCard(
        event.users.find((activeUser) => activeUser.userId === user?.id)
          ?.selectedCard ?? undefined,
      );
    });

    createdSocket.on("error", (error) => {
      console.error(error);
      toast.error("Wystąpił błąd");
    });

    return () => {
      createdSocket.removeAllListeners();
      createdSocket.disconnect();
    };
  }, [teamId, user?.id]);

  const selectDeck = (nextDeckId: PokerDeckId) => {
    const command: SelectPokerDeckCommand = { deckId: nextDeckId };
    socket.current?.emit("command_select_deck", command);
  };

  const selectCard = (card: PokerCard | null) => {
    const command: SelectPokerCardCommand = { card };
    socket.current?.emit("command_select_card", command);
  };

  return (
    <PokerContext.Provider
      value={{
        teamId,
        deckId,
        selectedCard,
        activeUsers,
        selectDeck,
        selectCard,
      }}
    >
      {children}
    </PokerContext.Provider>
  );
};
