import { TrashIcon } from "lucide-react";
import type React from "react";
import { Button } from "@/component/atoms/button/Button";
import { Input } from "@/component/atoms/input/Input";
import { ColorPicker } from "@/component/molecules/color_picker/ColorPicker";

export interface ColumnCreateProps {
  color: string;
  name: string;
  desc: string;
  onChange: (column: {
    color: string;
    name: string;
    desc: string | null;
  }) => void;
  onDelete: () => void;
  withDescription?: boolean;
}

export const ColumnCreate: React.FC<ColumnCreateProps> = ({
  color,
  name,
  desc,
  onChange,
  onDelete,
  withDescription = false,
}) => {
  return (
    <div
      data-testid={"column-create"}
      className={
        "flex flex-col gap-2 min-w-[300px] max-w-[300px] border bg-background-500 p-2 rounded-2xl"
      }
    >
      <div className={"flex justify-center items-center gap-2"}>
        <ColorPicker
          color={color}
          onChange={(color) => {
            onChange({
              color: color,
              name: name,
              desc: desc,
            });
          }}
        />

        <Input
          data-testid={"column-name"}
          maxLength={35}
          value={name}
          setValue={(name) => {
            onChange({
              color: color,
              name: name,
              desc: desc,
            });
          }}
          placeholder="Nazwa Kolumny"
        />

        <Button
          data-testid={"remove-column"}
          size={"icon"}
          variant={"destructive"}
          onClick={onDelete}
        >
          <TrashIcon className={"size-6"} />
        </Button>
      </div>

      {withDescription && (
        <Input
          data-testid={"column-description"}
          multiline
          value={desc}
          setValue={(desc) =>
            onChange({
              color: color,
              name: name,
              desc: desc,
            })
          }
          placeholder="Opis"
        />
      )}
    </div>
  );
};
