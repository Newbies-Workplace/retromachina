import type React from "react";
import { Button } from "../../atoms/button/Button";
import { Backdrop } from "../backdrop/Backdrop";
import styles from "./ConfirmDialog.module.scss";

interface ConfirmDialogProps {
  title: string;
  content: string;
  onConfirmed: () => void;
  onDismiss: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  title,
  content,
  onConfirmed,
  onDismiss,
}) => {
  return (
    <Backdrop onDismiss={onDismiss}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <div className={styles.title}>{title}</div>

        <div className={styles.content}>{content}</div>

        <div className={styles.buttons}>
          <Button
            size={"sm"}
            className={"px-8"}
            variant={"destructive"}
            onClick={onDismiss}
          >
            Nie
          </Button>

          <Button size={"sm"} className={"px-8"} onClick={onConfirmed}>
            Tak
          </Button>
        </div>
      </div>
    </Backdrop>
  );
};
