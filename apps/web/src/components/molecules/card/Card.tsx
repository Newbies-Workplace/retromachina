import { SaveIcon } from "lucide-react";
import { motion } from "motion/react";
import React from "react";
import { PositioningBackdrop } from "@/components/molecules/backdrop/PositioningBackdrop";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CardActions } from "./CardActions";
import { CardAuthor } from "./CardAuthor";
import { CardContent } from "./CardContent";
import { CardContextProvider, useCardContext } from "./CardContext";

export interface CardProps {
  id: string;
  style?: React.CSSProperties;
  className?: string;
  children: React.ReactNode;
  positioningBackgroundEnabled?: boolean;
  saveOnDismiss?: boolean;
}

const CardInner: React.FC<CardProps> = ({
  id,
  style,
  className,
  children,
  positioningBackgroundEnabled = true,
  saveOnDismiss = true,
}) => {
  const {
    isEditingText,
    isUsersPickerOpen,
    editableTextRef,
    setIsEditingText,
    setIsUsersPickerOpen,
  } = useCardContext();

  const closeEditingMode = () => {
    if (!editableTextRef?.current) {
      return;
    }

    if (
      saveOnDismiss &&
      editableTextRef.current.getCurrentText().trim() !== ""
    ) {
      editableTextRef.current.save();
    } else {
      editableTextRef.current.dismiss();
    }

    setIsEditingText(false);
    setIsUsersPickerOpen(false);
  };

  const handleSaveClick = () => {
    if (editableTextRef?.current) {
      editableTextRef.current.save();
    }
  };

  // Separate children into content, actions, and author
  const childrenArray = React.Children.toArray(children);
  let content: React.ReactNode = null;
  let actions: React.ReactNode = null;
  let author: React.ReactNode = null;

  for (const child of childrenArray) {
    if (!React.isValidElement(child)) {
      continue;
    }

    switch (child.type) {
      case CardContent:
        content = child;
        break;
      case CardActions:
        actions = child;
        break;
      case CardAuthor:
        author = child;
        break;
    }
  }

  return (
    <PositioningBackdrop
      onDismiss={closeEditingMode}
      visible={
        positioningBackgroundEnabled && (isEditingText || isUsersPickerOpen)
      }
    >
      <motion.div
        layout
        key={id}
        style={style}
        layoutId={id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={cn(
          "relative flex justify-between gap-1 min-h-[142px] max-h-[142px] min-w-[225px] bg-white dark:bg-card border border-black/30 p-2 rounded-2xl h-full",
          className,
        )}
      >
        <div className={"flex flex-col justify-between gap-1 w-full"}>
          {content}
          {author}
        </div>

        <div className={"flex flex-col select-none gap-2"}>
          {isEditingText ? (
            <Button size={"icon"} onClick={handleSaveClick}>
              <SaveIcon className={"size-4"} />
            </Button>
          ) : (
            actions
          )}
        </div>
      </motion.div>
    </PositioningBackdrop>
  );
};

export const Card: React.FC<CardProps> = (props) => {
  return (
    <CardContextProvider>
      <CardInner {...props} />
    </CardContextProvider>
  );
};

// Re-export sub-components for convenient imports
export { CardActions } from "./CardActions";
export type { CardUser } from "./CardAuthor";
export { CardAuthor } from "./CardAuthor";
export { CardContent } from "./CardContent";
export { CardMetadataTooltip } from "./CardMetadataTooltip";
