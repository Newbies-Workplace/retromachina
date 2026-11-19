import {
  ArrowLeftIcon,
  Layers3Icon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_POKER_DECKS,
  type PokerDeck,
  type PokerDeckId,
  type PokerDeckResponse,
} from "shared/model/poker/poker.types";
import { toast } from "sonner";
import { TeamService } from "@/api/Team.service";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DeckEditor } from "@/views/poker/components/DeckEditor";

type DeckPickerProps = {
  teamId: string;
  selectedDeck: PokerDeck;
  onDeckChange: (deckId: PokerDeckId) => void;
};

type EditorState =
  | { mode: "list" }
  | { mode: "edit"; deck?: PokerDeckResponse };

export const DeckPicker: React.FC<DeckPickerProps> = ({
  teamId,
  selectedDeck,
  onDeckChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [decks, setDecks] =
    useState<readonly PokerDeckResponse[]>(DEFAULT_POKER_DECKS);
  const [editor, setEditor] = useState<EditorState>({ mode: "list" });

  const refresh = useCallback(
    () =>
      TeamService.getPokerDecks(teamId)
        .then(setDecks)
        .catch(() => {
          toast.error("Nie udało się pobrać talii");
        }),
    [teamId],
  );

  useEffect(() => {
    if (isOpen) void refresh();
  }, [isOpen, refresh]);

  const selectDeck = (deckId: PokerDeckId) => {
    onDeckChange(deckId);
    setIsOpen(false);
  };

  const deleteDeck = async (deck: PokerDeckResponse) => {
    try {
      await TeamService.deletePokerDeck(teamId, deck.id);
      toast.success(`Usunięto talię „${deck.name}”`);
    } catch {
      toast.error("Nie udało się usunąć talii");
    }
    await refresh();
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) setEditor({ mode: "list" });
      }}
    >
      <DialogTrigger
        render={
          <Button data-testid="deck-picker">
            <Layers3Icon data-icon="inline-start" />
            {selectedDeck.name}
          </Button>
        }
      />
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-2xl">
        {editor.mode === "edit" ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Button
                  aria-label="Wróć do listy talii"
                  size="icon"
                  variant="ghost"
                  onClick={() => setEditor({ mode: "list" })}
                >
                  <ArrowLeftIcon />
                </Button>
                {editor.deck ? "Edytuj talię" : "Nowa talia"}
              </DialogTitle>
              <DialogDescription>
                Talia będzie dostępna dla wszystkich członków zespołu.
              </DialogDescription>
            </DialogHeader>
            <DeckEditor
              teamId={teamId}
              deck={editor.deck}
              onCancel={() => setEditor({ mode: "list" })}
              onSaved={async (saved, created) => {
                setEditor({ mode: "list" });
                if (created) {
                  selectDeck(saved.id);
                } else {
                  await refresh();
                }
              }}
            />
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Wybierz talię kart</DialogTitle>
              <DialogDescription>
                Wybierz skalę, której zespół użyje podczas estymacji, lub dodaj
                własną talię.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 sm:grid-cols-3">
              {decks.map((deck) => {
                const isSelected = selectedDeck.id === deck.id;
                return (
                  <div key={deck.id} className="relative">
                    <Button
                      data-testid={`deck-${deck.id}`}
                      aria-pressed={isSelected}
                      className="h-full w-full flex-col gap-4 p-4 whitespace-normal"
                      variant={isSelected ? "default" : "outline"}
                      onClick={() => selectDeck(deck.id)}
                    >
                      <DeckBack />
                      <span className="flex flex-col gap-1 text-center">
                        <span>{deck.name}</span>
                        <span className="text-xs opacity-70">
                          {deck.cards.join(", ")}
                        </span>
                      </span>
                    </Button>
                    {deck.source === "team" && (
                      <div className="absolute top-2 right-2 flex gap-1">
                        <Button
                          aria-label={`Edytuj talię ${deck.name}`}
                          size="icon-sm"
                          variant="secondary"
                          onClick={() => setEditor({ mode: "edit", deck })}
                        >
                          <PencilIcon />
                        </Button>
                        <Button
                          aria-label={`Usuń talię ${deck.name}`}
                          size="icon-sm"
                          variant="destructive"
                          onClick={() => deleteDeck(deck)}
                        >
                          <Trash2Icon />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}

              <Button
                data-testid="deck-create"
                className="h-auto min-h-48 flex-col gap-3 border-dashed p-4 whitespace-normal"
                variant="outline"
                onClick={() => setEditor({ mode: "edit" })}
              >
                <PlusIcon className="size-8" />
                <span>Dodaj własną talię</span>
              </Button>
            </div>
          </>
        )}
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
