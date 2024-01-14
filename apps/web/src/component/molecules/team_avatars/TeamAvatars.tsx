import React from "react";
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
    return (
      <div className={styles.wrapper}>
        {users.map((user) => (
          <Avatar
            key={user.id}
            className={styles.avatar}
            variant={
              user.isActive ? (user.isReady ? "ready" : "active") : "inactive"
            }
            url={user.avatar_link}
          />
        ))}
      </div>
    );
  };
