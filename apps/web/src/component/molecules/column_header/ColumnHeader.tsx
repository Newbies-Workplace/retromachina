import type React from "react";

interface ColumnHeaderProps {
  color: string;
  description?: string;
  header: string;
  right?: React.ReactNode;
}

export const ColumnHeader: React.FC<ColumnHeaderProps> = ({
  color,
  description,
  header,
  right,
}) => {
  return (
    <div
      className={
        "flex flex-col justify-center items-start gap-[5px] w-full bg-[white] border p-2 rounded-2xl"
      }
    >
      <div className={"flex gap-2 w-full justify-between"}>
        <div className={"flex flex-nowrap items-center gap-2 break-words"}>
          <div
            className={"size-5 rounded"}
            style={{ backgroundColor: color }}
          />

          <span className={"text-lg font-bold"}>{header}</span>
        </div>

        {right}
      </div>

      {description !== undefined && (
        <div className={"break-words max-w-[274px] max-h-[140px] scrollbar"}>
          <span>{description}</span>
        </div>
      )}
    </div>
  );
};
