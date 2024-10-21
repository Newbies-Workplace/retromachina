import dayjs from "dayjs";
import React, { useEffect, useState } from "react";
import { cn } from "../../../common/Util";

interface TimerProps {
  onClick?: () => void;
  onTimerEnd?: () => void;
  timerEnds: number | null;
}

type TimerVariant = "default" | "expires" | "end";

export const Timer: React.FC<TimerProps> = ({
  onClick,
  onTimerEnd,
  timerEnds,
}) => {
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  let variant: TimerVariant = "default";

  let timeText = timerEnds
    ? dayjs.duration(secondsLeft, "s").format("m:ss")
    : "--:--";

  if (timerEnds === null) {
    variant = "default";
    timeText = "--:--";
  } else if (secondsLeft <= 0) {
    variant = "end";
    timeText = "0:00";
  } else if (secondsLeft <= 10) {
    variant = "expires";
  }

  useEffect(() => {
    const setTimer = () => {
      if (timerEnds !== null) {
        const secondsLeft = Math.floor((timerEnds - dayjs().valueOf()) / 1000);

        if (secondsLeft === 0) {
          onTimerEnd?.();
        }

        setSecondsLeft(secondsLeft);
      }
    };

    setTimer();
    const counter = setInterval(() => {
      setTimer();
    }, 1000);

    return () => {
      clearInterval(counter);
    };
  }, [timerEnds, onTimerEnd]);

  return (
    <div
      className={cn(
        "flex items-center justify-center h-9 w-[100px] rounded-lg border-2 border-black bg-white text-xl font-bold select-none",
        variant === "expires" &&
          "text-red-500 border-red-500 animate-timer-blink",
        variant === "end" &&
          "bg-red-500 text-background-50 border-background-50",
        onClick && "cursor-pointer hover:opacity-70",
      )}
      onClick={onClick}
    >
      {timeText}
    </div>
  );
};
