import type React from "react";
import { Avatar } from "@/components/atoms/avatar/Avatar";
import { cn } from "@/lib/utils";

interface TeamAvatarsProps {
  className?: string;
  size?: number;
  users: {
    id: string;
    isActive: boolean;
    isReady: boolean;
    avatar_link: string;
  }[];
}

export const TeamAvatars: React.FC<
  React.PropsWithChildren<TeamAvatarsProps>
> = ({ className, users, size }) => {
  if (users.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex flex-row ml-2.5", className)}>
      {users.map((user) => (
        <Avatar
          style={{ marginLeft: -10 }}
          key={user.id}
          variant={
            user.isActive ? (user.isReady ? "ready" : "active") : "inactive"
          }
          url={user.avatar_link}
          size={size}
        />
      ))}
    </div>
  );
};
