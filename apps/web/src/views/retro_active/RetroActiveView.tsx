import type React from "react";
import { useEffect } from "react";
import { useNavigate } from "react-router";
import { Route, Routes } from "react-router-dom";
import { ProgressBar } from "../../component/atoms/progress_bar/ProgressBar";
import { TeamAvatars } from "../../component/molecules/team_avatars/TeamAvatars";
import Navbar from "../../component/organisms/navbar/Navbar";
import { useRetro } from "../../context/retro/RetroContext.hook";
import { useUser } from "../../context/user/UserContext.hook";
import { RetroTimer } from "./components/retroTimer/RetroTimer";
import { Toolbox } from "./components/toolbox/Toolbox";
import { DiscussView } from "./discuss/DiscussView";
import { GroupView } from "./group/GroupView";
import { ReflectionView } from "./reflection/ReflectionView";
import { VoteView } from "./vote/VoteView";

const RetroActiveView: React.FC = () => {
  const navigate = useNavigate();
  const { roomState, retroId, activeUsers, teamUsers } = useRetro();
  const { user } = useUser();
  const { ready } = useRetro();

  useEffect(() => {
    navigate(`/retro/${retroId}/${roomState}`);
  }, [roomState, navigate, retroId]);

  return (
    <>
      <Navbar
        avatarProps={{
          variant: ready ? "ready" : "active",
        }}
        topContent={
          <>
            <RetroTimer />

            <TeamAvatars
              users={
                teamUsers
                  .filter((u) => u.id !== user?.id)
                  .map((user) => {
                    const socketUser = activeUsers.find(
                      (socketUser) => socketUser.userId === user.id,
                    );

                    if (!socketUser) {
                      return undefined;
                    }

                    return {
                      id: user.id,
                      avatar_link: user.avatar_link,
                      isReady: socketUser?.isReady ?? false,
                      isActive: true,
                    };
                  })
                  .filter((u) => u !== undefined) as any[]
              }
            />
          </>
        }
      />

      <div className={"flex flex-col grow scrollbar"}>
        <div className={"flex-1 flex-row"}>
          <Routes>
            <Route path="reflection" element={<ReflectionView />} />
            <Route path="group" element={<GroupView />} />
            <Route path="vote" element={<VoteView />} />
            <Route path="discuss" element={<DiscussView />} />
            <Route path="*" element={<ProgressBar />} />
          </Routes>
        </div>
      </div>

      <Toolbox />
    </>
  );
};
export default RetroActiveView;
