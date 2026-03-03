import { SaveIcon } from "lucide-react";
import { motion } from "motion/react";
import React, { useCallback } from "react";
import { Button } from "@/components/atoms/button/Button";
import { PositioningBackdrop } from "@/components/molecules/backdrop/PositioningBackdrop";
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
  onEditDismiss?: () => void;
}

const CardInner: React.FC<CardProps> = ({
  id,
  style,
  className,
  children,
  onEditDismiss,
}) => {
  const {
    isEditingText,
    isUsersPickerOpen,
    editableTextRef,
    setIsEditingText,
    setIsUsersPickerOpen,
  } = useCardContext();

  const closeEditingMode = useCallback(() => {
    setIsEditingText(false);
    setIsUsersPickerOpen(false);
    onEditDismiss?.();
  }, [onEditDismiss, setIsEditingText, setIsUsersPickerOpen]);

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
    if (React.isValidElement(child)) {
      if (child.type === CardContent) {
        content = child;
      } else if (child.type === CardActions) {
        actions = child;
      } else if (child.type === CardAuthor) {
        author = child;
      }
    }
  }

  return (
    <PositioningBackdrop
      onDismiss={closeEditingMode}
      visible={isEditingText || isUsersPickerOpen}
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
          "flex justify-between gap-1 min-h-[142px] max-h-[142px] min-w-[225px] bg-white border border-black/30 p-2 rounded-2xl h-full",
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

export { CardActions } from "./CardActions";
export type { CardUser } from "./CardAuthor";
export { CardAuthor } from "./CardAuthor";
// Re-export sub-components for convenient imports
export { CardContent } from "./CardContent";
