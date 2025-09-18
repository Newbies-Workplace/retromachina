import { autoScrollForElements } from "@atlaskit/pragmatic-drag-and-drop-auto-scroll/element";
import { Share2Icon } from "lucide-react";
import { AnimatePresence } from "motion/react";
import React, { useEffect, useRef, useState } from "react";
import { Route, Routes, useNavigate } from "react-router";
import invariant from "tiny-invariant";
import readySingleSound from "@/assets/sounds/ready-single.wav";
import { Button } from "@/component/atoms/button/Button";
import { ProgressBar } from "@/component/atoms/progress_bar/ProgressBar";
import { TeamAvatars } from "@/component/molecules/team_avatars/TeamAvatars";
import Navbar from "@/component/organisms/navbar/Navbar";
import { useRetro } from "@/context/retro/RetroContext.hook";
import { useUser } from "@/context/user/UserContext.hook";
import { useAudio } from "@/hooks/useAudio";
import { useTeamRole } from "@/hooks/useTeamRole";
import { RetroTimer } from "@/views/retro_active/components/retro_timer/RetroTimer";
import { TeamShareDialog } from "@/views/retro_active/components/team_share/TeamShareDialog";
import { Toolbox } from "@/views/retro_active/components/toolbox/Toolbox";
import { DiscussView } from "@/views/retro_active/discuss/DiscussView";
import { GroupView } from "@/views/retro_active/group/GroupView";
import { ReflectionView } from "@/views/retro_active/reflection/ReflectionView";
import { VoteView } from "@/views/retro_active/vote/VoteView";

export const RetroActiveView: React.FC = () => {
  const navigate = useNavigate();
  const { roomState, retroId, activeUsers, teamUsers } = useRetro();
  const { user } = useUser();
  const { ready, teamId } = useRetro();
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const { play: playAudio } = useAudio();
  const { isAdmin } = useTeamRole(teamId ?? "");

  const readyUsersCount = activeUsers.filter((user) => user.isReady).length;
  const allUsersCount = activeUsers.length;
  const prevReadyUsersCount = useRef(readyUsersCount);
  const prevAllUsersCount = useRef(allUsersCount);

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

  useEffect(() => {
    if (prevAllUsersCount.current === allUsersCount) {
      if (
        readyUsersCount === allUsersCount &&
        readyUsersCount > prevReadyUsersCount.current
      ) {
        playAudio(readySingleSound)
          .then(() => new Promise((resolve) => setTimeout(resolve, 100)))
          .then(async () => await playAudio(readySingleSound))
          .then(() => new Promise((resolve) => setTimeout(resolve, 100)))
          .then(async () => await playAudio(readySingleSound));
      } else if (readyUsersCount > prevReadyUsersCount.current) {
        playAudio(readySingleSound);
      }
    }

    prevReadyUsersCount.current = readyUsersCount;
    prevAllUsersCount.current = allUsersCount;
  }, [readyUsersCount, prevAllUsersCount, playAudio]);

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

      <div className={"flex flex-col grow"} ref={ref}>
        <Routes>
          <Route path="reflection" element={<ReflectionView />} />
          <Route path="group" element={<GroupView />} />
          <Route path="vote" element={<VoteView />} />
          <Route path="discuss" element={<DiscussView />} />
          <Route path="*" element={<ProgressBar />} />
        </Routes>
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
