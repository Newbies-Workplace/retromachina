import type React from "react";
import type { PokerCard } from "shared/model/poker/poker.types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PokerToolbarProps = {
  cards: readonly PokerCard[];
  selectedCard?: PokerCard;
  onCardSelect: (card: PokerCard | null) => void;
};

export const PokerToolbar: React.FC<PokerToolbarProps> = ({
  cards,
  selectedCard,
  onCardSelect,
}) => {
  return (
    <div className="absolute right-2 bottom-0 left-2 flex justify-center rounded-t-2xl bg-card px-4 pt-5 pb-2 shadow-lg">
      <div
        className="flex max-w-full items-end gap-2 overflow-x-auto px-2 pt-4"
        role="toolbar"
        aria-label="Wybierz kartę do estymacji"
      >
        {cards.map((card) => {
          const isSelected = selectedCard === card;

          return (
            <Button
              key={card}
              data-testid={`poker-card-${card}`}
              aria-pressed={isSelected}
              aria-label={
                isSelected ? `Odznacz kartę ${card}` : `Wybierz kartę ${card}`
              }
              className={cn(
                "h-24 w-16 shrink-0 rounded-xl border-2 text-xl transition-transform duration-200 hover:-translate-y-1",
                isSelected &&
                  "-translate-y-3 border-accent shadow-lg hover:-translate-y-3",
              )}
              variant={isSelected ? "default" : "outline"}
              onClick={() => onCardSelect(isSelected ? null : card)}
            >
              {card}
            </Button>
          );
        })}
      </div>
    </div>
  );
};
