import { AnimatePresence, motion } from "framer-motion";
import type React from "react";
import { toast } from "react-toastify";
import { Avatar } from "../../../../component/atoms/avatar/Avatar";

interface DrawingMachineProps {
  isVisible: boolean;
}

export const DrawingMachine: React.FC<DrawingMachineProps> = ({
  isVisible,
}) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, bottom: 0 }}
          animate={{ opacity: 1, bottom: 92 }}
          exit={{ opacity: 0, bottom: 0 }}
          transition={{ duration: 0.2 }}
          className={
            "absolute flex flex-row bottom-16 m-auto left-0 right-0 w-96"
          }
        >
          <div
            className={
              "flex flex-col items-center gap-2 bg-secondary-500 p-4 rounded-xl shadow-lg w-96 h-48 z-[1]"
            }
          >
            <span className={"font-harlow-solid-italic text-white text-4xl"}>
              Losowanko
            </span>

            <div
              className={
                "flex justify-around items-center gap-4 w-full bg-background-50 h-24 rounded-xl overflow-hidden"
              }
            >
              <div
                className={
                  "flex flex-col gap-12 hover:translate-y-12 transition"
                }
              >
                <Avatar url={"https://i.pravatar.cc/300"} />
                <Avatar url={"https://i.pravatar.cc/300"} />
                <Avatar url={"https://i.pravatar.cc/300"} />
              </div>
              <div
                className={
                  "flex flex-col gap-12 hover:translate-y-12 transition"
                }
              >
                <Avatar url={"https://i.pravatar.cc/300"} />
                <Avatar url={"https://i.pravatar.cc/300"} />
                <Avatar url={"https://i.pravatar.cc/300"} />
              </div>
              <div
                className={
                  "flex flex-col gap-12 hover:translate-y-12 transition"
                }
              >
                <Avatar url={"https://i.pravatar.cc/300"} />
                <Avatar url={"https://i.pravatar.cc/300"} />
                <Avatar url={"https://i.pravatar.cc/300"} />
              </div>
            </div>
          </div>

          <div className={"flex flex-col -ml-2"}>
            <motion.div
              drag
              dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
              dragElastic={{ left: 0, right: 0, bottom: 0.25 }}
              onDragEnd={(e, a) => {
                if (a.offset.y < 100) return;

                toast.success("losu losu");
              }}
              className={"bg-red-500 size-16 rounded-full -mb-2 ml-6 z-[1]"}
              onClick={() => {}}
            />
            <div className={"bg-gray-500 w-4 h-24 ml-12"} />
            <div className={"bg-gray-500 w-16 h-4 rounded-br"} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
