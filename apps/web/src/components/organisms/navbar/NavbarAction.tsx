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
        "flex flex-row items-center gap-2 bg-card h-11 -mt-2 p-2 pt-3 rounded-b-lg",
        className,
      )}
    >
      {children}
    </div>
  );
};
