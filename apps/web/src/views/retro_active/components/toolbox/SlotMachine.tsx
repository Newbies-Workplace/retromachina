import { AnimatePresence, motion, useAnimation } from "framer-motion";
import React, { useState } from "react";
import { UserResponse } from "shared/.dist/model/user/user.response";
import { Avatar } from "../../../../component/atoms/avatar/Avatar";
import { useRetro } from "../../../../context/retro/RetroContext.hook";

const rowAnimation = {
  drawing: {
    y: 0,
  },
  idle: {
    y: 832,
  },
};

const transition = {
  duration: 2,
};

const getRandomUsers = (users: UserResponse[], amount: number) => {
  const randomUsers: UserResponse[] = [];

  for (let i = 0; i < amount; i++) {
    const randomIndex = Math.floor(Math.random() * users.length);
    randomUsers.push(users[randomIndex]);
  }

  return randomUsers;
};

interface SlotMachineProps {
  isVisible: boolean;
}

export const SlotMachine: React.FC<SlotMachineProps> = ({ isVisible }) => {
  const controls = useAnimation();

  const { teamUsers } = useRetro();
  const [isDrawing, setIsDrawing] = useState(true);
  const [pickedUser, setPickedUser] = useState<UserResponse | null>(null);

  const draw = async () => {
    setPickedUser(getRandomUsers(teamUsers, 1)[0]);
    await controls.start(isDrawing ? "drawing" : "idle");
    setIsDrawing(!isDrawing);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
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
              "flex flex-col items-center gap-6 bg-secondary-500 p-4 rounded-xl shadow-lg w-96 h-48 z-[1]"
            }
          >
            <span className={"font-harlow-solid-italic text-white text-4xl"}>
              Losowanko
            </span>

            <div
              className={
                "flex justify-evenly items-end gap-4 w-full bg-background-50 h-24 rounded-xl overflow-hidden"
              }
            >
              <motion.div
                animate={controls}
                variants={rowAnimation}
                initial={"idle"}
                className={"flex flex-col gap-12 mb-7"}
                transition={transition}
              >
                {getRandomUsers(teamUsers, 8).map((user, index) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: users are randomized
                  <Avatar key={index} url={user.avatar_link} />
                ))}
                {pickedUser && <Avatar url={pickedUser.avatar_link} />}
              </motion.div>

              <motion.div
                animate={controls}
                variants={rowAnimation}
                initial={"idle"}
                className={"flex flex-col gap-12 mb-7"}
                transition={transition}
              >
                {getRandomUsers(teamUsers, 5).map((user, index) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: users are randomized
                  <Avatar key={index} url={user.avatar_link} />
                ))}
                {pickedUser && <Avatar url={pickedUser.avatar_link} />}
              </motion.div>

              <motion.div
                animate={controls}
                variants={rowAnimation}
                initial={"idle"}
                className={"flex flex-col gap-12 mb-7"}
                transition={transition}
              >
                {getRandomUsers(teamUsers, 2).map((user, index) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: users are randomized
                  <Avatar key={index} url={user.avatar_link} />
                ))}
                {pickedUser && <Avatar url={pickedUser.avatar_link} />}
              </motion.div>
            </div>
          </div>

          <div className={"flex flex-col -ml-2"}>
            <motion.div
              drag={"y"}
              dragConstraints={{ left: 0, right: 0, top: 0, bottom: 50 }}
              dragSnapToOrigin={true}
              dragElastic={{ left: 0, right: 0, bottom: 0.01 }}
              onDragEnd={(e, a) => {
                if (a.offset.y < 30) return;

                draw();
              }}
              className={
                "relative flex flex-col justify-end items-center ml-6 rounded-full"
              }
              onClick={() => {}}
            >
              <div
                className={
                  "bg-red-500 size-16 rounded-full z-[2] cursor-grab active:cursor-grabbing"
                }
              />
              <div className={"absolute -bottom-4 bg-gray-600 w-4 h-8 z-[1]"} />
            </motion.div>
            <div className={"bg-gray-500 w-4 h-20 ml-12"} />
            <div className={"bg-gray-500 w-16 h-4 rounded-br"} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
