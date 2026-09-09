import type React from "react";
import { EditableColumnText } from "@/components/atoms/editable_column_text/EditableColumnText";

interface ColumnHeaderProps {
  description?: string;
  header: string;
  right?: React.ReactNode;
  editable?: boolean;
  onHeaderSave?: (value: string) => void;
  onDescriptionSave?: (value: string) => void;
}

export const ColumnHeader: React.FC<ColumnHeaderProps> = ({
  description,
  header,
  right,
  editable = false,
  onHeaderSave,
  onDescriptionSave,
}) => {
  return (
    <div
      className={
        "flex flex-col justify-center items-start gap-1 w-full bg-card border border-black/30 p-2 rounded-lg"
      }
    >
      <div className={"flex w-full min-w-0 gap-2"}>
        <div
          className={
            "flex min-w-0 flex-1 flex-nowrap items-center gap-2 wrap-break-word"
          }
        >
          <EditableColumnText
            text={header}
            variant="title"
            onSave={editable ? onHeaderSave : undefined}
          />
        </div>

        {right && <div className="shrink-0">{right}</div>}
      </div>

      {(description !== undefined || editable) && (
        <div className={"wrap-break-word max-w-full max-h-35 scrollbar"}>
          <EditableColumnText
            text={description ?? ""}
            variant="description"
            onSave={editable ? onDescriptionSave : undefined}
          />
        </div>
      )}
    </div>
  );
};
