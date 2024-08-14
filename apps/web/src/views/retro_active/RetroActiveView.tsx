import { autoScrollForElements } from "@atlaskit/pragmatic-drag-and-drop-auto-scroll/element";
import { Share2Icon } from "@radix-ui/react-icons";
import { AnimatePresence } from "framer-motion";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Route, Routes } from "react-router-dom";
import invariant from "tiny-invariant";
import { Button } from "../../component/atoms/button/Button";
import { ProgressBar } from "../../component/atoms/progress_bar/ProgressBar";
import { TeamAvatars } from "../../component/molecules/team_avatars/TeamAvatars";
import Navbar from "../../component/organisms/navbar/Navbar";
import { useRetro } from "../../context/retro/RetroContext.hook";
import { useTeamRole } from "../../context/useTeamRole";
import { useUser } from "../../context/user/UserContext.hook";
import { RetroTimer } from "./components/retroTimer/RetroTimer";
import { TeamShareDialog } from "./components/teamShare/TeamShareDialog";
import { Toolbox } from "./components/toolbox/Toolbox";
import { DiscussView } from "./discuss/DiscussView";
import { GroupView } from "./group/GroupView";
import { ReflectionView } from "./reflection/ReflectionView";
import { VoteView } from "./vote/VoteView";

export const RetroActiveView: React.FC = () => {
  const navigate = useNavigate();
  const { roomState, retroId, activeUsers, teamUsers } = useRetro();
  const { user } = useUser();
  const { ready, teamId } = useRetro();
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  const { isAdmin } = useTeamRole(teamId ?? "");

  useEffect(() => {
    navigate(`/retro/${retroId}/${roomState}`);
  }, [roomState, navigate, retroId]);

  const ref = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    invariant(element);

    autoScrollForElements({
      element: element,
    });
  }, []);

  return (
    <>
      <Navbar
        avatarProps={{
          variant: ready ? "ready" : "active",
        }}
        topContent={
          <>
            <div className={"flex flex-row gap-4"}>
              {isAdmin && (
                <div
                  className={
                    "flex flex-row items-center gap-2 bg-background-500 h-12 -mt-2 pt-1 pb-1.5 px-2 rounded-b-lg"
                  }
                >
                  <Button
                    size={"icon"}
                    onClick={() => {
                      setShareDialogOpen(true);
                    }}
                  >
                    <Share2Icon className={"size-5"} />
                  </Button>
                </div>
              )}

              <RetroTimer />
            </div>

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
                      nick: user.nick,
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

      <div className={"flex flex-col grow scrollbar"} ref={ref}>
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

      <AnimatePresence>
        {shareDialogOpen && (
          <TeamShareDialog
            onDismiss={() => {
              setShareDialogOpen(false);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
};
