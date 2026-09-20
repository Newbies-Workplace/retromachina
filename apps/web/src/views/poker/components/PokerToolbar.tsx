import type React from "react";
import type { PokerCard } from "shared/model/poker/poker.types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
    <div className="absolute right-2 bottom-0 left-2 flex justify-center overflow-visible rounded-t-2xl bg-card px-4 py-1 shadow-lg">
      <div
        className="-translate-y-6 flex max-w-full items-end gap-2 overflow-x-auto px-2 pt-4"
        role="toolbar"
        aria-label="Wybierz kartę do estymacji"
      >
        {cards.map((card) => {
          const isSelected = selectedCard === card;
          const voteCount = cardVoteCounts?.[card] ?? 0;
          const cardActionLabel = isSelected
            ? `Odznacz kartę ${card}`
            : `Wybierz kartę ${card}`;

          return (
            <button
              type="button"
              key={card}
              data-testid={`poker-card-${card}`}
              aria-pressed={isSelected}
              aria-label={`${cardActionLabel}${voteCount > 0 ? `, liczba głosów: ${voteCount}` : ""}`}
              className={cn(
                "relative flex aspect-[2/3] w-16 shrink-0 select-none items-center justify-center rounded-xl border-2 border-border bg-background font-medium text-xl shadow-sm outline-none transition-all duration-200 hover:-translate-y-1 hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                isSelected &&
                  "-translate-y-3 border-accent bg-primary text-primary-foreground shadow-lg hover:-translate-y-3 hover:bg-primary",
              )}
              onClick={() => onCardSelect(isSelected ? null : card)}
            >
              {card}
              {voteCount > 0 && (
                <Badge
                  variant="secondary"
                  className="pointer-events-none absolute bottom-1 left-1 min-w-5 px-1 py-0 text-[10px] leading-4"
                  aria-hidden="true"
                  data-testid={`poker-card-${card}-vote-count`}
                >
                  {voteCount}
                </Badge>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
