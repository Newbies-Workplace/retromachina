import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import { useCardContext } from "@/components/molecules/card/CardContext";
import { cn } from "@/lib/utils";

export interface EditableTextProps {
  text: string;
  onSave: (text: string) => void;
  editable?: boolean;
  autoFocus?: boolean;
  className?: string;
  onEditDismiss?: (text: string) => void;
  onEditingChange?: (isEditing: boolean) => void;
}

export interface EditableTextRef {
  save: () => string;
  dismiss: () => string;
  getCurrentText: () => string;
}

export const EditableText = forwardRef<EditableTextRef, EditableTextProps>(
  (
    {
      text,
      onSave,
      editable = true,
      autoFocus = false,
      className,
      onEditDismiss,
      onEditingChange,
    },
    ref,
  ) => {
    const { isEditingText, setIsEditingText } = useCardContext();
    const [editingText, setEditingText] = useState(text);

    const handleSave = useCallback(() => {
      const trimmedText = editingText.trim();
      onSave(trimmedText);
      setIsEditingText(false);
      onEditingChange?.(false);

      return trimmedText;
    }, [editingText, onEditingChange, onSave, setIsEditingText]);

    const handleDismiss = useCallback(() => {
      const trimmedText = editingText.trim();

      setIsEditingText(false);
      setEditingText(text);
      onEditingChange?.(false);
      onEditDismiss?.(trimmedText);

      return trimmedText;
    }, [editingText, onEditingChange, onEditDismiss, setIsEditingText, text]);

    useImperativeHandle(
      ref,
      () => ({
        save: () => handleSave(),
        dismiss: () => handleDismiss(),
        getCurrentText: () => editingText,
      }),
      [editingText, handleSave, handleDismiss],
    );

    useEffect(() => {
      setEditingText(text);
    }, [text]);

    useEffect(() => {
      if (autoFocus) {
        onEditingChange?.(true);
      }
    }, [autoFocus, onEditingChange]);

    const onTextClick = () => {
      if (editable) {
        setIsEditingText(true);
        onEditingChange?.(true);
      }
    };

    if (isEditingText) {
      return (
        <textarea
          ref={(el) => el?.focus()}
          className={cn(
            "word-break whitespace-pre-line w-full h-full text-sm scrollbar resize-none p-0 outline-none",
            className,
          )}
          value={editingText}
          onChange={(e) => setEditingText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSave();
            } else if (e.key === "Escape") {
              handleDismiss();
            }
          }}
          onFocus={(e) => {
            // workaround for focus at line end
            const temp = e.target.value;
            e.target.value = "";
            e.target.value = temp;
          }}
        />
      );
    }

    return (
      <span
        className={cn(
          "word-break whitespace-pre-line w-full h-full text-sm scrollbar",
          className,
        )}
        onClick={onTextClick}
      >
        {text}
      </span>
    );
  },
);

EditableText.displayName = "EditableText";
