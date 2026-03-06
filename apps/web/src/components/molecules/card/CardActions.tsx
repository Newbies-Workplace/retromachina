import React from "react";

export interface CardActionsProps {
  children: React.ReactNode;
}

export const CardActions: React.FC<CardActionsProps> = ({ children }) => {
  return (
    <div className={"flex flex-col select-none gap-2 h-full"}>{children}</div>
  );
};
