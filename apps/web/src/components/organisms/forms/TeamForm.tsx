import type React from "react";
import { useState } from "react";
import { InviteResponse } from "shared/model/invite/Invite.response";
import type { TeamRequest } from "shared/model/team/team.request";
import { TeamResponse } from "shared/model/team/team.response";
import { UserInTeamResponse } from "shared/model/user/user.response";
import { Button } from "@/components/atoms/button/Button";
import { Input } from "@/components/atoms/input/Input";
import { TeamMemberPicker } from "@/components/molecules/team_member_picker/TeamMemberPicker";
import { TeamInviteLinkInput } from "@/components/organisms/forms/TeamInviteLinkInput";

interface TeamFormProps {
  team: TeamResponse | null;
  users?: UserInTeamResponse[];
  invites?: InviteResponse[];
  onSubmit: (team: TeamRequest) => void;
  onDelete?: () => void;
  deletable?: boolean;
}

export const TeamForm: React.FC<TeamFormProps> = ({
  team,
  onSubmit,
  onDelete,
  deletable,
}) => {
  const [name, setName] = useState<string>(team?.name || "");
  const [inviteKey, setInviteKey] = useState<string | undefined>(
    team?.invite_key || "",
  );

  const onSubmitClick = () => {
    onSubmit({
      name: name,
      invite_key: inviteKey && inviteKey.length > 0 ? inviteKey : undefined,
    });
  };

  return (
    <div
      className={
        "flex flex-col gap-2 w-[600px] min-h-[700px] h-fit bg-background-500 m-8 rounded-lg"
      }
    >
      <div className={"bg-primary-500 p-4 pb-2 rounded-t-lg font-bold text-lg"}>
        {team ? "Zarządzanie zespołem" : "Stworz nowy zespół"}
      </div>

      <div
        className={"flex grow flex-col justify-between gap-2 w-full h-full p-4"}
      >
        <div className={"flex flex-col"}>
          <h1>Team</h1>
          <Input
            data-testid={"team-name"}
            value={name}
            setValue={setName}
            placeholder={"Nazwa zespołu"}
          />
        </div>

        <TeamInviteLinkInput
          inviteKey={inviteKey}
          setInviteKey={(key) => {
            setInviteKey(key);
          }}
        />
        {!team && (
          <span className={"opacity-40 text-xs"}>
            (Link będzie aktywny po zapisaniu zespołu)
          </span>
        )}

        {team && (
          <div className={"flex flex-col"}>
            <h1>Członkowie</h1>

            <TeamMemberPicker teamId={team.id} />
          </div>
        )}

        <div className={"flex justify-between gap-2 mt-auto w-full"}>
          {deletable ? (
            <Button
              data-testid={"remove-team"}
              variant={"destructive"}
              onClick={onDelete}
            >
              Usuń
            </Button>
          ) : (
            <div />
          )}

          <Button data-testid={"save-team"} onClick={onSubmitClick}>
            Zapisz
          </Button>
        </div>
      </div>
    </div>
  );
};
