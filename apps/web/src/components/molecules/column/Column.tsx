import React from "react";
import { ColumnHeader } from "@/components/molecules/column_header/ColumnHeader";
import { cn } from "@/lib/utils";

interface ColumnProps {
  headerStyle?: string;
  headerRight?: React.ReactNode;
  columnData: {
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
      className={
        "flex flex-col items-stretch gap-2 min-w-[300px] px-2 py-4 h-full"
      }
    >
      <div className={cn("flex items-end mb-4", headerStyle)}>
        <ColumnHeader
          header={columnData.name}
          description={columnData.description ?? undefined}
          right={headerRight}
        />
      </div>
      {children}
    </div>
  );
};
