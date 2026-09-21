import { AnimatePresence, domAnimation, LazyMotion, m } from "motion/react";
import type React from "react";
import type { ActivePokerUser } from "shared/model/poker/poker.events";
import { UserAvatar } from "@/components/molecules/user_avatar/UserAvatar";
import { AvatarStatus } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type PokerPlayerProps = {
  user: ActivePokerUser;
  cardsRevealed: boolean;
  cardSide?: "left" | "right";
  className?: string;
  style?: React.CSSProperties;
};

export const PokerPlayer: React.FC<PokerPlayerProps> = ({
  user,
  cardsRevealed,
  cardSide = "right",
  className,
  style,
}) => {
  const revealedCardRotation = getCardRotation(user.userId, cardSide);

  return (
    <div className={className} style={style} data-testid="poker-player">
      <Tooltip>
        <TooltipTrigger
          render={
            <UserAvatar
              size="lg"
              className="relative z-10 shadow-md"
              avatarUrl={user.avatarLink}
              name={user.nick}
            >
              {user.selectedCard !== null && <AvatarStatus />}
            </UserAvatar>
          }
        />
        <TooltipContent>{user.nick}</TooltipContent>
      </Tooltip>
      <LazyMotion features={domAnimation}>
        <AnimatePresence>
          {cardsRevealed && user.revealedCard !== null && (
            <m.div
              key={`${user.userId}-${user.revealedCard}`}
              data-testid="poker-player-revealed-card"
              className={cn(
                "-top-5 absolute flex aspect-[2/3] w-8 items-center justify-center rounded-lg border-2 border-border bg-card font-semibold text-card-foreground shadow-md",
                cardSide === "left"
                  ? "-left-6 origin-bottom-right"
                  : "-right-6 origin-bottom-left",
              )}
              initial={{ opacity: 0, x: -24, y: 24, scale: 0.25, rotate: -18 }}
              animate={{
                opacity: 1,
                x: 0,
                y: 0,
                scale: 1,
                rotate: revealedCardRotation,
              }}
              exit={{
                opacity: 0,
                x: 8,
                y: 56,
                scale: 0.72,
              }}
              transition={{
                duration: 0.16,
                ease: [0.2, 0.8, 0.2, 1],
              }}
            >
              {user.revealedCard}
            </m.div>
          )}
        </AnimatePresence>
      </LazyMotion>
    </div>
  );
};

const getCardRotation = (value: string, side: "left" | "right") => {
  const hash = value.split("").reduce((result, char) => {
    return result + char.charCodeAt(0);
  }, 0);
  const rotation = 5 + (hash % 6);

  return side === "left" ? -rotation : rotation;
};
