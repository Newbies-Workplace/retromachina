import type React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type UserAvatarProps = Omit<React.ComponentProps<typeof Avatar>, "children"> & {
  avatarUrl?: string | null;
  name?: string | null;
  children?: React.ReactNode;
};

const getFallback = (name?: string | null) => {
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  const fallback =
    parts.length > 1
      ? parts
          .slice(0, 2)
          .map((part) => Array.from(part)[0])
          .join("")
      : Array.from(parts[0] ?? "")
          .slice(0, 2)
          .join("");

  return fallback.toLocaleUpperCase() || "?";
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  avatarUrl,
  name,
  children,
  ...avatarProps
}) => {
  return (
    <Avatar {...avatarProps}>
      <AvatarImage src={avatarUrl ?? undefined} />
      <AvatarFallback>{getFallback(name)}</AvatarFallback>
      {children}
    </Avatar>
  );
};
