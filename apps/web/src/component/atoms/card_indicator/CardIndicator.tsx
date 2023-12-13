import styles from "./CardIndicator.module.scss";
import React from "react";
import cs from "classnames";
import {usePlural} from "../../../context/usePlural";

interface PropsCardCount {
  count: number;
  isWriting?: Boolean
}

export const CardCount: React.FC<PropsCardCount> = ({ count, isWriting }) => {
  return (
    <div className={styles.wrapper}>
      <div className={cs(styles.rect, {
        [styles.active]: isWriting
      })}/>

      {count} {usePlural(count, {one: "kartka", few: "kartki", other: "kartek"})} zespołu
    </div>
  );
};