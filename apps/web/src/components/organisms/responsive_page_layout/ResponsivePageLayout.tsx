import type React from "react";
import { AnimatedBackground } from "@/components/organisms/animated_background/AnimatedBackground";
import { cn } from "@/lib/utils";

type ResponsivePageLayoutProps = React.PropsWithChildren<{
  className?: string;
  contentClassName?: string;
}>;

export const ResponsivePageLayout: React.FC<ResponsivePageLayoutProps> = ({
  children,
  className,
  contentClassName,
}) => {
  return (
    <AnimatedBackground
      contentClassName={cn(
        "pointer-events-none inset-0 flex w-full justify-center overflow-auto p-3 sm:p-6",
        contentClassName,
      )}
    >
      <div className={cn("flex h-fit w-full justify-center", className)}>
        {children}
      </div>
    </AnimatedBackground>
  );
};
