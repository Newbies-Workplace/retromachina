import type React from "react";
import { useState } from "react";
import type {
  TeamRequest,
  TeamUserRequest,
} from "shared/model/team/team.request";
import type { UserRole } from "shared/model/user/user.role";
import { Button } from "@/components/atoms/button/Button";
import { Input } from "@/components/atoms/input/Input";
import { UserPicker } from "@/components/molecules/user_picker/UserPicker";
import { TeamInviteLinkInput } from "@/components/organisms/forms/TeamInviteLinkInput";

interface CreateTeamFormProps {
  team: TeamRequest | null;
  onSubmit: (team: TeamRequest) => void;
  onDelete?: () => void;
  deletable?: boolean;
}

export const TeamForm: React.FC<CreateTeamFormProps> = ({
  team,
  onSubmit,
  onDelete,
  deletable,
}) => {
  const [users, setUsers] = useState(team?.users || []);
  const [name, setName] = useState(team?.name || "");
  const [inviteKey, setInviteKey] = useState<string | undefined>(
    team?.invite_key || "",
  );

  const onAddUser = (user: TeamUserRequest) => {
    setUsers([...users, user]);
  };

  const onDeleteEmailClick = (email: string) => {
    setUsers(users.filter((user) => user.email !== email));
  };

  const onRoleChange = (email: string, role: UserRole) => {
    setUsers([
      ...users.map((user) => (user.email === email ? { ...user, role } : user)),
    ]);
  };

  const onSubmitClick = () => {
    onSubmit({
      name: name,
      users: users,
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

        <div className={"flex flex-col"}>
          <h1>Członkowie</h1>

          <UserPicker
            users={users}
            onAdd={(user) => onAddUser(user)}
            onRoleChange={(email, role) => onRoleChange(email, role)}
            onDelete={(email) => onDeleteEmailClick(email)}
          />
        </div>

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
