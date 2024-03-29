import type React from "react";
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
  const onStopWriting = () => {
    if (columnData.isWriting) {
      onIsWriting(false);
    }
  };

  useEffect(() => {
    if (value !== "" && !columnData.isWriting) {
      onIsWriting(true);
    }
    const timeout = setTimeout(onStopWriting, 3000);

    return () => {
      clearTimeout(timeout);
    };
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
