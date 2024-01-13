import styles from './Toolbox.module.scss'
import {Button} from "../../../../component/atoms/button/Button";
import TickIconSvg from '../../../../assets/icons/tick.svg'
import RightArrowIconSvg from '../../../../assets/icons/right-arrow.svg'
import LeftArrowIconSvg from '../../../../assets/icons/left-arrow.svg'
import VoteIconSvg from '../../../../assets/icons/vote.svg'
import CheckeredFlagIconSvg from '../../../../assets/icons/finish-flag-svgrepo-com.svg'
import ProgressBar from "@ramonak/react-progress-bar";
import React, {useCallback, useRef, useState} from "react";
import cs from 'classnames';
import useClickOutside from "../../../../context/useClickOutside";
import {useRetro} from '../../../../context/retro/RetroContext.hook';
import {useUser} from '../../../../context/user/UserContext.hook';
import {usePlural} from "../../../../context/usePlural";
import {ConfirmDialog} from "../../../../component/molecules/confirm_dialog/ConfirmDialog";
import {useTeamRole} from "../../../../context/useTeamRole";
import {useCardGroups} from "../../../../context/useCardGroups";


export const Toolbox: React.FC = () => {
    const {
        cards,
        discussionCardId,
        roomState,
        teamId,
        ready,
        setReady,
        readyPercentage,
        nextRoomState,
        prevRoomState,
    } = useRetro()

    const { isAdmin } = useTeamRole(teamId!)

    const {maxVotes, setMaxVotesAmount, votes, endRetro} = useRetro();
    const {user} = useUser()
    const userVotes = maxVotes - votes.filter((vote) => user?.id === vote.voterId).length
    const groups = useCardGroups(cards, votes).sort((a, b) => b.votes - a.votes)
    const currentIndex = groups.findIndex(g => g.parentCardId === discussionCardId)
    const targetIndex = currentIndex + 1
    const nextDisabled = roomState === 'discuss' && targetIndex >= groups.length
    const prevDisabled = roomState === "reflection"
    const isVotingVisible = roomState === "vote"

    const [isVoteOpen, setOpenVote] = useState(false)
    const [isFinishOpen, setOpenFinish] = useState(false)

    const votePopover = useRef<any>();
    const closeVote = useCallback(() => setOpenVote(false),[]);
    useClickOutside(votePopover, closeVote);

    const finishPopover = useRef<any>();
    const closeFinish = useCallback(() => setOpenFinish(false),[]);
    useClickOutside(finishPopover, closeFinish);

    return (
        <div className={styles.toolbox}>
            {isAdmin && (<div className={styles.box} />)}

            <div className={styles.box} />

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
                        [styles.ready]: ready
                    })}
                    onClick={() => setReady(!ready)}>

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
            </div>

            {isAdmin &&
                <div className={styles.nextPrevButtons}>
                    <Button
                        size="medium"
                        disabled={prevDisabled}
                        onClick={prevRoomState}>
                        <LeftArrowIconSvg/>
                    </Button>

                    <Button
                        size="medium"
                        disabled={nextDisabled}
                        onClick={nextRoomState}>
                        <RightArrowIconSvg/>
                    </Button>
                </div>
            }

            <div className={styles.box}>
                {isAdmin && (
                    <>
                        <Button className={cs(styles.button, styles.finishButton)} size="medium" onClick={()=>setOpenFinish(true)}>
                            <CheckeredFlagIconSvg style={{width: 32, height: 32}}/>
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
        </div>
    );
}