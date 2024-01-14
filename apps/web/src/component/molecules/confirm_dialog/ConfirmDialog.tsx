import cs from "classnames";
import React from "react";
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
            size={"small"}
            className={cs(styles.button, styles.noButton)}
            onClick={onDismiss}
          >
            Nie
          </Button>

          <Button
            size={"small"}
            className={styles.button}
            onClick={onConfirmed}
          >
            Tak
          </Button>
        </div>
      </div>
    </Backdrop>
  );
};
