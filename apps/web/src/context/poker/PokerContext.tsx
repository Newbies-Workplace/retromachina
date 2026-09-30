import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  ClearPokerTableCommand,
  RevealPokerCardsCommand,
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
import readySingleSound from "@/assets/sounds/ready-single.wav";
import {
  PokerContext,
  type PokerContextValue,
} from "@/context/poker/PokerContext.context";
import { useUser } from "@/context/user/UserContext.hook";
import { useAudio } from "@/hooks/useAudio";

type PokerContextParams = {
  teamId: string;
};

export const PokerContextProvider: React.FC<
  React.PropsWithChildren<PokerContextParams>
> = ({ children, teamId }) => {
  const { user } = useUser();
  const { playAudio } = useAudio();
  const playAudioRef = useRef(playAudio);
  useEffect(() => {
    playAudioRef.current = playAudio;
  }, [playAudio]);
  const socket = useRef<Socket>(undefined);
  const [deckId, setDeckId] = useState<PokerDeckId>("standard");
  const [cardsRevealed, setCardsRevealed] = useState(false);
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

    let hasSynced = false;
    const playersWithSelection = new Set<string>();
    const handleTableCleared = () => {
      playersWithSelection.clear();
    };

    const handlePokerSync = (event: PokerSyncEvent) => {
      let shouldPlaySound = false;
      for (const activeUser of event.users) {
        if (activeUser.selectedCard === null) continue;
        if (!playersWithSelection.has(activeUser.userId)) {
          playersWithSelection.add(activeUser.userId);
          shouldPlaySound = hasSynced;
        }
      }
      hasSynced = true;
      if (shouldPlaySound) {
        void playAudioRef.current(readySingleSound).catch(() => {
          // Browsers can block audio until the user interacts with the page.
        });
      }
      setDeckId(event.deckId);
      setCardsRevealed(event.cardsRevealed);
      setActiveUsers(event.users);
      setSelectedCard(
        event.users.find((activeUser) => activeUser.userId === user?.id)
          ?.selectedCard ?? undefined,
      );
    };

    const handleSocketError = (error: unknown) => {
      console.error(error);
      toast.error("Wystąpił błąd");
    };

    createdSocket.on("event_poker_sync", handlePokerSync);
    createdSocket.on("event_poker_table_cleared", handleTableCleared);
    createdSocket.on("error", handleSocketError);

    return () => {
      createdSocket.off("event_poker_sync", handlePokerSync);
      createdSocket.off("event_poker_table_cleared", handleTableCleared);
      createdSocket.off("error", handleSocketError);
      createdSocket.disconnect();
    };
  }, [teamId, user?.id]);

  const selectDeck = useCallback((nextDeckId: PokerDeckId) => {
    const command: SelectPokerDeckCommand = { deckId: nextDeckId };
    socket.current?.emit("command_select_deck", command);
  }, []);

  const selectCard = useCallback((card: PokerCard | null) => {
    const command: SelectPokerCardCommand = { card };
    socket.current?.emit("command_select_card", command);
  }, []);

  const revealCards = useCallback(() => {
    const command: RevealPokerCardsCommand = {};
    socket.current?.emit("command_reveal_cards", command);
  }, []);

  const clearTable = useCallback(() => {
    const command: ClearPokerTableCommand = {};
    socket.current?.emit("command_clear_table", command);
  }, []);

  const contextValue = useMemo<PokerContextValue>(
    () => ({
      teamId,
      deckId,
      cardsRevealed,
      selectedCard,
      activeUsers,
      selectDeck,
      selectCard,
      revealCards,
      clearTable,
    }),
    [
      activeUsers,
      cardsRevealed,
      clearTable,
      deckId,
      revealCards,
      selectCard,
      selectDeck,
      selectedCard,
      teamId,
    ],
  );

  return (
    <PokerContext.Provider value={contextValue}>
      {children}
    </PokerContext.Provider>
  );
};
