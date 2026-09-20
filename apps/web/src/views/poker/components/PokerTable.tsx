import { XIcon } from "lucide-react";
import type React from "react";
import type { ActivePokerUser } from "shared/model/poker/poker.events";
import { Button } from "@/components/ui/button";
import { PokerPlayer } from "@/views/poker/components/PokerPlayer";

type PokerTableProps = {
  users: ActivePokerUser[];
  currentUserId?: string;
  cardsRevealed: boolean;
  onRevealCards: () => void;
  onClearTable: () => void;
};

const tableEdgeCenterY = 76;
const playerPositionRadiusX = 43;
const playerPositionRadiusY = 48;

export const PokerTable: React.FC<PokerTableProps> = ({
  users,
  currentUserId,
  cardsRevealed,
  onRevealCards,
  onClearTable,
}) => {
  const otherUsers = users.filter((activeUser) => {
    return activeUser.userId !== currentUserId;
  });
  const currentUser = users.find((activeUser) => {
    return activeUser.userId === currentUserId;
  });

  return (
    <section
      className="relative mx-auto aspect-[4/3] h-auto max-h-full w-full max-w-3xl"
      aria-label="Stół pokera"
    >
      <div className="-translate-x-1/2 absolute top-[32%] left-1/2 flex h-[46%] w-[78%] items-center justify-center overflow-hidden rounded-b-xl border-2 border-border bg-card shadow-lg [border-top-left-radius:50%_100%] [border-top-right-radius:50%_100%]">
        <div
          className="absolute inset-0 opacity-80 bg-card"
          aria-hidden="true"
        />
        <div className="relative flex items-center gap-3">
          <Button onClick={onRevealCards}>Odkryj karty</Button>
          <Button variant="destructive" size="icon" onClick={onClearTable}>
            <XIcon />
            <span className="sr-only">Wyczyść stół</span>
          </Button>
        </div>
      </div>

      {otherUsers.map((activeUser, index) => {
        const angle = getOtherPlayerAngle(index, otherUsers.length);
        const left = 50 + Math.cos(angle) * playerPositionRadiusX;
        const top = tableEdgeCenterY + Math.sin(angle) * playerPositionRadiusY;

        return (
          <PokerPlayer
            key={activeUser.userId}
            user={activeUser}
            cardsRevealed={cardsRevealed}
            cardSide={left < 50 ? "left" : "right"}
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
            top: "84%",
          }}
        />
      )}
    </section>
  );
};

const getOtherPlayerAngle = (index: number, playersCount: number) => {
  if (playersCount <= 1) return -Math.PI / 2;

  const upperArcStart = -Math.PI * 0.9;
  const upperArcEnd = -Math.PI * 0.1;
  const step = (upperArcEnd - upperArcStart) / (playersCount - 1);

  return upperArcStart + step * index;
};
