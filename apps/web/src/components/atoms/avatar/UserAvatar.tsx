import { cva, type VariantProps } from "class-variance-authority";
import { AnimatePresence, motion } from "motion/react";
import type React from "react";
import type { BaseHTMLAttributes } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const avatarVariants = cva(
  "rounded-full border-2 border-white transition-all overflow-hidden",
  {
    variants: {
      variant: {
        inactive: "grayscale",
        active: "",
        ready: "border-primary",
      },
    },
  },
);

export interface AvatarProps
  extends BaseHTMLAttributes<HTMLDivElement>,
    VariantProps<typeof avatarVariants> {
  size?: number;
  url?: string;
}

export const UserAvatar: React.FC<AvatarProps> = ({
  className,
  style,
  variant = "active",
  size = 40,
  url,
}) => {
  return (
    <div style={style} className={className}>
      <Avatar>
        <AvatarImage src={url} />
        <AvatarFallback>??</AvatarFallback>
      </Avatar>

      <AnimatePresence>
        {variant === "ready" && (
          <motion.div layout className={"relative"}>
            <motion.div
              initial={{ opacity: 0, bottom: 0 }}
              animate={{
                opacity: 1,
                bottom: 4,
              }}
              exit={{
                opacity: 0,
                bottom: 0,
              }}
              transition={{
                duration: 0.25,
                type: "spring",
              }}
              className={
                "absolute w-3 h-3 bg-primary rounded-full bottom-1 -translate-x-1/2 left-1/2"
              }
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
