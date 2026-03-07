import type React from "react";

interface ColumnHeaderProps {
  description?: string;
  header: string;
  right?: React.ReactNode;
}

export const ColumnHeader: React.FC<ColumnHeaderProps> = ({
  description,
  header,
  right,
}) => {
  return (
    <div
      className={
        "flex flex-col justify-center items-start gap-1 w-full bg-card border border-black/30 p-2 rounded-lg"
      }
    >
      <div className={"flex gap-2 w-full justify-between"}>
        <div className={"flex flex-nowrap items-center gap-2 wrap-break-word"}>
          <span className={"text-lg font-bold"}>{header}</span>
        </div>

        {right}
      </div>

      {description !== undefined && (
        <div className={"wrap-break-word max-w-full max-h-35 scrollbar"}>
          {description}
        </div>
      )}
    </div>
  );
};
