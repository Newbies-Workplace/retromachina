import React from "react";
import { cn } from "@/lib/utils";

type NavbarActionProps = {
  children: React.ReactNode;
  className?: string;
};

export const NavbarAction: React.FC<NavbarActionProps> = ({
  children,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex h-11 flex-row items-center gap-2 rounded-b-lg bg-card p-2",
        className,
      )}
    >
      {children}
    </div>
  );
};
