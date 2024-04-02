import {
  AnimatePresence,
  motion,
  useAnimate,
  useAnimation,
} from "framer-motion";
import React, { useEffect, useMemo } from "react";
import { UserResponse } from "shared/model/user/user.response";
import { Avatar } from "../../../../component/atoms/avatar/Avatar";
import { SlotMachineDrawnListener } from "../../../../context/retro/RetroContext";
import { useRetro } from "../../../../context/retro/RetroContext.hook";
import { useUser } from "../../../../context/user/UserContext.hook";

export const SLOT_MACHINE_ANIMATION_DURATION = 2200;
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

const getRandomUsers = (users: UserResponse[], amount: number) => {
  const randomUsers: UserResponse[] = [];

  if (users.length === 0) return [];

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
    drawMachine,
    highlightedUserId,
    slotMachineVisible,
    addDrawSlotMachineListener,
    removeDrawSlotMachineListener,
  } = useRetro();
  const { user } = useUser();

  // todo fix current user blink before animation
  const highlightedUser = useMemo(
    () => teamUsers.find((u) => u.id === highlightedUserId),
    [highlightedUserId, teamUsers],
  );

  const [leverRef, animate] = useAnimate();
  const controls = useAnimation();

  const animateSlotMachine = async (animateLever: boolean) => {
    if (animateLever) {
      await animate(".lever", { y: [0, 35, 50, 50, 0] }, { duration: 0.4 });
    }

    await controls.start("idle", { duration: 0 });
    await controls.start("drawing");
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

  useEffect(() => {
    if (
      slotMachineVisible &&
      highlightedUserId !== null &&
      teamUsers.length > 0
    ) {
      controls.start("drawing", { duration: 0 });
    }
  }, [teamUsers, slotMachineVisible]);

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
              className={"font-harlow-solid-italic text-background-50 text-3xl"}
            >
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
                {getRandomUsers(teamUsers, 8).map((user, index) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: users are randomized
                  <Avatar size={60} key={index} url={user.avatar_link} />
                ))}
                {highlightedUser !== undefined && (
                  <Avatar
                    size={60}
                    key={highlightedUser.id}
                    url={highlightedUser.avatar_link}
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
                {getRandomUsers(teamUsers, 5).map((user, index) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: users are randomized
                  <Avatar size={60} key={index} url={user.avatar_link} />
                ))}
                {highlightedUser !== undefined && (
                  <Avatar
                    size={60}
                    key={highlightedUser.id}
                    url={highlightedUser.avatar_link}
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
                {getRandomUsers(teamUsers, 2).map((user, index) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: users are randomized
                  <Avatar size={60} key={index} url={user.avatar_link} />
                ))}
                {highlightedUser !== undefined && (
                  <Avatar
                    size={60}
                    key={highlightedUser.id}
                    url={highlightedUser.avatar_link}
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
