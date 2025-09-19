import React from "react";
import { cn } from "@/common/Util";
import { ColumnHeader } from "@/component/molecules/column_header/ColumnHeader";

interface ColumnProps {
  headerStyle?: string;
  headerRight?: React.ReactNode;
  columnData: {
    color: string;
    name: string;
    description: string | null;
  };
}

export const Column: React.FC<React.PropsWithChildren<ColumnProps>> = ({
  children,
  headerStyle,
  headerRight,
  columnData,
}) => {
  return (
    <div
      className={"flex flex-col items-stretch gap-2 min-w-[300px] px-2 py-4"}
    >
      <div className={cn("flex items-end mb-4", headerStyle)}>
        <ColumnHeader
          color={columnData.color}
          header={columnData.name}
          description={columnData.description ?? undefined}
          right={headerRight}
        />
      </div>
      {children}
    </div>
  );
};
