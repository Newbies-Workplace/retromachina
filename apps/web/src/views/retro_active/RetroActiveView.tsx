import { autoScrollForElements } from "@atlaskit/pragmatic-drag-and-drop-auto-scroll/element";
import { Share2Icon } from "lucide-react";
import React, { useEffect, useRef } from "react";
import { Route, Routes, useNavigate } from "react-router";
import { toast } from "react-toastify";
import invariant from "tiny-invariant";
import readySingleSound from "@/assets/sounds/ready-single.wav";
import Navbar from "@/components/organisms/navbar/Navbar";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarImage,
  AvatarStatus,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useRetro } from "@/context/retro/RetroContext.hook";
import { useUser } from "@/context/user/UserContext.hook";
import { useAudio } from "@/hooks/useAudio";
import { useTeamData } from "@/hooks/useTeamData";
import { useTeamRole } from "@/hooks/useTeamRole";
import { RetroTimer } from "@/views/retro_active/components/retro_timer/RetroTimer";
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
  const { team } = useTeamData(teamId);
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

  const onShareButtonClick = () => {
    if (team?.invite_key) {
      navigator.clipboard
        .writeText(`${window.location.origin}/invitation/${team.invite_key}`)
        .then(() => {
          toast.success("Link skopiowano do schowka");
        });
    }
  };

  return (
    <>
      <Navbar
        avatarProps={{
          isReady: ready,
        }}
        topContent={
          <>
            <div className={"flex flex-row gap-4"}>
              {isAdmin && (
                <div
                  className={
                    "flex flex-row items-center gap-2 bg-card h-11 -mt-2 p-2 rounded-b-lg"
                  }
                >
                  <Button
                    size={"icon"}
                    onClick={() => {
                      onShareButtonClick();
                    }}
                  >
                    <Share2Icon className={"size-5"} />
                  </Button>
                </div>
              )}

              <RetroTimer />
            </div>

            <AvatarGroup>
              {teamUsers
                .filter((u) => u.id !== user?.id)
                .map((u) =>
                  activeUsers.find((socketUser) => socketUser.userId === u.id),
                )
                .filter((u) => u !== undefined)
                .map((user) => (
                  <Avatar key={user?.userId}>
                    <AvatarImage src={user.avatar_link} />
                    <AvatarFallback>:)</AvatarFallback>
                    {user?.isReady && <AvatarStatus />}
                  </Avatar>
                ))}
            </AvatarGroup>
          </>
        }
      />

      <div
        className={"flex flex-col h-[calc(100vh-70px-100px)] scrollbar"}
        ref={ref}
      >
        <Routes>
          <Route path="reflection" element={<ReflectionView />} />
          <Route path="group" element={<GroupView />} />
          <Route path="vote" element={<VoteView />} />
          <Route path="discuss" element={<DiscussView />} />
          <Route path="*" element={<Spinner className={"size-8"} />} />
        </Routes>
      </div>

      <Toolbox />
    </>
  );
};
