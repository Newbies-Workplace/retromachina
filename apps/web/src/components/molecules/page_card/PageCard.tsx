import type React from "react";
import { cn } from "@/lib/utils";

export const PageCard: React.FC<React.ComponentProps<"section">> = ({
  className,
  ...props
}) => {
  return (
    <section
      className={cn(
        "pointer-events-auto h-fit w-full max-w-7xl overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm",
        className,
      )}
      {...props}
    />
  );
};

export const PageCardHeader: React.FC<React.ComponentProps<"div">> = ({
  className,
  ...props
}) => {
  return (
    <div
      className={cn("bg-primary p-4 pb-2 font-bold text-lg", className)}
      {...props}
    />
  );
};

export const PageCardContent: React.FC<React.ComponentProps<"div">> = ({
  className,
  ...props
}) => {
  return (
    <div
      className={cn("flex w-full flex-col gap-2 p-4 sm:p-6", className)}
      {...props}
    />
  );
};
