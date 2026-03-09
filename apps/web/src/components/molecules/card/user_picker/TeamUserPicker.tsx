import React from "react";
import { CardUser } from "@/components/molecules/card/Card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface TeamUserPickerProps {
  teamUsers: CardUser[];
  onUserPicked: (userId: string | null) => void;
  canPickUnassigned?: boolean;
}

export const TeamUserPicker: React.FC<TeamUserPickerProps> = ({
  teamUsers,
  onUserPicked,
  canPickUnassigned,
}) => {
  return (
    <div
      className={
        "flex flex-col items-start gap-2 min-w-[250px] max-h-48 overflow-y-scroll scrollbar bg-background p-1 my-3 rounded-lg shadow-[0px_4px_4px_rgba(0,0,0,0.25)]"
      }
    >
      {canPickUnassigned && (
        <div
          className={
            "flex flex-row items-center gap-2 w-full cursor-pointer rounded -order-1 p-0.5 hover:bg-accent/30"
          }
          onClick={() => {
            onUserPicked(null);
          }}
        >
          <Avatar size={"sm"}>
            <AvatarFallback>:)</AvatarFallback>
          </Avatar>
          <span className={"text-sm"}>Nieprzypisany</span>
        </div>
      )}

      {teamUsers.map((user) => {
        return (
          <div
            key={user.id}
            className={
              "flex flex-row items-center gap-2 w-full cursor-pointer rounded -order-1 p-0.5 hover:bg-accent/30"
            }
            onClick={() => {
              onUserPicked(user.id);
            }}
          >
            <Avatar size={"sm"}>
              <AvatarImage src={user.avatar} />
              <AvatarFallback>:)</AvatarFallback>
            </Avatar>

            <span className={"text-sm"}>{user.name}</span>
          </div>
        );
      })}
    </div>
  );
};
