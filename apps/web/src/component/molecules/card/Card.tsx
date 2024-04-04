import { Pencil1Icon } from "@radix-ui/react-icons";
import { motion } from "framer-motion";
import React, { createRef } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import SaveIcon from "../../../assets/icons/save.svg";
import { cn } from "../../../common/Util";
import useClickOutside from "../../../context/useClickOutside";
import { Avatar } from "../../atoms/avatar/Avatar";
import { Button } from "../../atoms/button/Button";
import { PositioningBackdrop } from "../backdrop/PositioningBackdrop";

export interface CardProps {
  style?: React.CSSProperties;
  className?: string;
  id: string;
  text: string;
  author?: CardUser;
  teamUsers: CardUser[];
  editableUser?: boolean;
  editableText?: boolean;
  autoFocus?: boolean;
  onUpdate?: (ownerId: string, text: string) => void;
  onEditDismiss?: () => void;
}

type CardUser = {
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

  const userPickerRef = createRef<HTMLDivElement>();
  const userPickerDirection = useRef<"up" | "down">("down");

  useEffect(() => {
    if (userPickerRef.current) {
      const rect = userPickerRef.current.getBoundingClientRect();
      if (rect.top > window.innerHeight / 2) {
        userPickerDirection.current = "up";
      } else {
        userPickerDirection.current = "down";
      }
    }
  }, []);

  const closeUserPickerPopover = useCallback(() => {
    setUsersOpen(false);
  }, []);

  const closeEditingMode = useCallback(() => {
    setIsEditingText(false);
    setUsersOpen(false);
    setEditingText(text);
    onEditDismiss?.();
  }, [text]);

  useEffect(() => {
    setEditingText(text);
  }, [text]);

  useClickOutside(userPickerRef, closeUserPickerPopover);

  const onTextClick = () => {
    if (editableText) {
      setIsEditingText(true);
    }
  };

  const onChangeUser = (userId: string) => {
    onUpdate?.(userId, text);
    setUsersOpen(false);
  };

  const onSaveClick = () => {
    if (!author) {
      return;
    }
    onUpdate?.(author.id, editingText.trim());
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
        <div className={"flex flex-col justify-between w-full"}>
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

          {author && (
            <div className={"flex items-center pt-1"} ref={userPickerRef}>
              <div style={{ position: "relative" }}>
                {isUsersOpen && teamUsers.length > 1 && (
                  <div
                    className={cn(
                      "flex absolute w-[265px] max-h-[180px] -left-1.5",
                      userPickerDirection.current === "up" &&
                        "items-end bottom-6",
                      userPickerDirection.current === "down" &&
                        "items-start top-6",
                    )}
                  >
                    <div
                      className={
                        "flex flex-col items-start gap-2 min-w-[250px] max-h-36 bg-white p-1 rounded-lg shadow-[0px_4px_4px_rgba(0,0,0,0.25)]"
                      }
                    >
                      <div
                        className={
                          "flex flex-col items-start overflow-auto gap-2 min-w-[250px] scrollbar"
                        }
                      >
                        <TeamUserPicker
                          authorId={author?.id || ""}
                          teamUsers={teamUsers}
                          onUserPicked={(userId) => onChangeUser(userId)}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div
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
                <Avatar url={author.avatar} size={24} />
                <span className={"text-sm"}>{author.name}</span>
                {editableUser && <Pencil1Icon width={12} height={12} />}
              </div>
            </div>
          )}
        </div>

        <div className={"flex flex-col select-none gap-2"}>
          {isEditingText ? (
            <Button size={"icon"} onClick={onSaveClick}>
              <SaveIcon width={18} height={18} />
            </Button>
          ) : (
            children
          )}
        </div>
      </motion.div>
    </PositioningBackdrop>
  );
};

interface TeamUserPickerProps {
  authorId: string;
  teamUsers: CardUser[];
  onUserPicked: (userId: string) => void;
}

const TeamUserPicker: React.FC<TeamUserPickerProps> = ({
  teamUsers,
  authorId,
  onUserPicked,
}) => {
  return (
    <>
      {teamUsers
        ?.filter((user) => user.id !== authorId)
        .map((user) => {
          return (
            <div
              key={user.id}
              className={
                "flex flex-row items-center gap-2 min-w-[99%] cursor-pointer rounded -order-1 p-0.5 hover:bg-[#D9D9D9]"
              }
              onClick={() => {
                onUserPicked(user.id);
              }}
            >
              <Avatar url={user.avatar} size={24} />

              <span className={"text-sm"}>{user.name}</span>
            </div>
          );
        })}
    </>
  );
};
