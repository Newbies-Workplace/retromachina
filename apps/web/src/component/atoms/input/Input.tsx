import type React from "react";
import type { KeyboardEventHandler } from "react";
import { cn } from "../../../common/Util";

interface InputProps {
  className?: string;
  value: string;
  setValue: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  type?: React.HTMLInputTypeAttribute;
  disabled?: boolean;
  required?: boolean;
  right?: React.ReactNode;
  onKeyDown?:
    | KeyboardEventHandler<HTMLInputElement | HTMLTextAreaElement>
    | undefined;
  maxLength?: number;
}

export const Input: React.FC<InputProps> = ({
  className,
  value,
  setValue,
  placeholder,
  onKeyDown,
  multiline = false,
  type,
  right,
  disabled,
  required,
  maxLength,
}) => {
  const Element = multiline ? "textarea" : "input";

  return (
    <div
      className={cn(
        "flex h-9 w-full rounded-md border border-input bg-white text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        multiline && "min-h-[120px]",
        disabled && "border-gray-600",
      )}
    >
      <Element
        maxLength={maxLength}
        className={cn(
          "p-1 w-full h-full rounded-md border-none outline-none resize-none",
          multiline && "scrollbar",
          className,
        )}
        value={value}
        type={type}
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
      />

      {right !== undefined && (
        <div className={"flex items-center"}>{right}</div>
      )}
    </div>
  );
};
