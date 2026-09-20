import type React from "react";
import type { PokerCard } from "shared/model/poker/poker.types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type PokerToolbarCardProps = {
  card: PokerCard;
  isSelected: boolean;
  voteCount: number;
  onSelect: (card: PokerCard | null) => void;
};

export const PokerToolbarCard: React.FC<PokerToolbarCardProps> = ({
  card,
  isSelected,
  voteCount,
  onSelect,
}) => {
  const cardActionLabel = isSelected
    ? `Odznacz kartę ${card}`
    : `Wybierz kartę ${card}`;

  return (
    <button
      type="button"
      data-testid={`poker-card-${card}`}
      aria-pressed={isSelected}
      aria-label={`${cardActionLabel}${voteCount > 0 ? `, liczba głosów: ${voteCount}` : ""}`}
      className={cn(
        "relative flex aspect-[2/3] w-16 shrink-0 select-none items-center justify-center rounded-xl border-2 border-border bg-background font-medium text-xl shadow-sm outline-none transition-all duration-200 hover:-translate-y-1 hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        isSelected &&
          "-translate-y-3 border-accent bg-primary text-primary-foreground shadow-lg hover:-translate-y-3 hover:bg-primary",
      )}
      onClick={() => onSelect(isSelected ? null : card)}
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
};
