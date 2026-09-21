import type React from "react";
import type { PokerCard } from "shared/model/poker/poker.types";
import { PokerToolbarCard } from "@/views/poker/components/PokerToolbarCard";

type PokerToolbarProps = {
  cards: readonly PokerCard[];
  selectedCard?: PokerCard;
  cardVoteCounts?: Partial<Record<PokerCard, number>>;
  onCardSelect: (card: PokerCard | null) => void;
};

export const PokerToolbar: React.FC<PokerToolbarProps> = ({
  cards,
  selectedCard,
  cardVoteCounts,
  onCardSelect,
}) => {
  return (
    <div className="pointer-events-none fixed right-0 bottom-0 left-0 z-30 flex px-2">
      <div
        className="pointer-events-auto relative mx-auto flex h-20 w-full max-w-3xl items-end justify-center gap-2 overflow-visible rounded-t-2xl border border-b-0 border-border bg-card px-4 pt-2 pb-3 shadow-lg"
        role="toolbar"
        aria-label="Wybierz kartę do estymacji"
      >
        {cards.map((card) => {
          return (
            <PokerToolbarCard
              key={card}
              card={card}
              isSelected={selectedCard === card}
              voteCount={cardVoteCounts?.[card] ?? 0}
              onSelect={onCardSelect}
            />
          );
        })}
      </div>
    </div>
  );
};
