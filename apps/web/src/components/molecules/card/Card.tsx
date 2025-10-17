import { computePosition, flip } from "@floating-ui/dom";
import { PencilIcon, SaveIcon } from "lucide-react";
import { motion } from "motion/react";
import React, { createRef, useCallback, useEffect, useState } from "react";
import { Avatar } from "@/components/atoms/avatar/Avatar";
import { Button } from "@/components/atoms/button/Button";
import { PositioningBackdrop } from "@/components/molecules/backdrop/PositioningBackdrop";
import { TeamUserPicker } from "@/components/molecules/card/user_picker/TeamUserPicker";
import useClickOutside from "@/hooks/useClickOutside";
import {cn} from "@/lib/utils";

export interface CardProps {
  style?: React.CSSProperties;
  className?: string;
  id: string;
  text: string;
  author?: CardUser | null;
  teamUsers: CardUser[];
  editableUser?: boolean;
  editableText?: boolean;
  autoFocus?: boolean;
  onUpdate?: (ownerId: string | null, text: string) => void;
  onEditDismiss?: () => void;
}

export type CardUser = {
  avatar: string;
  name: string;
  id: string;
};

export const Card: React.FC<React.PropsWithChildren<CardProps>> = ({
  className,
  style,
  children,
  id,
  text,
  author,
  teamUsers,
  editableUser = false,
  editableText = false,
  autoFocus = false,
  onUpdate,
  onEditDismiss,
}) => {
  const [isUsersOpen, setUsersOpen] = useState(false);
  const [isEditingText, setIsEditingText] = useState(autoFocus);
  const [editingText, setEditingText] = useState(text);

  const userPickerButtonRef = createRef<HTMLDivElement>();
  const userPickerRef = createRef<HTMLDivElement>();

  useEffect(() => {
    if (!userPickerRef.current || !userPickerButtonRef.current) {
      return;
    }

    const userPicker = userPickerRef.current;
    const userPickerButton = userPickerButtonRef.current;

    computePosition(userPickerButton, userPicker, {
      placement: "bottom-start",
      middleware: [flip()],
    }).then((position) => {
      userPicker.style.left = `${position.x}px`;
      userPicker.style.top = `${position.y}px`;
    });
  }, [userPickerButtonRef, userPickerRef]);

  const closeUserPickerPopover = useCallback(() => {
    setUsersOpen(false);
  }, []);

  const closeEditingMode = useCallback(() => {
    setIsEditingText(false);
    setUsersOpen(false);
    onEditDismiss?.();
  }, []);

  useEffect(() => {
    setEditingText(text);
  }, [text]);

  useClickOutside(userPickerRef, closeUserPickerPopover);

  const onTextClick = () => {
    if (editableText) {
      setIsEditingText(true);
    }
  };

  const onChangeUser = (userId: string | null) => {
    onUpdate?.(userId, text);
    setUsersOpen(false);
  };

  const onSaveClick = () => {
    onUpdate?.(author?.id ?? null, editingText.trim());
    setIsEditingText(false);
  };

  return (
    <PositioningBackdrop
      onDismiss={() => closeEditingMode()}
      visible={isEditingText || isUsersOpen}
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
          "flex justify-between gap-1 min-h-[142px] max-h-[142px] min-w-[225px] bg-white border p-2 rounded-2xl h-full",
          className,
        )}
      >
        <div className={"flex flex-col justify-between gap-1 w-full"}>
          {!isEditingText && editingText !== text && (
            <div
              className={
                "w-fit bg-red-500 px-1 rounded-full text-xs text-center text-white"
              }
            >
              Niezapisane zmiany
            </div>
          )}

          {isEditingText ? (
            <textarea
              ref={(el) => el?.focus()}
              className={
                "word-break whitespace-pre-line w-full h-full text-sm scrollbar resize-none p-0 outline-none"
              }
              value={editingText}
              onChange={(e) => setEditingText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSaveClick();
                } else if (e.key === "Escape") {
                  closeEditingMode();
                }
              }}
              onFocus={(e) => {
                // workaround for focus at line end
                const temp = e.target.value;
                e.target.value = "";
                e.target.value = temp;
              }}
            />
          ) : (
            <span
              className={
                "word-break whitespace-pre-line w-full h-full text-sm scrollbar"
              }
              onClick={onTextClick}
            >
              {text}
            </span>
          )}

          <div className={"flex items-center pt-1"}>
            <div style={{ position: "relative" }}>
              {isUsersOpen && teamUsers.length > 1 && (
                <div
                  ref={userPickerRef}
                  className={cn(
                    "flex absolute w-[265px] max-h-[180px] -left-1.5",
                  )}
                >
                  <TeamUserPicker
                    teamUsers={teamUsers.filter(
                      (user) => user.id !== author?.id,
                    )}
                    canPickUnassigned={author !== undefined}
                    onUserPicked={(userId) => onChangeUser(userId)}
                  />
                </div>
              )}
            </div>

            {author !== null && (
              <div
                ref={userPickerButtonRef}
                className={cn(
                  "flex items-center gap-2 p-0.5 rounded",
                  editableUser && "cursor-pointer hover:bg-gray-500",
                )}
                onClick={() => {
                  if (editableUser) {
                    setUsersOpen(true);
                  }
                }}
              >
                <Avatar url={author?.avatar} size={24} />
                <span className={"text-sm"}>
                  {author ? author.name : "Nieprzypisany"}
                </span>
                {editableUser && <PencilIcon className={"size-3"} />}
              </div>
            )}
          </div>
        </div>

        <div className={"flex flex-col select-none gap-2"}>
          {isEditingText ? (
            <Button size={"icon"} onClick={onSaveClick}>
              <SaveIcon className={"size-4"} />
            </Button>
          ) : (
            children
          )}
        </div>
      </motion.div>
    </PositioningBackdrop>
  );
};
