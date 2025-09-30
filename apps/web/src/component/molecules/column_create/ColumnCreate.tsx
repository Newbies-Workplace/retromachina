import { TrashIcon } from "lucide-react";
import type React from "react";
import { Button } from "@/component/atoms/button/Button";
import { Input } from "@/component/atoms/input/Input";

export interface ColumnCreateProps {
  name: string;
  desc: string;
  onChange: (column: { name: string; desc: string | null }) => void;
  onDelete: () => void;
  withDescription?: boolean;
}

export const ColumnCreate: React.FC<ColumnCreateProps> = ({
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
        "flex flex-col gap-2 min-w-[300px] max-w-[300px] bg-secondary-500 p-2 rounded-xl"
      }
    >
      <div className={"flex justify-center items-center gap-2"}>
        <Input
          data-testid={"column-name"}
          maxLength={35}
          value={name}
          setValue={(name) => {
            onChange({
              name: name,
              desc: desc,
            });
          }}
          placeholder="Nazwa Kolumny"
        />

        <Button
          data-testid={"remove-column"}
          size={"sm"}
          variant={"destructive"}
          onClick={onDelete}
        >
          <TrashIcon className={"size-5"} />
        </Button>
      </div>

      {withDescription && (
        <Input
          data-testid={"column-description"}
          multiline
          value={desc}
          setValue={(desc) =>
            onChange({
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
