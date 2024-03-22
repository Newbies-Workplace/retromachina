import type React from "react";
import { cn } from "../../../common/Util";
import { ColumnHeader } from "../column_header/ColumnHeader";
import styles from "./Column.module.scss";

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
    <div className={styles.cardWrapper}>
      <div className={cn(styles.columnHeaderWrapper, headerStyle)}>
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
