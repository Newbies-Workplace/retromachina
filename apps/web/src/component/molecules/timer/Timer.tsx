import React, {useEffect, useState} from "react";
import styles from "./Timer.module.scss";
import cs from 'classnames';
import dayjs from "dayjs";

interface PropsTimer {
    timerEnds: number | null
}

export const Timer: React.FC<PropsTimer> = ({timerEnds}) => {
    const [timeLeft, setTimeLeft] = useState<number>(0)
    let isExpiring
    let isFinished
    let timeText = dayjs.duration(timeLeft, 's').format('m:ss')

    if (timeLeft <= 0) {
        isFinished = true
        timeText = "po czasie"
    } else if (timeLeft <= 30) {
        isExpiring = true
    }

    useEffect(() => {
        const setTimer = () => {
            if (timerEnds !== null) {
                setTimeLeft((timerEnds - dayjs().valueOf()) / 1000)
            }
        }

        setTimer()
        const counter = setInterval(() => {
            setTimer()
        }, 1000)

        return () => {
            clearInterval(counter)
        }
    }, [timerEnds])

    return (
        <div className={cs(
            styles.timer,
            {
                [styles.expires]: isExpiring,
                [styles.end]: isFinished,
            }
        )}>
            {timeText}
        </div>
    )
};
