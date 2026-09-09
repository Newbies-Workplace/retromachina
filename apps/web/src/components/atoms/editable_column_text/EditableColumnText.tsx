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
  variant: "title" | "description";
  onSave?: (text: string) => void;
}

export const EditableColumnText = ({
  text,
  variant,
  onSave,
}: EditableColumnTextProps) => {
  const [draft, setDraft] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const displayRef = useRef<HTMLSpanElement>(null);
  const caretOffsetRef = useRef<number | null>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const isDescription = variant === "description";
  const editable = onSave !== undefined;
  const isEditing = editable && draft !== null;
  const placeholder = isDescription ? "Dodaj opis" : undefined;

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
    if (isDescription || isEditing) return;
    const display = displayRef.current;
    if (!display) return;

    const updateOverflow = () =>
      setIsOverflowing(display.scrollHeight > display.clientHeight);
    updateOverflow();
    const observer = new ResizeObserver(updateOverflow);
    observer.observe(display);
    return () => observer.disconnect();
  }, [isDescription, isEditing, text]);

  const dismiss = () => {
    setDraft(null);
  };

  const save = () => {
    if (draft === null) return;
    if (!isDescription && draft.trim().length === 0) {
      dismiss();
      return;
    }
    const value = isDescription ? draft.trim() : draft;
    setDraft(null);
    if (value !== text) onSave?.(value);
  };

  if (isEditing) {
    return (
      <textarea
        aria-label={placeholder ?? "Edytuj tekst kolumny"}
        ref={inputRef}
        className={cn(
          "w-full min-w-0 cursor-text resize-none bg-transparent p-0 outline-none [field-sizing:content]",
          isDescription
            ? "min-h-5 overflow-hidden text-sm"
            : "min-h-7 max-h-14 overflow-y-auto text-lg leading-7 font-bold",
          !draft && "text-muted-foreground",
        )}
        placeholder={placeholder}
        rows={1}
        value={draft}
        onBlur={save}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            dismiss();
          } else if (
            event.key === "Enter" &&
            (!isDescription || !event.shiftKey)
          ) {
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
        isDescription ? "text-sm" : "line-clamp-2 text-lg font-bold",
        editable && "cursor-text",
        !text && "text-muted-foreground",
      )}
      onPointerDown={(event) => {
        if (!editable) return;
        const position = document.caretPositionFromPoint?.(
          event.clientX,
          event.clientY,
        );
        caretOffsetRef.current = position?.offset ?? text.length;
      }}
      onClick={() => editable && setDraft(text)}
      onKeyDown={(event) => {
        if (editable && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          caretOffsetRef.current = text.length;
          setDraft(text);
        }
      }}
      role={editable ? "textbox" : undefined}
      tabIndex={editable ? 0 : undefined}
    >
      {text || placeholder}
    </span>
  );

  if (isDescription) return display;

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
