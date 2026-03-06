import React, { createContext, useContext, useState } from "react";
import type { EditableTextRef } from "@/components/atoms/editable_text/EditableText";

interface CardContextValue {
  isEditingText: boolean;
  setIsEditingText: (value: boolean) => void;
  isUsersPickerOpen: boolean;
  setIsUsersPickerOpen: (value: boolean) => void;
  editableTextRef: React.RefObject<EditableTextRef> | null;
  setEditableTextRef: (ref: React.RefObject<EditableTextRef>) => void;
}

const CardContext = createContext<CardContextValue | undefined>(undefined);

export const useCardContext = () => {
  const context = useContext(CardContext);
  if (!context) {
    throw new Error("Card compound components must be used within Card");
  }
  return context;
};

export interface CardContextProviderProps {
  children: React.ReactNode;
}

export const CardContextProvider: React.FC<CardContextProviderProps> = ({
  children,
}) => {
  const [isEditingText, setIsEditingText] = useState(false);
  const [isUsersPickerOpen, setIsUsersPickerOpen] = useState(false);
  const [editableTextRef, setEditableTextRef] =
    useState<React.RefObject<EditableTextRef> | null>(null);

  const value: CardContextValue = {
    isEditingText,
    setIsEditingText,
    isUsersPickerOpen,
    setIsUsersPickerOpen,
    editableTextRef,
    setEditableTextRef,
  };

  return <CardContext.Provider value={value}>{children}</CardContext.Provider>;
};
