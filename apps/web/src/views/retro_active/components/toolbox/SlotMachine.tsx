import {
  AnimatePresence,
  delay,
  motion,
  useAnimate,
  useAnimation,
} from "framer-motion";
import React, { useEffect, useMemo, useRef, useState } from "react";
import ConfettiExplosion from "react-confetti-explosion";
import { User } from "shared/model/retro/retroRoom.interface";
import slotMachineOpenSound from "../../../../assets/sounds/slot-machine-open.wav";
import slotMachineSound from "../../../../assets/sounds/slot-machine.wav";
import { Avatar } from "../../../../component/atoms/avatar/Avatar";
import { SlotMachineDrawnListener } from "../../../../context/retro/RetroContext";
import { useRetro } from "../../../../context/retro/RetroContext.hook";
import { useAudio } from "../../../../context/useAudio";
import { useDebounce } from "../../../../context/useDebounce";
import { useUser } from "../../../../context/user/UserContext.hook";

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

const getRandomUsers = (users: User[], amount: number) => {
  const randomUsers: User[] = [];

  if (users.length <= 1) return [];

  for (let i = 0; i < amount; i++) {
    const randomIndex = Math.floor(Math.random() * users.length);
    randomUsers.push(users[randomIndex]);
  }

  return randomUsers;
};

export const SlotMachine: React.FC = () => {
  const {
    roomState,
    teamUsers,
    activeUsers,
    drawMachine,
    highlightedUserId,
    slotMachineVisible,
    addDrawSlotMachineListener,
    removeDrawSlotMachineListener,
  } = useRetro();
  const { user } = useUser();
  const { play: playAudio } = useAudio();

  const highlightedUser = useMemo(
    () => teamUsers.find((u) => u.id === highlightedUserId),
    [highlightedUserId, teamUsers],
  );
  const delayedHighlightedUser = useDebounce(highlightedUser, 1000);
  const randomUsers: User[][] = useMemo(
    () => [
      getRandomUsers(activeUsers, 8),
      getRandomUsers(activeUsers, 5),
      getRandomUsers(activeUsers, 2),
    ],
    [activeUsers],
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

  useEffect(() => {
    const listener: SlotMachineDrawnListener = async (event) => {
      await animateSlotMachine(event.actorId !== user?.id);
    };

    addDrawSlotMachineListener(listener);

    return () => {
      removeDrawSlotMachineListener(listener);
    };
  }, []);

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

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (roomState === "group" && slotMachineVisible) {
      playAudio(slotMachineOpenSound);
    }
  }, [roomState, slotMachineVisible]);

  return (
    <AnimatePresence>
      {roomState === "group" && slotMachineVisible && (
        <motion.div
          ref={leverRef}
          initial={{ opacity: 0, bottom: 0 }}
          animate={{ opacity: 1, bottom: 92 }}
          exit={{ opacity: 0, bottom: 0 }}
          transition={{ duration: 0.2 }}
          className={
            "absolute flex flex-row items-center bottom-16 m-auto left-0 right-0 w-96"
          }
        >
          <div
            className={
              "flex flex-col items-center gap-6 bg-secondary-500 p-2 rounded-xl rounded-t-[48px] shadow-lg w-full z-[1]"
            }
          >
            <span
              className={
                "flex flex-col justify-center items-center font-harlow-solid-italic text-background-50 text-3xl"
              }
            >
              {hasConfetti && (
                <ConfettiExplosion className={"my-auto"} zIndex={1} />
              )}
              Losowanko
            </span>

            <div
              className={
                "flex justify-evenly items-end gap-2 w-full bg-background-50 h-20 rounded-xl overflow-hidden"
              }
            >
              <motion.div
                animate={controls}
                variants={rowAnimation}
                initial={"idle"}
                className={"flex flex-col gap-12 mb-2.5"}
                transition={transition}
              >
                {randomUsers[0].map((user, index) => (
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

              <motion.div
                animate={controls}
                variants={rowAnimation}
                initial={"idle"}
                className={"flex flex-col gap-12 mb-2.5"}
                transition={transition}
              >
                {randomUsers[1].map((user, index) => (
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

              <motion.div
                animate={controls}
                variants={rowAnimation}
                initial={"idle"}
                className={"flex flex-col gap-12 mb-2.5"}
                transition={transition}
              >
                {randomUsers[2].map((user, index) => (
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

                drawMachine();
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
