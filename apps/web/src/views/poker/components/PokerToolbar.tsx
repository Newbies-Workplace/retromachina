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
    <div className="absolute right-2 bottom-0 left-2 flex h-14 justify-center overflow-visible rounded-t-2xl bg-card px-4 shadow-lg">
      <div
        className="absolute right-4 bottom-0 left-4 flex items-end justify-center gap-2 overflow-x-auto px-2 pt-5 pb-3"
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
