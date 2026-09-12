import { XIcon } from "lucide-react";
import type React from "react";
import Navbar from "@/components/organisms/navbar/Navbar";
import { NavbarAction } from "@/components/organisms/navbar/NavbarAction";
import { Button } from "@/components/ui/button";
import { usePoker } from "@/context/poker/PokerContext.hook";
import { useUser } from "@/context/user/UserContext.hook";
import { DeckPicker } from "@/views/poker/components/DeckPicker";
import { PokerPlayer } from "@/views/poker/components/PokerPlayer";
import { PokerToolbar } from "@/views/poker/components/PokerToolbar";
import { pokerDecks } from "@/views/poker/components/pokerDecks";

export const PokerView: React.FC = () => {
  const {
    deckId,
    cardsRevealed,
    selectedCard,
    activeUsers,
    selectDeck,
    selectCard,
    revealCards,
    clearTable,
  } = usePoker();
  const { user } = useUser();
  const selectedDeck =
    pokerDecks.find((deck) => deck.id === deckId) ?? pokerDecks[1];
  const playerPositionRadiusX = 42;
  const playerPositionRadiusY = 34;
  const otherUsers = activeUsers.filter(
    (activeUser) => activeUser.userId !== user?.id,
  );
  const currentUser = activeUsers.find(
    (activeUser) => activeUser.userId === user?.id,
  );

  return (
    <>
      <Navbar
        avatarProps={{
          isReady: selectedCard !== undefined,
        }}
        topContent={
          <NavbarAction>
            <DeckPicker selectedDeckId={deckId} onDeckChange={selectDeck} />
          </NavbarAction>
        }
      />

      <div className="relative flex-1 overflow-hidden px-6 pt-8 pb-36">
        <div
          className="relative mx-auto h-full min-h-80 max-w-4xl"
          role="img"
          aria-label="Stół pokera"
        >
          <div className="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 flex h-36 w-64 items-center justify-center overflow-hidden rounded-xl border-2 border-border bg-card shadow-lg sm:h-44 sm:w-96">
            <div
              className="absolute inset-0 opacity-80 bg-card"
              aria-hidden="true"
            />
            <div className="relative flex items-center gap-3">
              <Button onClick={revealCards}>Odkryj karty</Button>
              <Button variant="destructive" size="icon" onClick={clearTable}>
                <XIcon />
                <span className="sr-only">Wyczyść stół</span>
              </Button>
            </div>
          </div>

          {otherUsers.map((activeUser, index) => {
            const angle = getOtherPlayerAngle(index, otherUsers.length);
            const left = 50 + Math.cos(angle) * playerPositionRadiusX;
            const top = 50 + Math.sin(angle) * playerPositionRadiusY;

            return (
              <PokerPlayer
                key={activeUser.userId}
                user={activeUser}
                cardsRevealed={cardsRevealed}
                className="-translate-x-1/2 -translate-y-1/2 absolute"
                style={{
                  left: `${left}%`,
                  top: `${top}%`,
                }}
              />
            );
          })}

          {currentUser && (
            <PokerPlayer
              user={currentUser}
              cardsRevealed={cardsRevealed}
              className="-translate-x-1/2 -translate-y-1/2 absolute"
              style={{
                left: "50%",
                top: `${50 + playerPositionRadiusY}%`,
              }}
            />
          )}
        </div>

        <PokerToolbar
          cards={selectedDeck.values}
          selectedCard={selectedCard}
          onCardSelect={selectCard}
        />
      </div>
    </>
  );
};

const getOtherPlayerAngle = (index: number, playersCount: number) => {
  if (playersCount <= 1) return -Math.PI / 2;

  const upperArcStart = -Math.PI * 0.85;
  const upperArcEnd = -Math.PI * 0.15;
  const step = (upperArcEnd - upperArcStart) / (playersCount - 1);

  return upperArcStart + step * index;
};
