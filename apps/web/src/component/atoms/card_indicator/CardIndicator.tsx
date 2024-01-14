import cs from "classnames";
import React from "react";
import { usePlural } from "../../../context/usePlural";
import styles from "./CardIndicator.module.scss";

interface PropsCardCount {
  count: number;
  isWriting?: boolean;
}

export const CardCount: React.FC<PropsCardCount> = ({ count, isWriting }) => {
  return (
    <div className={styles.wrapper}>
      <div
        className={cs(styles.rect, {
          [styles.active]: isWriting,
        })}
      />
      {count}{" "}
      {usePlural(count, { one: "kartka", few: "kartki", other: "kartek" })}{" "}
      zespołu
    </div>
  );
};
