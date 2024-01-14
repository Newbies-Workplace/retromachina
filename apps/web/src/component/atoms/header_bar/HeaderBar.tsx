import cs from "classnames";
import React from "react";
import styles from "./HeaderBar.module.scss";

interface HeaderBarProps {
  className?: string;
  text: string;
  active?: boolean;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  className,
  text,
  active = false,
}) => {
  return (
    <div
      className={cs(
        styles.tile,
        {
          [styles.active]: active,
        },
        className,
      )}
    >
      <div className={styles.text}>{text}</div>
    </div>
  );
};
