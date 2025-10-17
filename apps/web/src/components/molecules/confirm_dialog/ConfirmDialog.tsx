import type React from "react";
import { Button } from "@/components/atoms/button/Button";
import { Backdrop } from "@/components/molecules/backdrop/Backdrop";

export interface ConfirmDialogProps {
  title: string;
  content: string;
  onConfirmed: () => void;
  onDismiss?: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  title,
  content,
  onConfirmed,
  onDismiss,
}) => {
  return (
    <Backdrop onDismiss={onDismiss}>
      <div
        className={
          "flex flex-col min-w-[500px] min-h-[150px] bg-background-500 rounded-lg"
        }
        onClick={(e) => e.stopPropagation()}
      >
        <div className={"bg-red-500 p-4 pb-2 rounded-t-lg font-bold text-lg"}>
          {title}
        </div>

        <div className={"flex p-4"}>{content}</div>

        <div className={"flex justify-center items-center gap-4 mt-auto mb-2"}>
          <Button size={"sm"} className={"px-8"} onClick={onDismiss}>
            Nie
          </Button>

          <Button
            size={"sm"}
            className={"px-8"}
            variant={"destructive"}
            onClick={onConfirmed}
          >
            Tak
          </Button>
        </div>
      </div>
    </Backdrop>
  );
};
