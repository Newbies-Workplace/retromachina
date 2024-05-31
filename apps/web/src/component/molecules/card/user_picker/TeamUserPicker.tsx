import React from "react";
import { Avatar } from "../../../atoms/avatar/Avatar";
import { CardUser } from "../Card";

interface TeamUserPickerProps {
  authorId: string;
  teamUsers: CardUser[];
  onUserPicked: (userId: string) => void;
}

export const TeamUserPicker: React.FC<TeamUserPickerProps> = ({
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
