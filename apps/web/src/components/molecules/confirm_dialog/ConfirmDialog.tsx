import type React from "react";
import { Backdrop } from "@/components/molecules/backdrop/Backdrop";
import { Button } from "@/components/ui/button";

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
          "flex flex-col min-w-125 min-h-35 p-4 bg-background rounded-lg"
        }
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={
            "bg-destructive -mt-4 -mx-4 p-4 rounded-t-lg font-bold text-lg"
          }
        >
          {title}
        </div>

        <div className={"flex p-4"}>{content}</div>

        <div className={"flex justify-center items-center gap-4 mt-auto mb-2"}>
          <Button className={"grow"} onClick={onDismiss}>
            Nie
          </Button>

          <Button
            className={"grow"}
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
