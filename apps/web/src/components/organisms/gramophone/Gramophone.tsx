import { Disc3Icon } from "lucide-react";
import React, { createRef, useState } from "react";
import { NavbarAction } from "@/components/organisms/navbar/NavbarAction";
import { Button } from "@/components/ui/button";
import useClickOutside from "@/hooks/useClickOutside";

export const Gramophone: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <NavbarAction>
      <Button
        size={"icon"}
        onClick={() => {
          setIsOpen(true);
        }}
      >
        <Disc3Icon className={"size-5"} />
      </Button>

      {isOpen && (
        <GramophoneModal
          onDismiss={() => {
            setIsOpen(false);
          }}
        />
      )}
    </NavbarAction>
  );
};

const GramophoneModal: React.FC<{ onDismiss: () => void }> = ({
  onDismiss,
}) => {
  const gramophonePopover = createRef<HTMLDivElement>();
  useClickOutside(gramophonePopover, onDismiss);

  return (
    <div
      className={
        "flex flex-col absolute top-16 right-16 bg-card rounded-xl p-2 shadow-lg gap-2"
      }
      ref={gramophonePopover}
    >
      <div
        className={
          "flex flex-col items-center rounded-lg bg-background border-2 text-3xl"
        }
      >
        <div className={"flextext-3xl items-center"}>title</div>

        <div className={"flex items-center justify-center flex-row"}>
          <VinylRecord id={"1"} name={"skssss"} />
          <VinylRecord id={"2"} name={"skssss"} />
        </div>
      </div>
    </div>
  );
};

const VinylRecord: React.FC<{ id: string; name: string }> = ({ id, name }) => {
  return (
    <div
      className={
        "flex items-center size-15 rounded-full bg-gray-900 text-white border-2 text-3xl"
      }
    >
      <div className={"flex w-11 text-xs items-center overflow-hidden"}>
        {name}
      </div>
    </div>
  );
};
