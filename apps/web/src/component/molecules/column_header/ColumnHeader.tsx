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
        "flex flex-col justify-center items-start gap-1 w-full bg-white border p-2 rounded-lg"
      }
    >
      <div className={"flex gap-2 w-full justify-between"}>
        <div className={"flex flex-nowrap items-center gap-2 break-words"}>
          <span className={"text-lg font-bold"}>{header}</span>
        </div>

        {right}
      </div>

      {description !== undefined && (
        <div className={"break-words max-w-full max-h-[140px] scrollbar"}>
          {description}
        </div>
      )}
    </div>
  );
};
