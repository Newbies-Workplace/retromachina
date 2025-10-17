import React from "react";
import { pluralText } from "@/lib/pluralText";

import { cn } from "@/lib/utils";

interface PropsCardCount {
  count: number;
  isWriting?: boolean;
}

export const CardCount: React.FC<PropsCardCount> = ({ count, isWriting }) => {
  return (
    <div className={"flex items-center gap-2 p-2"}>
      <div
        className={cn(
          "w-[60px] h-[30px] border rounded-lg bg-[lightgray]",
          isWriting &&
            "animate-pulse bg-gradient-to-br from-[#325AE8] to-[#58EA66]",
        )}
      />
      {count}{" "}
      {pluralText(count, { one: "kartka", few: "kartki", other: "kartek" })}{" "}
      zespołu
    </div>
  );
};
