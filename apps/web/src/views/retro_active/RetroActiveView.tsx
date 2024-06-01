import { Share2Icon } from "@radix-ui/react-icons";
import { AnimatePresence } from "framer-motion";
import React, { useState } from "react";
import { useEffect } from "react";
import { useNavigate } from "react-router";
import { Route, Routes } from "react-router-dom";
import type { InviteResponse } from "shared/.dist/model/invite/Invite.response";
import type { TeamRequest } from "shared/.dist/model/team/team.request";
import type { UserInTeamResponse } from "shared/.dist/model/user/user.response";
import { getInvitesByTeamId, getTeamById } from "../../api/Team.service";
import { getUsersByTeamId } from "../../api/User.service";
import { Button } from "../../component/atoms/button/Button";
import { Label } from "../../component/atoms/label/Label";
import { ProgressBar } from "../../component/atoms/progress_bar/ProgressBar";
import { Switch } from "../../component/atoms/switch/Switch";
import { Backdrop } from "../../component/molecules/backdrop/Backdrop";
import { TeamAvatars } from "../../component/molecules/team_avatars/TeamAvatars";
import { UserPicker } from "../../component/molecules/user_picker/UserPicker";
import Navbar from "../../component/organisms/navbar/Navbar";
import { useRetro } from "../../context/retro/RetroContext.hook";
import { useTeamRole } from "../../context/useTeamRole";
import { useUser } from "../../context/user/UserContext.hook";
import { RetroTimer } from "./components/retroTimer/RetroTimer";
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

  return (
    <>
      <Navbar
        avatarProps={{
          variant: ready ? "ready" : "active",
        }}
        topContent={
          <>
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

      <AnimatePresence>
        {shareDialogOpen && (
          <ShareDialog
            onDismiss={() => {
              setShareDialogOpen(false);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
};

interface ShareDialogProps {
  onDismiss: () => void;
}

export const ShareDialog: React.FC<ShareDialogProps> = ({ onDismiss }) => {
  const { user } = useUser();
  const { teamId } = useRetro();

  const [shareEnabled, setShareEnabled] = useState(true);
  const [team, setTeam] = useState<TeamRequest | null>(null);

  useEffect(() => {
    const waitForResult = async () => {
      if (!teamId || !user) {
        return;
      }

      const teamResponse = await getTeamById(teamId);

      const users = await getUsersByTeamId(teamId).then((users) =>
        users.filter((elem: UserInTeamResponse) => {
          return elem.email !== user?.email;
        }),
      );

      const invites = await getInvitesByTeamId(teamId).then((data) =>
        data.map((invite: InviteResponse) => ({
          email: invite.email,
          role: invite.role,
        })),
      );

      setTeam({
        name: teamResponse.name,
        users: [...users, ...invites],
      });
    };

    waitForResult();
  }, []);

  return (
    <Backdrop onDismiss={onDismiss}>
      <div
        className={"flex flex-col bg-background-500 rounded-xl min-w-[500px]"}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={"bg-primary-500 p-2 rounded-t-lg font-bold text-lg"}>
          Zapraszanie
        </div>

        <div className={"flex flex-col gap-4 p-2"}>
          <div>
            <span>Członkowie zespołu</span>
            <UserPicker
              users={team?.users || []}
              onAdd={() => {}}
              onRoleChange={() => {}}
              onDelete={() => {}}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id={"share-enabled"}
              checked={shareEnabled}
              onCheckedChange={(value) => {
                setShareEnabled(value);
              }}
            />
            <Label htmlFor="share-enabled">
              Zezwól na dołączanie z linkiem
            </Label>
          </div>
          <Button disabled={!shareEnabled}>Skopiuj link z zaproszeniem</Button>

          <div className={"flex flex-row justify-end"}>
            <Button>Gotowe</Button>
          </div>
        </div>
      </div>
    </Backdrop>
  );
};
