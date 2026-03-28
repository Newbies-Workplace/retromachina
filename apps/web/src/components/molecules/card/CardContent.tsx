import React, { useEffect, useRef } from "react";
import {
  EditableText,
  EditableTextRef,
} from "@/components/atoms/editable_text/EditableText";
import { useCardContext } from "./CardContext";

export interface CardContentProps {
  text: string;
  editable?: boolean;
  autoFocus?: boolean;
  onSave?: (text: string) => void;
  onEditDismiss?: () => void;
}

export const CardContent: React.FC<CardContentProps> = ({
  text,
  editable = false,
  autoFocus = false,
  onSave,
  onEditDismiss,
}) => {
  const editableTextRef = useRef<EditableTextRef>(null);
  const { setIsEditingText, setEditableTextRef } = useCardContext();

  useEffect(() => {
    setEditableTextRef(editableTextRef);
  }, [setEditableTextRef]);

  const handleSave = (newText: string) => {
    onSave?.(newText);
    setIsEditingText(false);
  };

  const handleEditDismiss = (text: string) => {
    onEditDismiss?.();
    onSave?.(text);
    setIsEditingText(false);
  };

  return (
    <EditableText
      ref={editableTextRef}
      text={text}
      onSave={handleSave}
      editable={editable}
      autoFocus={autoFocus}
      onEditDismiss={handleEditDismiss}
      onEditingChange={setIsEditingText}
    />
  );
};
