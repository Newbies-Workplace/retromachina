import { Layers3Icon } from "lucide-react";
import type React from "react";
import { useState } from "react";
import {
  POKER_DECKS,
  type PokerCard,
  type PokerDeckId,
} from "shared/model/poker/poker.types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const decks: ReadonlyArray<{
  id: PokerDeckId;
  name: string;
  values: readonly PokerCard[];
}> = [
  {
    id: "tshirt",
    name: "Talia koszulkowa",
    values: POKER_DECKS.tshirt,
  },
  {
    id: "standard",
    name: "Talia zwykła",
    values: POKER_DECKS.standard,
  },
];

type DeckPickerProps = {
  selectedDeckId: PokerDeckId;
  onDeckChange: (deckId: PokerDeckId) => void;
};

export const DeckPicker: React.FC<DeckPickerProps> = ({
  selectedDeckId,
  onDeckChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedDeck =
    decks.find((deck) => deck.id === selectedDeckId) ?? decks[1];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger
        render={
          <Button data-testid="deck-picker">
            <Layers3Icon data-icon="inline-start" />
            {selectedDeck.name}
          </Button>
        }
      />
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Wybierz talię kart</DialogTitle>
          <DialogDescription>
            Wybierz skalę, której zespół użyje podczas estymacji.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          {decks.map((deck) => (
            <Button
              key={deck.id}
              data-testid={`deck-${deck.id}`}
              aria-pressed={selectedDeckId === deck.id}
              className="h-auto flex-col gap-4 p-4 whitespace-normal"
              variant={selectedDeckId === deck.id ? "default" : "outline"}
              onClick={() => {
                onDeckChange(deck.id);
                setIsOpen(false);
              }}
            >
              <DeckBack />
              <span className="flex flex-col gap-1 text-center">
                <span>{deck.name}</span>
                <span className="text-xs opacity-70">
                  {deck.values.join(", ")}
                </span>
              </span>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const DeckBack: React.FC = () => {
  return (
    <span className="relative block h-24 w-20" aria-hidden="true">
      <span className="absolute inset-1 rotate-[-10deg] rounded-lg border-2 border-primary-foreground/60 bg-secondary shadow-sm" />
      <span className="absolute inset-1 rotate-[10deg] rounded-lg border-2 border-primary-foreground/60 bg-secondary shadow-sm" />
      <span className="absolute inset-1 flex items-center justify-center rounded-lg border-2 border-primary-foreground/60 bg-secondary shadow-sm">
        <span className="size-10 rotate-45 rounded-md border-2 border-primary/40" />
      </span>
    </span>
  );
};
