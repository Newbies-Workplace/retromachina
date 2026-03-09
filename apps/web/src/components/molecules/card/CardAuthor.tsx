import { computePosition, flip } from "@floating-ui/dom";
import { PencilIcon } from "lucide-react";
import React, { createRef, useCallback, useEffect } from "react";
import { TeamUserPicker } from "@/components/molecules/card/user_picker/TeamUserPicker";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import useClickOutside from "@/hooks/useClickOutside";
import { cn } from "@/lib/utils";
import { useCardContext } from "./CardContext";

export type CardUser = {
  avatar: string;
  name: string;
  id: string;
};

export interface CardAuthorProps {
  author?: CardUser | null;
  teamUsers?: CardUser[];
  editable?: boolean;
  onUserChange?: (userId: string | null) => void;
}

export const CardAuthor: React.FC<CardAuthorProps> = ({
  author,
  teamUsers = [],
  editable = false,
  onUserChange,
}) => {
  const { setIsUsersPickerOpen, isUsersPickerOpen } = useCardContext();

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
    setIsUsersPickerOpen(false);
  }, []);

  useClickOutside(userPickerRef, closeUserPickerPopover);

  const handleUserChange = (userId: string | null) => {
    onUserChange?.(userId);
    setIsUsersPickerOpen(false);
  };

  if (author === null) {
    return null;
  }

  return (
    <div className={"flex items-center pt-1"}>
      <div className={"relative"}>
        {isUsersPickerOpen && teamUsers.length > 1 && (
          <div
            ref={userPickerRef}
            className={cn("flex absolute w-[265px] max-h-45 -left-1.5")}
          >
            <TeamUserPicker
              teamUsers={teamUsers.filter((user) => user.id !== author?.id)}
              canPickUnassigned={author !== undefined}
              onUserPicked={handleUserChange}
            />
          </div>
        )}
      </div>

      <div
        ref={userPickerButtonRef}
        className={cn(
          "flex items-center gap-2 p-0.5 rounded-md",
          editable && "cursor-pointer hover:bg-accent/30",
        )}
        onClick={() => {
          if (editable) {
            setIsUsersPickerOpen(true);
          }
        }}
      >
        <Avatar size={"sm"}>
          <AvatarImage src={author?.avatar} />
          <AvatarFallback>:)</AvatarFallback>
        </Avatar>

        <span className={"text-sm"}>
          {author ? author.name : "Nieprzypisany"}
        </span>
        {editable && <PencilIcon className={"size-3"} />}
      </div>
    </div>
  );
};
