import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import type { TeamRequest } from "shared/model/team/team.request";
import { editTeam, editTeamInvitation } from "@/api/Team.service";
import { Backdrop } from "@/component/molecules/backdrop/Backdrop";
import { UserPicker } from "@/component/molecules/user_picker/UserPicker";
import { TeamInviteLinkInput } from "@/component/organisms/forms/TeamInviteLinkInput";
import { useRetro } from "@/context/retro/RetroContext.hook";
import { useTeamData } from "@/hooks/useTeamData";

interface ShareDialogProps {
  onDismiss: () => void;
}

export const TeamShareDialog: React.FC<ShareDialogProps> = ({ onDismiss }) => {
  const { teamId } = useRetro();
  const { team: initialTeam } = useTeamData(teamId);

  const [team, setTeam] = useState<TeamRequest | null>(null);

  useEffect(() => {
    setTeam(initialTeam);
  }, [initialTeam]);

  const onInviteKeyChange = (inviteKey: string | undefined) => {
    if (!teamId) return;

    setTeam((prevState) => ({ ...prevState, invite_key: inviteKey }));

    editTeamInvitation(teamId, { invite_key: inviteKey })
      .then(() => {})
      .catch((e) => {
        toast.error("Wystąpił błąd");
      });
  };

  const onUsersChanged = (users: TeamRequest["users"]) => {
    if (!teamId || !team) return;

    setTeam((prevState) => ({ ...prevState, users }));

    editTeam(teamId, { ...team, users })
      .then(() => {})
      .catch((e) => {
        toast.error("Wystąpił błąd");
      });
  };

  return (
    <Backdrop onDismiss={onDismiss}>
      <div
        className={"flex flex-col bg-background-500 rounded-xl min-w-[500px]"}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={"flex flex-col bg-primary-500 p-4 pb-2 rounded-t-lg "}>
          <span className={"font-bold text-lg"}>Zaproszenia do zespołu</span>
          <span className={"text-sm"}>
            Wyślij zaproszenie do swojego zespołu za pomocą linku lub adresu
            email
          </span>
        </div>

        <div className={"flex flex-col gap-2 p-4"}>
          {team && (
            <TeamInviteLinkInput
              inviteKey={team?.invite_key}
              setInviteKey={(inviteKey) => {
                onInviteKeyChange(inviteKey);
              }}
            />
          )}

          <div>
            <span>Członkowie zespołu</span>
            <UserPicker
              users={team?.users || []}
              onAdd={(user) => {
                onUsersChanged([...(team?.users || []), user]);
              }}
              onRoleChange={(email, role) => {
                onUsersChanged(
                  team?.users?.map((user) =>
                    user.email === email ? { ...user, role } : user,
                  ),
                );
              }}
              onDelete={(email) => {
                onUsersChanged(
                  team?.users?.filter((user) => user.email !== email) || [],
                );
              }}
            />
          </div>
        </div>
      </div>
    </Backdrop>
  );
};
