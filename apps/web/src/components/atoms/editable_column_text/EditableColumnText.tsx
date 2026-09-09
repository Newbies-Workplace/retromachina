import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface EditableColumnTextProps {
  text: string;
  onSave: (text: string) => void;
  editable: boolean;
  maxLength?: number;
  multiline?: boolean;
  placeholder?: string;
  className?: string;
}

export const EditableColumnText = ({
  text,
  onSave,
  editable,
  maxLength,
  multiline = false,
  placeholder,
  className,
}: EditableColumnTextProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(text);
  const dismissOnBlurRef = useRef(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const displayRef = useRef<HTMLSpanElement>(null);
  const caretOffsetRef = useRef<number | null>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    setValue(text);
  }, [text]);

  useEffect(() => {
    if (!editable) setIsEditing(false);
  }, [editable]);

  useLayoutEffect(() => {
    if (!isEditing) return;
    const input = inputRef.current;
    input?.focus();
    if (input && caretOffsetRef.current !== null) {
      const offset = Math.min(caretOffsetRef.current, input.value.length);
      input.setSelectionRange(offset, offset);
      caretOffsetRef.current = null;
    }
  }, [isEditing]);

  // Re-measure when the title changes because its clamped height can stay fixed
  // while the hidden scroll height changes.
  // biome-ignore lint/correctness/useExhaustiveDependencies: text changes the overflow measurement
  useEffect(() => {
    if (multiline || isEditing) return;
    const display = displayRef.current;
    if (!display) return;

    const updateOverflow = () =>
      setIsOverflowing(display.scrollHeight > display.clientHeight);
    updateOverflow();
    const observer = new ResizeObserver(updateOverflow);
    observer.observe(display);
    return () => observer.disconnect();
  }, [isEditing, multiline, text]);

  const dismiss = () => {
    setValue(text);
    setIsEditing(false);
  };

  const save = () => {
    const trimmedValue = value.trim();
    if (!multiline && trimmedValue.length === 0) {
      dismiss();
      return;
    }
    setIsEditing(false);
    if (trimmedValue !== text) onSave(trimmedValue);
  };

  if (editable && isEditing) {
    return (
      <textarea
        aria-label={placeholder ?? "Edytuj tekst kolumny"}
        ref={inputRef}
        className={cn(
          "w-full min-w-0 cursor-text resize-none bg-transparent p-0 outline-none [field-sizing:content]",
          multiline
            ? "min-h-5 overflow-hidden text-sm"
            : "min-h-7 max-h-14 overflow-y-auto text-lg leading-7 font-bold",
          !value && "text-muted-foreground",
          className,
        )}
        maxLength={maxLength}
        placeholder={placeholder}
        rows={1}
        value={value}
        onBlur={() => {
          if (dismissOnBlurRef.current) {
            dismissOnBlurRef.current = false;
            dismiss();
            return;
          }
          if (isEditing) save();
        }}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            dismissOnBlurRef.current = true;
            event.currentTarget.blur();
          } else if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            event.currentTarget.blur();
          }
        }}
      />
    );
  }

  const display = (
    <span
      ref={displayRef}
      className={cn(
        "w-full min-w-0 whitespace-pre-line wrap-break-word",
        multiline ? "text-sm" : "line-clamp-2 text-lg font-bold",
        editable && "cursor-text",
        !text && "text-muted-foreground",
        className,
      )}
      onPointerDown={(event) => {
        if (!editable || multiline) return;
        const position = document.caretPositionFromPoint?.(
          event.clientX,
          event.clientY,
        );
        caretOffsetRef.current = position?.offset ?? text.length;
      }}
      onClick={() => editable && setIsEditing(true)}
      onKeyDown={(event) => {
        if (editable && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          caretOffsetRef.current = text.length;
          setIsEditing(true);
        }
      }}
      role={editable ? "textbox" : undefined}
      tabIndex={editable ? 0 : undefined}
    >
      {text || placeholder}
    </span>
  );

  if (multiline) return display;

  return (
    <TooltipProvider delay={700}>
      <Tooltip disabled={!isOverflowing}>
        <TooltipTrigger render={display} />
        <TooltipContent className="max-w-sm whitespace-normal">
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
