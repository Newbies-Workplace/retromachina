import type React from "react";
import { Avatar } from "../../atoms/avatar/Avatar";
import styles from "./TeamAvatars.module.scss";

interface TeamAvatarsProps {
  users: {
    id: string;
    isActive: boolean;
    isReady: boolean;
    avatar_link: string;
  }[];
}

export const TeamAvatars: React.FC<React.PropsWithChildren<TeamAvatarsProps>> =
  ({ users }) => {
    if (users.length === 0) {
      return null;
    }

    return (
      <div className={"flex flex-row-reverse ml-2.5"}>
        {users.map((user) => (
          <Avatar
            style={{ marginLeft: -10 }}
            key={user.id}
            variant={
              user.isActive ? (user.isReady ? "ready" : "active") : "inactive"
            }
            url={user.avatar_link}
          />
        ))}
      </div>
    );
  };
