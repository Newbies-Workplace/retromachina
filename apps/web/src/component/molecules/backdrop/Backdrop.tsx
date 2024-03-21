import type React from "react";
import { Portal } from "react-portal";
import styles from "./Backdrop.module.scss";

interface BackdropProps {
  onDismiss?: () => void;
  children: React.ReactNode;
}

export const Backdrop: React.FC<BackdropProps> = ({
  children,
  onDismiss = () => {},
}) => {
  return (
    <Portal>
      <div className={styles.backdrop} onClick={onDismiss}>
        {children}
      </div>
    </Portal>
  );
};
