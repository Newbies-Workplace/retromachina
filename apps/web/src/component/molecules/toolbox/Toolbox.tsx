import styles from './Toolbox.module.scss'
import {Button} from "../../atoms/button/Button";
import TickIconSvg from '../../../assets/icons/tick.svg'
import DeleteIconSvg from '../../../assets/icons/delete-icon.svg'
import RightArrowIconSvg from '../../../assets/icons/right-arrow.svg'
import LeftArrowIconSvg from '../../../assets/icons/left-arrow.svg'
import HourglassIconSvg from '../../../assets/icons/hourglass.svg'
import VoteIconSvg from '../../../assets/icons/vote.svg'
import CheckeredFlagIconSvg from '../../../assets/icons/finish-flag-svgrepo-com.svg'
import ProgressBar from "@ramonak/react-progress-bar";
import React, { useCallback, useRef, useState } from "react";
import cs from 'classnames';
import dayjs from 'dayjs';
import useClickOutside from "../../../context/useClickOutside";
import { useRetro } from '../../../context/retro/RetroContext.hook';
import { useUser } from '../../../context/user/UserContext.hook';
import {usePlural} from "../../../context/usePlural";
import {ConfirmDialog} from "../confirm_dialog/ConfirmDialog";

interface ToolboxProps {
    className?: string
    isAdmin: boolean
    isVotingVisible: boolean
    isFinishVisible: boolean

    onTimeChanged: (newTime: number | null) => void

    isReady: boolean
    onReadyChange: (ready: boolean) => void
    readyPercentage: number

    prevDisabled: boolean
    nextDisabled: boolean

    onNextClicked: () => void
    onPrevClicked: () => void
}

export const Toolbox: React.FC<ToolboxProps> = (
    {
        className,
        isAdmin,
        isVotingVisible,
        isFinishVisible,
        onTimeChanged,

        isReady,
        onReadyChange,
        readyPercentage,

        prevDisabled,
        nextDisabled,

        onNextClicked,
        onPrevClicked,
    }
) => {
    const {maxVotes, setMaxVotesAmount, votes, endRetro} = useRetro();
    const {user} = useUser()
    const userVotes = maxVotes - votes.filter((vote) => user?.id === vote.voterId).length

    const [time, setTime] = useState(300)
    const timeText = dayjs(0)
        .add(time, 's')
        .format('m:ss')

    const [isTimerOpen, setOpenTimer] = useState(false)
    const [isVoteOpen, setOpenVote] = useState(false)
    const [isFinishOpen, setOpenFinish] = useState(false)

    const timePopover = useRef<any>();
    const closeTimer = useCallback(() => setOpenTimer(false), []);
    useClickOutside(timePopover, closeTimer);

    const votePopover = useRef<any>();
    const closeVote = useCallback(() => setOpenVote(false),[]);
    useClickOutside(votePopover, closeVote);

    const finishPopover = useRef<any>();
    const closeFinish = useCallback(() => setOpenFinish(false),[]);
    useClickOutside(finishPopover, closeFinish);

    const onClearTimer = () => {
        onTimeChanged(null)
        closeTimer()
        setTime(300)
    }

    const onZeroTimer = () => {
        setTime(0)
    }

    const onIncreaseTimer = (seconds: number) => {
        setTime(old => old + seconds)
    }

    const onStartTimer = () => {
        const targetTime = dayjs()
            .add(time, 's')
            .add(1, 's') // delay
            .valueOf()

        onTimeChanged(targetTime)
        closeTimer()
        setTime(300)
    }

    return (
        <div className={cs(styles.toolbox, className)}>
            {isAdmin &&
                <div className={styles.box}>
                    <Button
                        className={styles.button}
                        size="medium"
                        onClick={() => setOpenTimer(true)}>
                        <HourglassIconSvg/>
                    </Button>

                    {isTimerOpen && (
                        <div className={styles.timeBubbleWrapper} ref={timePopover}>
                            <div className={styles.timerTop}>
                                <Button size='small' className={styles.clearButton} onClick={() => onClearTimer()}>
                                    <DeleteIconSvg width={24} height={24}/>
                                </Button>

                                <div className={styles.timer}>{timeText}</div>

                                <Button size="small" onClick={() => onStartTimer()}>
                                    <TickIconSvg  width={24} height={24}/>
                                </Button>
                            </div>

                            <div className={styles.buttonWrapper}>
                                <Button size="small" onClick={() => onZeroTimer()}>00</Button>
                                <Button size="small" onClick={() => onIncreaseTimer(30)}>+30s</Button>
                                <Button size="small" onClick={() => onIncreaseTimer(60)}>+1m</Button>
                            </div>
                        </div>
                    )}
                </div>
            }

            <div className={styles.box}>
                {isVotingVisible && isAdmin &&
                    <>
                        <Button
                            className={styles.button}
                            size="medium"
                            onClick={() => setOpenVote(true)}>
                            <VoteIconSvg/>
                        </Button>

                        {isVoteOpen && (
                            <div className={styles.voteBubbleWrapper} ref={votePopover}>
                                <div className={styles.voteText}>
                                    {usePlural(maxVotes, {one: "głos", few: "głosy", other: "głosów"})} na osobę
                                </div>

                                <div className={styles.buttonWrapper}>
                                    <Button
                                        size="small"
                                        className={styles.plusminusbutton}
                                        onClick={() => maxVotes > 0 && setMaxVotesAmount(maxVotes - 1)}>
                                        -
                                    </Button>
                                    <div className={styles.numberfield}>
                                        {maxVotes}
                                    </div>
                                    <Button
                                        size="small"
                                        className={styles.plusminusbutton}
                                        onClick={() => setMaxVotesAmount(maxVotes + 1)}>
                                        +
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                }
            </div>

            <div className={cs(styles.box, styles.readyBox)}>
                <Button
                    size="medium"
                    className={cs(styles.readyButton, {
                        [styles.ready]: isReady
                    })}
                    onClick={() => onReadyChange(!isReady)}>

                    <TickIconSvg width={24} height={24}/>
                </Button>

                <ProgressBar
                    completed={readyPercentage}
                    maxCompleted={100}
                    bgColor="#73bda8"
                    transitionDuration={"0.4s"}
                    isLabelVisible={false}
                    labelColor="#e80909"
                    height="10px"
                    baseBgColor="#F4F2E6"
                />
            </div>

            <div className={styles.box}>
                {isVotingVisible &&
                    <div className={styles.voteState}>
                        {`${userVotes}/${maxVotes}`}
                        <br/>
                        {usePlural(maxVotes, {one: "głos", few: "głosy", other: "głosów"})}
                    </div>
                }

                {isFinishVisible && isAdmin && (
                    <>
                        <Button className={styles.button} size="medium" onClick={()=>setOpenFinish(true)}>
                            <CheckeredFlagIconSvg/>
                        </Button>

                        {isFinishOpen &&
                            <ConfirmDialog
                                title={"Zakończenie retrospektywy"}
                                content={"Czy na pewno chcesz zakończyć retrospektywę?"}
                                onConfirmed={endRetro}
                                onDismiss={() => setOpenFinish(false)} />
                        }
                    </>
                )}
            </div>

            {isAdmin &&
                <div className={styles.nextPrevButtons}>
                    <Button
                        size="medium"
                        disabled={prevDisabled}
                        onClick={onPrevClicked}>
                        <LeftArrowIconSvg/>
                    </Button>

                    <Button
                        size="medium"
                        disabled={nextDisabled}
                        onClick={onNextClicked}>
                        <RightArrowIconSvg/>
                    </Button>
                </div>
            }
        </div>
    );
}