import { cva, type VariantProps } from "class-variance-authority";
import { AnimatePresence, motion } from "motion/react";
import type React from "react";
import type { BaseHTMLAttributes } from "react";
import fallbackAvatar from "../../../assets/images/fallback_avatar.svg?url";
import { cn } from "../../../common/Util";

const avatarVariants = cva(
  "rounded-full border-2 border-white transition-all overflow-hidden",
  {
    variants: {
      variant: {
        inactive: "grayscale",
        active: "",
        ready: "border-primary-500",
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

export const Avatar: React.FC<AvatarProps> = ({
  className,
  style,
  variant = "active",
  size = 40,
  url,
}) => {
  return (
    <div style={style} className={className}>
      <img
        referrerPolicy="no-referrer"
        src={url ?? fallbackAvatar}
        style={{
          width: size,
          height: size,
          minWidth: size,
          minHeight: size,
        }}
        alt={"avatar"}
        className={cn(avatarVariants({ variant, className }))}
      />

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
                "absolute w-3 h-3 bg-primary-500 rounded-[50%] bottom-1 -translate-x-1/2 left-1/2"
              }
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
