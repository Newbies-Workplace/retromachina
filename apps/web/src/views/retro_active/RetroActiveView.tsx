import { autoScrollForElements } from "@atlaskit/pragmatic-drag-and-drop-auto-scroll/element";
import { Share2Icon } from "lucide-react";
import React, { useEffect, useRef } from "react";
import { Route, Routes, useNavigate } from "react-router";
import { toast } from "sonner";
import invariant from "tiny-invariant";
import { v4 as uuidv4 } from "uuid";
import { TeamService } from "@/api/Team.service";
import readySingleSound from "@/assets/sounds/ready-single.wav";
import { UserAvatar } from "@/components/molecules/user_avatar/UserAvatar";
import { GramophoneAction } from "@/components/organisms/gramophone/GramophoneAction";
import Navbar from "@/components/organisms/navbar/Navbar";
import { NavbarAction } from "@/components/organisms/navbar/NavbarAction";
import { AvatarGroup, AvatarStatus } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { WarmupView } from "@/views/retro_active/warmup/WarmupView";

export const RetroActiveView: React.FC = () => {
  const navigate = useNavigate();
  const { roomState, retroId, activeUsers, teamUsers } = useRetro();
  const { user } = useUser();
  const { ready, teamId } = useRetro();
  const { team } = useTeamData(teamId);
  const { playAudio } = useAudio();
  const { isAdmin } = useTeamRole(teamId ?? "");

  const readyUsersCount = activeUsers.filter((user) => user.isReady).length;
  const allUsersCount = activeUsers.length;
  const prevReadyUsersCount = useRef(-1);
  const prevAllUsersCount = useRef(allUsersCount);
  const generatedInviteKey = useRef<string | null>(null);

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
    if (
      prevAllUsersCount.current === allUsersCount &&
      readyUsersCount > prevReadyUsersCount.current &&
      readyUsersCount !== 0
    ) {
      const everyoneVoted = readyUsersCount === allUsersCount;

      if (everyoneVoted) {
        playAudio(readySingleSound)
          .then(() => new Promise((resolve) => setTimeout(resolve, 100)))
          .then(async () => await playAudio(readySingleSound))
          .then(() => new Promise((resolve) => setTimeout(resolve, 100)))
          .then(async () => await playAudio(readySingleSound));
      } else {
        playAudio(readySingleSound).then();
      }
    }

    prevReadyUsersCount.current = readyUsersCount;
    prevAllUsersCount.current = allUsersCount;
  }, [readyUsersCount, playAudio, allUsersCount]);

  const onShareButtonClick = async () => {
    if (!team) {
      toast.error("Nie udało się przygotować linku z zaproszeniem");
      return;
    }

    let inviteKey = team.invite_key ?? generatedInviteKey.current;

    try {
      if (!inviteKey) {
        inviteKey = uuidv4();
        await TeamService.editTeamInvitation(team.id, {
          invite_key: inviteKey,
        });
        generatedInviteKey.current = inviteKey;
      }
    } catch {
      toast.error("Nie udało się przygotować linku z zaproszeniem");
      return;
    }

    const invitationUrl = `${window.location.origin}/invitation/${inviteKey}`;

    try {
      await navigator.clipboard.writeText(invitationUrl);
    } catch {
      toast.error("Nie udało się skopiować linku do schowka");
      return;
    }

    toast.success("Link skopiowano do schowka");
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
                <NavbarAction>
                  <Button
                    size={"icon"}
                    aria-label="Skopiuj link z zaproszeniem"
                    onClick={() => {
                      onShareButtonClick();
                    }}
                  >
                    <Share2Icon className={"size-5"} />
                  </Button>
                </NavbarAction>
              )}

              <RetroTimer />

              <GramophoneAction />
            </div>

            <AvatarGroup className={"mt-0.5"}>
              {teamUsers
                .filter((u) => u.id !== user?.id)
                .map((teamUser) => {
                  const activeUser = activeUsers.find(
                    (user) => user.userId === teamUser.id,
                  );

                  if (!activeUser) return null;

                  return (
                    <Tooltip key={activeUser.userId}>
                      <TooltipTrigger
                        render={
                          <UserAvatar
                            avatarUrl={activeUser.avatar_link}
                            name={teamUser.nick}
                          >
                            {activeUser.isReady && <AvatarStatus />}
                          </UserAvatar>
                        }
                      />
                      <TooltipContent>{teamUser.nick}</TooltipContent>
                    </Tooltip>
                  );
                })}
            </AvatarGroup>
          </>
        }
      />

      <main
        style={{ minHeight: 0 }}
        className={"flex min-h-0 min-w-0 flex-col flex-1 overflow-auto pb-24"}
        ref={ref}
      >
        <Routes>
          <Route path="warmup" element={<WarmupView />} />
          <Route path="reflection" element={<ReflectionView />} />
          <Route path="group" element={<GroupView />} />
          <Route path="vote" element={<VoteView />} />
          <Route path="discuss" element={<DiscussView />} />
          <Route path="*" element={<Spinner className={"size-8"} />} />
        </Routes>
      </main>

      {roomState !== "warmup" && <Toolbox />}
    </>
  );
};
