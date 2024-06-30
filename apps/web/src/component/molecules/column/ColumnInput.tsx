import React, { useRef } from "react";
import { useEffect, useState } from "react";
import type { RetroColumn } from "shared/model/retro/retroRoom.interface";
import { CardCount } from "../../atoms/card_indicator/CardIndicator";
import { Input } from "../../atoms/input/Input";

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
  }, [value]);

  return (
    <>
      <Input
        className={"bg-[#EAEAEA]"}
        value={value}
        setValue={setValue}
        multiline={true}
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
