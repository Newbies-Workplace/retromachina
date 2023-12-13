import React, {useEffect} from "react";
import styles from "./RetroActiveView.module.scss"
import {Route, Routes} from "react-router-dom";
import Navbar from "../../component/organisms/navbar/Navbar";
import {Timer} from "../../component/molecules/timer/Timer";
import {useRetro} from "../../context/retro/RetroContext.hook";
import {useNavigate} from "react-router";
import { ReflectionView } from "./reflection/ReflectionView";
import {GroupView} from "./group/GroupView";
import { Toolbox } from "../../component/molecules/toolbox/Toolbox";
import { useUser } from "../../context/user/UserContext.hook";
import { VoteView } from "./vote/VoteView";
import { DiscussView } from "./discuss/DiscussView";
import {TeamAvatars} from "../../component/molecules/team_avatars/TeamAvatars";
import {ProgressBar} from "../../component/atoms/progress_bar/ProgressBar";
import {useCardGroups} from "../../context/useCardGroups";
import {Button} from "../../component/atoms/button/Button";
import dayjs from "dayjs";
import {useTeamRole} from "../../context/useTeamRole";

const RetroActiveView: React.FC = () => {
    const navigate = useNavigate()
    const {
        cards,
        votes,
        discussionCardId,
        timerEnds,
        roomState,
        retroId,
        teamId,
        setTimer,
        ready,
        setReady,
        activeUsers,
        teamUsers,
        readyPercentage,
        nextRoomState,
        prevRoomState,
    } = useRetro()
    const { user} = useUser()
    const { isAdmin } = useTeamRole(teamId!)

    useEffect(() => {
        navigate(`/retro/${retroId}/${roomState}`)
    }, [roomState])
    const groups = useCardGroups(cards, votes).sort((a, b) => b.votes - a.votes)
    const currentIndex = groups.findIndex(g => g.parentCardId === discussionCardId)
    const targetIndex = currentIndex + 1
    const nextDisabled = roomState === 'discuss' && targetIndex >= groups.length

    const onQuickAddTime = () => {
        const currentOrEndTime = timerEnds ? dayjs(timerEnds) : dayjs()

        const targetTime = (currentOrEndTime.isBefore(dayjs()) ? dayjs() : currentOrEndTime)
            .add(31, 's')
            .valueOf()

        setTimer(targetTime)
    }

    return (
        <>
            <Navbar
                topContent={
                    <>
                        {timerEnds !== null && isAdmin &&
                            <Button
                                className={styles.quickAdd}
                                onClick={onQuickAddTime}
                                size={'round'}>
                                +30
                            </Button>
                        }

                        {timerEnds !== null &&
                            <Timer timerEnds={timerEnds}/>
                        }

                        {teamUsers.length !== 1 &&
                            <TeamAvatars users={teamUsers.filter(u => u.id !== user!.id).map((user) => ({
                                id: user.id,
                                avatar_link: user.avatar_link,
                                isActive: activeUsers.some(socketUser => socketUser.id === user.id)
                            }))}/>
                        }
                    </>
                } />

            <div className={styles.container}>
                <div className={styles.content}>
                    <Routes>
                        <Route path="reflection" element={<ReflectionView/>} />
                        <Route path="group" element={<GroupView/>} />
                        <Route path="vote" element={<VoteView/>} />
                        <Route path="discuss" element={<DiscussView/>} />
                        <Route path="*" element={<ProgressBar/>}/>
                    </Routes>
                </div>
            </div>

            <Toolbox
                className={styles.toolbox}
                isAdmin={isAdmin}
                isVotingVisible={roomState === "vote"}
                isFinishVisible={roomState === "discuss"}
                onTimeChanged={time => setTimer(time)}
                isReady={ready}
                onReadyChange={setReady}
                readyPercentage={readyPercentage}
                nextDisabled={nextDisabled}
                prevDisabled={roomState === "reflection"}
                onNextClicked={nextRoomState}
                onPrevClicked={prevRoomState}/>
        </>
    );
};
export default RetroActiveView;
