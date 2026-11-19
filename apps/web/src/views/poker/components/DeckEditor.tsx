import { SaveIcon } from "lucide-react";
import type React from "react";
import { useId, useState } from "react";
import {
  POKER_DECK_LIMITS,
  type PokerDeckResponse,
  parsePokerCards,
  validatePokerDeck,
} from "shared/model/poker/poker.types";
import { toast } from "sonner";
import { TeamService } from "@/api/Team.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const SUGGESTED_CARDS = "?, 1, 2, 3, 5, 8, 13, 21";

type DeckEditorProps = {
  teamId: string;
  /** Deck to edit; a new deck is created when omitted. */
  deck?: PokerDeckResponse;
  onCancel: () => void;
  onSaved: (deck: PokerDeckResponse, created: boolean) => void;
};

export const DeckEditor: React.FC<DeckEditorProps> = ({
  teamId,
  deck,
  onCancel,
  onSaved,
}) => {
  const nameId = useId();
  const cardsId = useId();
  const [name, setName] = useState(deck?.name ?? "");
  const [cardsInput, setCardsInput] = useState(
    deck ? deck.cards.join(", ") : SUGGESTED_CARDS,
  );
  const [showErrors, setShowErrors] = useState(false);
  const [saving, setSaving] = useState(false);

  const cards = parsePokerCards(cardsInput);
  const validation = validatePokerDeck({ name, cards });
  const error = "error" in validation ? validation.error : undefined;

  const save = async () => {
    if (!validation.ok) {
      setShowErrors(true);
      return;
    }
    setSaving(true);
    try {
      const saved = deck
        ? await TeamService.updatePokerDeck(teamId, deck.id, validation.deck)
        : await TeamService.createPokerDeck(teamId, validation.deck);
      toast.success("Talia została zapisana");
      onSaved(saved, !deck);
    } catch {
      toast.error("Nie udało się zapisać talii");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor={nameId}>Nazwa talii</Label>
        <Input
          id={nameId}
          data-testid="deck-name"
          placeholder="np. Fibonacci"
          maxLength={POKER_DECK_LIMITS.maxNameLength}
          value={name}
          autoFocus
          onChange={(event) => setName(event.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={cardsId}>Karty</Label>
        <Input
          id={cardsId}
          data-testid="deck-cards"
          placeholder={SUGGESTED_CARDS}
          value={cardsInput}
          onChange={(event) => setCardsInput(event.target.value)}
        />
        <span className="text-xs text-muted-foreground">
          Oddziel karty przecinkami. Od {POKER_DECK_LIMITS.minCards} do{" "}
          {POKER_DECK_LIMITS.maxCards} kart, każda maks.{" "}
          {POKER_DECK_LIMITS.maxCardLength} znaki.
        </span>
      </div>

      <fieldset
        className="flex min-h-16 flex-wrap items-center justify-center gap-2 rounded-lg border border-dashed p-3"
        aria-label="Podgląd talii"
        data-testid="deck-preview"
      >
        {cards.length === 0 ? (
          <span className="text-sm text-muted-foreground">
            Tu pojawi się podgląd kart
          </span>
        ) : (
          cards.map((card, index) => (
            <span
              // Duplicates are allowed while typing, so the index keeps keys unique.
              // biome-ignore lint/suspicious/noArrayIndexKey: preview of free-form input
              key={`${card}-${index}`}
              className="flex aspect-[2/3] w-10 items-center justify-center rounded-md border-2 border-border bg-background text-sm font-medium shadow-sm"
            >
              {card}
            </span>
          ))
        )}
      </fieldset>

      {showErrors && error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Anuluj
        </Button>
        <Button type="submit" disabled={saving} data-testid="deck-save">
          <SaveIcon data-icon="inline-start" />
          {deck ? "Zapisz zmiany" : "Dodaj talię"}
        </Button>
      </div>
    </form>
  );
};
