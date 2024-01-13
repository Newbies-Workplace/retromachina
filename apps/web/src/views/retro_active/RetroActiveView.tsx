import React, {useEffect} from "react";
import styles from "./RetroActiveView.module.scss"
import {Route, Routes} from "react-router-dom";
import Navbar from "../../component/organisms/navbar/Navbar";
import {Timer} from "../../component/molecules/timer/Timer";
import {useRetro} from "../../context/retro/RetroContext.hook";
import {useNavigate} from "react-router";
import {ReflectionView} from "./reflection/ReflectionView";
import {GroupView} from "./group/GroupView";
import {Toolbox} from "./components/toolbox/Toolbox";
import {useUser} from "../../context/user/UserContext.hook";
import {VoteView} from "./vote/VoteView";
import {DiscussView} from "./discuss/DiscussView";
import {TeamAvatars} from "../../component/molecules/team_avatars/TeamAvatars";
import {ProgressBar} from "../../component/atoms/progress_bar/ProgressBar";
import {Button} from "../../component/atoms/button/Button";
import dayjs from "dayjs";
import {useTeamRole} from "../../context/useTeamRole";

const RetroActiveView: React.FC = () => {
    const navigate = useNavigate()
    const {
        timerEnds,
        roomState,
        retroId,
        teamId,
        setTimer,
        activeUsers,
        teamUsers,
    } = useRetro()
    const { user} = useUser()
    const { isAdmin } = useTeamRole(teamId!)
    const { ready } = useRetro()

    useEffect(() => {
        navigate(`/retro/${retroId}/${roomState}`)
    }, [roomState, navigate, retroId])

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
                avatarProps={{
                    variant: ready ? 'ready' : 'active',
                }}
                topContent={
                    <>
                        {timerEnds !== null && (
                            <div className={styles.timer}>
                                {isAdmin &&
                                    <Button
                                        className={styles.quickAdd}
                                        onClick={onQuickAddTime}
                                        size={'round'}>
                                        +30
                                    </Button>
                                }

                                <Timer timerEnds={timerEnds}/>
                            </div>
                        )}

                        {teamUsers.length !== 1 &&
                            <TeamAvatars users={
                                teamUsers.filter(u => u.id !== user!.id)
                                    .map((user) => {
                                        const socketUser = activeUsers.find(socketUser => socketUser.userId === user.id)

                                        return {
                                            id: user.id,
                                            avatar_link: user.avatar_link,
                                            isReady: socketUser?.isReady ?? false,
                                            isActive: socketUser !== undefined,
                                        }}
                                    )
                            }/>
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

            <Toolbox />
        </>
    );
};
export default RetroActiveView;
