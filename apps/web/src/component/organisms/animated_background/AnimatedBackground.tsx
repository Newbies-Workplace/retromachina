import { ClipboardCheckIcon, SaveIcon, TrendingUpIcon } from "lucide-react";
import { motion } from "motion/react";
import React, { useEffect, useState } from "react";
import { cn, debounced, randomInteger } from "@/common/Util";

interface AnimatedBackgroundProps {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

const iconSize = 128 + 16;

export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({
  children,
  className,
  contentClassName,
}) => {
  const [columns, setColumns] = useState(0);
  const [rows, setRows] = useState(0);

  //rerender on resize
  useEffect(() => {
    const resizeHandler = () => {
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;

      const columns = Math.ceil(screenWidth / iconSize);
      const rows = Math.ceil(screenHeight / iconSize);

      setColumns(columns);
      setRows(rows);
    };

    const debouncedResizeHandler = debounced(resizeHandler, 50);

    resizeHandler();
    window.addEventListener("resize", debouncedResizeHandler);
    return () => {
      window.removeEventListener("resize", debouncedResizeHandler);
    };
  }, []);

  return (
    <div
      className={cn("relative flex justify-center grow scrollbar", className)}
    >
      <div className={cn("absolute z-10", contentClassName)}>{children}</div>

      <div
        className={
          "fixed w-full h-full flex overflow-hidden justify-center items-center bg-background-50"
        }
      >
        {Array.from({ length: columns }).map((_, i) => {
          return (
            <div
              className={"flex flex-col items-center justify-center"}
              key={`row-${
                // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                i
              }`}
            >
              {Array.from({ length: rows }).map((_, j) => {
                return (
                  <AnimatedIcon
                    key={`row-${i}-col-${
                      // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                      j
                    }`}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const AnimatedIcon: React.FC = () => {
  const [icon, setIcon] = useState(Math.floor(Math.random() * 3));
  const [animationState, setAnimationState] = useState("visible");
  const iconVariants = {
    visible: { opacity: 1, scale: 1 },
    hidden: { opacity: 0, scale: 0.5 },
  };

  const animate = async () => {
    if (animationState === "hidden") return;

    setAnimationState("hidden");
    await new Promise((resolve) => setTimeout(resolve, 300));
    setIcon((icon) => (icon + 1) % 3);
    await new Promise((resolve) => setTimeout(resolve, 300));
    setAnimationState("visible");
  };

  useEffect(() => {
    const min = 15_000;
    const max = 20_000;
    const delay = randomInteger(min, max);

    let interval: NodeJS.Timeout;

    new Promise((resolve) => setTimeout(resolve, randomInteger(0, delay))).then(
      async () => {
        await animate();

        interval = setInterval(async () => {
          await animate();
        }, delay);
      },
    );

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      animate={animationState}
      variants={iconVariants}
      onMouseMoveCapture={animate}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex justify-center items-center size-32 bg-background-500/30 rounded m-2",
      )}
    >
      {icon === 0 && (
        <ClipboardCheckIcon className={"text-secondary-500/60 size-8"} />
      )}
      {icon === 1 && <SaveIcon className={"text-secondary-500/60 size-8"} />}
      {icon === 2 && (
        <TrendingUpIcon className={"text-secondary-500/60 size-8"} />
      )}
    </motion.div>
  );
};
