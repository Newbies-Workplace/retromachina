import React from "react";
import { cn } from "../../../common/Util";
import { usePlural } from "../../../context/usePlural";
import styles from "./CardIndicator.module.scss";

interface PropsCardCount {
  count: number;
  isWriting?: boolean;
}

export const CardCount: React.FC<PropsCardCount> = ({ count, isWriting }) => {
  return (
    <div className={"flex items-center gap-2 p-2"}>
      <div
        className={cn("w-[60px] h-[30px] border rounded-lg bg-[lightgray]", {
          [styles.active]: isWriting,
        })}
      />
      {count}{" "}
      {usePlural(count, { one: "kartka", few: "kartki", other: "kartek" })}{" "}
      zespołu
    </div>
  );
};
