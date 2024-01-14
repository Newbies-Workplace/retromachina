import dayjs from "dayjs";
import React, { useCallback, useRef, useState } from "react";
import DeleteIconSvg from "../../../../assets/icons/delete-icon.svg";
import HourglassIconSvg from "../../../../assets/icons/hourglass.svg";
import TickIconSvg from "../../../../assets/icons/tick.svg";
import { Button } from "../../../../component/atoms/button/Button";
import { Timer } from "../../../../component/molecules/timer/Timer";
import { useRetro } from "../../../../context/retro/RetroContext.hook";
import useClickOutside from "../../../../context/useClickOutside";
import { useTeamRole } from "../../../../context/useTeamRole";
import styles from "./RetroTimer.module.scss";

export const RetroTimer: React.FC = () => {
  const [isTimerDialogOpen, setDialogTimerOpen] = useState(false);

  const timePopover = useRef<any>();
  const closeTimer = useCallback(() => setDialogTimerOpen(false), []);
  useClickOutside(timePopover, closeTimer);

  const { timerEnds, teamId, setTimer } = useRetro();
  const { isAdmin } = useTeamRole(teamId!);

  const [time, setTime] = useState(300);
  const timeText = dayjs(0).add(time, "s").format("m:ss");

  const onQuickAddTime = () => {
    const currentOrEndTime = timerEnds ? dayjs(timerEnds) : dayjs();

    const targetTime = (
      currentOrEndTime.isBefore(dayjs()) ? dayjs() : currentOrEndTime
    )
      .add(31, "s")
      .valueOf();

    setTimer(targetTime);
  };

  const onClearTimer = () => {
    setTimer(null);
    closeTimer();
    setTime(300);
  };

  const onZeroTimer = () => {
    setTime(0);
  };

  const onIncreaseTimer = (seconds: number) => {
    setTime((old) => old + seconds);
  };

  const onStartTimer = () => {
    const targetTime = dayjs()
      .add(time, "s")
      .add(1, "s") // client <-> server pseudo delay
      .valueOf();

    setTimer(targetTime);
    closeTimer();
    setTime(300);
  };

  return (
    <div className={styles.timer}>
      {isAdmin && (
        <Button
          className={styles.quickAdd}
          onClick={onQuickAddTime}
          size={"round"}
        >
          +30
        </Button>
      )}

      <Timer timerEnds={timerEnds} />

      {isAdmin && (
        <Button
          className={styles.quickAdd}
          onClick={() => setDialogTimerOpen(true)}
          size={"round"}
        >
          <HourglassIconSvg />
        </Button>
      )}

      {isTimerDialogOpen && (
        <div className={styles.timeBubbleWrapper} ref={timePopover}>
          <div className={styles.timerTop}>
            <Button
              size="small"
              className={styles.clearButton}
              onClick={onClearTimer}
            >
              <DeleteIconSvg width={24} height={24} />
            </Button>

            <div className={styles.timerText}>{timeText}</div>

            <Button size="small" onClick={() => onStartTimer()}>
              <TickIconSvg width={24} height={24} />
            </Button>
          </div>

          <div className={styles.buttonWrapper}>
            <Button size="small" onClick={() => onZeroTimer()}>
              00
            </Button>
            <Button size="small" onClick={() => onIncreaseTimer(30)}>
              +30s
            </Button>
            <Button size="small" onClick={() => onIncreaseTimer(60)}>
              +1m
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
