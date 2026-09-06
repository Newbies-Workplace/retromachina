import React from "react";
import { ColumnHeader } from "@/components/molecules/column_header/ColumnHeader";
import { cn } from "@/lib/utils";

interface ColumnProps {
  className?: string;
  headerStyle?: string;
  headerRight?: React.ReactNode;
  columnData: {
    name: string;
    description: string | null;
  };
}

export const Column: React.FC<React.PropsWithChildren<ColumnProps>> = ({
  className,
  children,
  headerStyle,
  headerRight,
  columnData,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col items-stretch gap-2 min-w-[300px] px-2 py-4 h-full",
        className,
      )}
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
