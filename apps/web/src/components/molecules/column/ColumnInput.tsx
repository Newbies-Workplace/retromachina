import React, { useEffect, useRef, useState } from "react";
import type { RetroColumn } from "shared/model/retro/retroRoom.interface";
import { CardCount } from "@/components/atoms/card_indicator/CardIndicator";
import { Textarea } from "@/components/ui/textarea";

interface ColumnInputProps {
  columnData: RetroColumn;
  onCardCreated: (text: string) => void;
  onIsWriting: (value: boolean) => void;
}

export const ColumnInput: React.FC<ColumnInputProps> = ({
  columnData,
  onCardCreated,
  onIsWriting,
}) => {
  const [value, setValue] = useState("");
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);

  const startWriting = () => {
    onIsWriting(true);
  };

  const onStopWriting = () => {
    onIsWriting(false);
  };

  useEffect(() => {
    // Skip the first render to avoid calling onStopWriting
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (value.length > 0 && !columnData.isWriting) {
      startWriting();
    }
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(onStopWriting, 3000);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [value]);

  return (
    <>
      <Textarea
        aria-label={`Dodaj kartę do kolumny ${columnData.name}`}
        placeholder="Zapisz obserwację…"
        className={"min-h-24 resize-none bg-background/80"}
        data-testid="card-input"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onCardCreated(value.trim());
            setValue("");
          }
        }}
      />

      <CardCount
        isWriting={columnData.isWriting}
        count={columnData.teamCardsAmount}
      />
    </>
  );
};
