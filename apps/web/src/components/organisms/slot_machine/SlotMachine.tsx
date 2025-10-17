import { XIcon } from "lucide-react";
import {
  AnimatePresence,
  delay,
  motion,
  useAnimate,
  useAnimation,
} from "motion/react";
import React, {
  RefObject,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import ConfettiExplosion from "react-confetti-explosion";
import slotMachineSound from "@/assets/sounds/slot-machine.wav";
import slotMachineOpenSound from "@/assets/sounds/slot-machine-open.wav";
import { Avatar } from "@/components/atoms/avatar/Avatar";
import { Button } from "@/components/atoms/button/Button";
import { useAudio } from "@/hooks/useAudio";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";

export const SLOT_MACHINE_ANIMATION_DURATION = 2400;
const rowAnimation = {
  drawing: {
    y: 0,
  },
  idle: {
    y: 1000,
  },
};
const transition = {
  duration: 2,
};

const getRandomUsers = (users: SlotUser[], amount: number) => {
  const randomUsers: SlotUser[] = [];

  if (users.length <= 1) return [];

  for (let i = 0; i < amount; i++) {
    const randomIndex = Math.floor(Math.random() * users.length);
    randomUsers.push(users[randomIndex]);
  }

  return randomUsers;
};

export type SlotMachineRef = {
  animateSlotMachine: (animateLever: boolean) => Promise<void>;
};

type SlotUser = {
  id: string;
  avatar_link?: string;
};

export type SlotMachineProps = {
  ref?: RefObject<SlotMachineRef | null>;

  className?: string;
  visible?: boolean;

  hideMachineEnabled?: boolean;
  onHideMachine?: () => void;

  onMachineDrawn: () => void;

  highlightedUserId?: string | null;
  userPool: SlotUser[];
};

export const SlotMachine: React.FC<SlotMachineProps> = ({
  ref,

  className,
  visible: slotMachineVisible = true,
  hideMachineEnabled = false,
  onHideMachine,

  onMachineDrawn,

  highlightedUserId = null,
  userPool: teamUsers,
}) => {
  const { play: playAudio } = useAudio();

  const highlightedUser = useMemo(
    () => teamUsers.find((u) => u.id === highlightedUserId),
    [highlightedUserId, teamUsers],
  );
  const delayedHighlightedUser = useDebounce(highlightedUser, 1000);
  const randomUsers: SlotUser[][] = useMemo(
    () => [
      getRandomUsers(teamUsers, 8),
      getRandomUsers(teamUsers, 5),
      getRandomUsers(teamUsers, 2),
    ],
    [teamUsers],
  );
  const [hasConfetti, setHasConfetti] = useState(false);
  const [leverRef, animate] = useAnimate();
  const controls = useAnimation();

  const animateSlotMachine = async (animateLever: boolean) => {
    if (animateLever) {
      await animate(".lever", { y: [0, 35, 50, 50, 0] }, { duration: 0.4 });
    }

    await controls.start("idle", { duration: 0.1 });
    playAudio(slotMachineSound);
    await controls.start("drawing");

    setHasConfetti(true);
    delay(() => {
      setHasConfetti(false);
    }, 1500);
  };

  useImperativeHandle(
    ref,
    () => ({
      animateSlotMachine: async (animateLever: boolean) => {
        await animateSlotMachine(animateLever);
      },
    }),
    [],
  );

  // Initial draw
  useEffect(() => {
    if (
      slotMachineVisible &&
      highlightedUserId !== null &&
      teamUsers.length > 0
    ) {
      controls.start("drawing", { duration: 0 });
    }
  }, [teamUsers, slotMachineVisible]);

  // Play open sound only on visibility change, not on first render
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (slotMachineVisible) {
      playAudio(slotMachineOpenSound);
    }
  }, [slotMachineVisible]);

  return (
    <AnimatePresence>
      {slotMachineVisible && (
        <motion.div
          ref={leverRef}
          initial={{ opacity: 0, bottom: 0 }}
          animate={{ opacity: 1, bottom: 110 }}
          exit={{ opacity: 0, bottom: 0 }}
          transition={{ duration: 0.2 }}
          className={cn("flex flex-row items-center bottom-16", className)}
        >
          <div
            className={
              "flex flex-col items-center gap-6 bg-secondary-500 p-2 rounded-xl rounded-t-[48px] shadow-lg w-full z-[1]"
            }
          >
            {hideMachineEnabled && (
              <Button
                size={"icon"}
                className={"absolute top-4 left-4"}
                variant={"destructive"}
                onClick={() => {
                  onHideMachine?.();
                }}
              >
                <XIcon className={"size-4"} />
              </Button>
            )}
            <span
              className={
                "flex flex-col justify-center items-center font-harlow-solid-italic text-background-50 text-3xl"
              }
            >
              {hasConfetti && (
                <ConfettiExplosion className={"my-auto"} zIndex={100} />
              )}
              Losowanko
            </span>

            <div
              className={
                "flex justify-evenly items-end gap-2 w-full bg-background-50 h-20 rounded-xl overflow-hidden"
              }
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={controls}
                  variants={rowAnimation}
                  initial={"idle"}
                  className={"flex flex-col gap-12 mb-2.5"}
                  transition={transition}
                >
                  {randomUsers[i].map((user, index) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: users are randomized
                    <Avatar size={60} key={index} url={user.avatar_link} />
                  ))}
                  {delayedHighlightedUser !== undefined && (
                    <Avatar
                      size={60}
                      key={delayedHighlightedUser.id}
                      url={delayedHighlightedUser.avatar_link}
                    />
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          <div className={"flex flex-col -ml-2"}>
            <motion.div
              drag={"y"}
              dragConstraints={{ left: 0, right: 0, top: 0, bottom: 50 }}
              dragSnapToOrigin={true}
              dragElastic={{ left: 0, right: 0, bottom: 0.01 }}
              onDragEnd={(_, info) => {
                if (info.offset.y < 30) return;

                onMachineDrawn();
              }}
              className={
                "lever relative flex flex-col justify-end items-center ml-6 rounded-full"
              }
            >
              <div
                className={
                  "bg-red-500 size-16 rounded-full z-[2] cursor-grab active:cursor-grabbing"
                }
              />
              <div className={"absolute -bottom-4 bg-gray-600 w-4 h-8 z-[1]"} />
            </motion.div>
            <div className={"bg-gray-500 w-4 h-16 ml-12"} />
            <div className={"bg-gray-500 w-16 h-4 rounded-br"} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
