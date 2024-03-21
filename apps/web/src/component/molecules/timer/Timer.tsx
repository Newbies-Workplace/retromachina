import cs from "classnames";
import dayjs from "dayjs";
import type React from "react";
import { useEffect, useState } from "react";
import styles from "./Timer.module.scss";

interface PropsTimer {
  timerEnds: number | null;
}

type TimerVariant = "default" | "expires" | "end";

export const Timer: React.FC<PropsTimer> = ({ timerEnds }) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  let variant: TimerVariant = "default";
  let timeText = timerEnds
    ? dayjs.duration(timeLeft, "s").format("m:ss")
    : "--:--";

  if (timerEnds === null) {
    variant = "default";
    timeText = "--:--";
  } else if (timeLeft <= 0) {
    variant = "end";
    timeText = "0:00";
  } else if (timeLeft <= 30) {
    variant = "expires";
  }

  useEffect(() => {
    const setTimer = () => {
      if (timerEnds !== null) {
        setTimeLeft((timerEnds - dayjs().valueOf()) / 1000);
      }
    };

    setTimer();
    const counter = setInterval(() => {
      setTimer();
    }, 1000);

    return () => {
      clearInterval(counter);
    };
  }, [timerEnds]);

  return <div className={cs(styles.timer, styles[variant])}>{timeText}</div>;
};
