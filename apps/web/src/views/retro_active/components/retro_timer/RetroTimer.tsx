import dayjs from "dayjs";
import { CheckIcon, XIcon } from "lucide-react";
import React, { createRef, useCallback, useEffect, useState } from "react";
import timerEndSound from "@/assets/sounds/timer-end.wav";
import { Button } from "@/components/atoms/button/Button";
import { Timer } from "@/components/molecules/timer/Timer";
import { useRetro } from "@/context/retro/RetroContext.hook";
import { useAudio } from "@/hooks/useAudio";
import useClickOutside from "@/hooks/useClickOutside";
import { useTeamRole } from "@/hooks/useTeamRole";

const SERVER_TIMER_DELAY_SECONDS = 1;

export const RetroTimer: React.FC = () => {
  const [isTimerDialogOpen, setDialogTimerOpen] = useState(false);

  const closeTimer = useCallback(() => setDialogTimerOpen(false), []);

  const { timerEnds, teamId, setTimer } = useRetro();
  const { isAdmin } = useTeamRole(teamId!);
  const { play: playAudio } = useAudio();

  const onQuickAddTime = () => {
    const currentOrEndTime = timerEnds ? dayjs(timerEnds) : dayjs();

    const targetTime = (
      currentOrEndTime.isBefore(dayjs()) ? dayjs() : currentOrEndTime
    )
      .add(30, "s")
      .add(SERVER_TIMER_DELAY_SECONDS, "s")
      .valueOf();

    setTimer(targetTime);
  };

  const onSetTimer = (time: number | null) => {
    if (time !== null) {
      setTimer(
        dayjs().add(time, "s").add(SERVER_TIMER_DELAY_SECONDS, "s").valueOf(),
      );
    } else {
      setTimer(null);
    }
    closeTimer();
  };

  const onTimerEnd = useCallback(() => {
    playAudio(timerEndSound)
      .then(() => new Promise((resolve) => setTimeout(resolve, 150)))
      .then(() => playAudio(timerEndSound))
      .then(() => new Promise((resolve) => setTimeout(resolve, 150)))
      .then(() => playAudio(timerEndSound));
  }, [playAudio]);

  return (
    <div
      className={
        "flex flex-row items-center gap-2 bg-background-500 h-11 -mt-2 pt-3 pb-2 px-2 rounded-b-lg"
      }
    >
      <div className={"flex flex-row gap-2"}>
        {isAdmin && (
          <Button onClick={onQuickAddTime} size={"icon"}>
            +30
          </Button>
        )}

        <Timer
          timerEnds={timerEnds}
          onClick={isAdmin ? () => setDialogTimerOpen(true) : undefined}
          onTimerEnd={onTimerEnd}
        />

        {isAdmin && (
          <Button
            onClick={() => {
              onSetTimer(null);
            }}
            size={"icon"}
            variant={"destructive"}
          >
            <XIcon className={"size-4"} />
          </Button>
        )}
      </div>

      {isTimerDialogOpen && (
        <TimerSetModal onDismiss={closeTimer} onTimeSet={onSetTimer} />
      )}
    </div>
  );
};

type TimerInputType = "min" | "sec";

const TimerSetModal: React.FC<{
  onDismiss: () => void;
  onTimeSet: (time: number | null) => void;
}> = ({ onDismiss, onTimeSet }) => {
  const minInputRef = createRef<HTMLInputElement>();
  const secInputRef = createRef<HTMLInputElement>();

  const [minutes, setMinutes] = useState("5");
  const [seconds, setSeconds] = useState("00");

  const timePopover = createRef<HTMLDivElement>();
  useClickOutside(timePopover, onDismiss);

  useEffect(() => {
    focusInput("min");
  }, []);

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    input: TimerInputType,
  ) => {
    const value = e.target.value;

    // skip if value is not built with numbers
    if (!/^\d+$/.test(value) && value.length !== 0) {
      return;
    }

    if (input === "min") {
      setMinutes(value);

      if (value.length === 2) {
        focusInput("sec");
      }
    } else {
      setSeconds(value);
    }
  };

  const onSaveTimerClick = () => {
    const minutesNum = Number.parseInt(minutes || "0");
    const secondsNum = Number.parseInt(seconds || "0");

    const time = minutesNum * 60 + secondsNum;

    onTimeSet(time);
    onDismiss();
  };

  const focusInput = (type: TimerInputType) => {
    if (type === "min") {
      minInputRef.current?.select();
    } else {
      secInputRef.current?.select();
    }
  };

  return (
    <div
      className={
        "flex flex-col absolute top-16 bg-background-500 rounded-xl p-2 shadow-lg gap-2"
      }
      ref={timePopover}
    >
      <div
        className={
          "flex items-center w-28 h-12 rounded-lg bg-white border-2 text-3xl"
        }
      >
        <div className={"flex w-11 text-3xl items-center"}>
          <span
            className={
              "w-11 absolute text-3xl text-end text-gray-600 select-none pointer-events-none"
            }
          >
            {"0".repeat(2 - minutes.length)}
            {"\u00A0".repeat(minutes.length)}
          </span>
          <input
            ref={minInputRef}
            maxLength={2}
            className={
              "flex w-11 h-full rounded-lg focus:outline-none text-end"
            }
            value={minutes.toString()}
            placeholder={"0"}
            onChange={(e) => onChange(e, "min")}
            onKeyDown={(e) => {
              if (
                e.key === "Enter" ||
                (e.key === "ArrowRight" &&
                  minInputRef.current?.selectionStart ===
                    minInputRef.current?.value.length)
              ) {
                e.preventDefault();
                focusInput("sec");
              }
            }}
          />
        </div>
        :
        <div className={"flex w-11 text-3xl items-center"}>
          <span
            className={
              "w-9 absolute text-3xl text-end text-gray-600 select-none pointer-events-none "
            }
          >
            {"0".repeat(2 - seconds.length)}
            {"\u00A0".repeat(seconds.length)}
          </span>
          <input
            ref={secInputRef}
            maxLength={2}
            className={"flex w-9 h-full rounded-lg focus:outline-none text-end"}
            value={seconds.toString()}
            placeholder={"00"}
            onChange={(e) => onChange(e, "sec")}
            onKeyDown={(e) => {
              if (
                e.key === "ArrowLeft" &&
                secInputRef.current?.selectionEnd === 0
              ) {
                e.preventDefault();
                focusInput("min");
              }

              if (e.key === "Enter") {
                onSaveTimerClick();
              }
            }}
          />
        </div>
      </div>

      <Button size="sm" onClick={onSaveTimerClick} className={"w-full"}>
        <CheckIcon className={"size-6"} />
      </Button>
    </div>
  );
};
