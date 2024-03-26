import type React from "react";
import { useState } from "react";
import type {
  TeamRequest,
  TeamUserRequest,
} from "shared/model/team/team.request";
import type { UserRole } from "shared/model/user/user.role";
import { Button } from "../../atoms/button/Button";
import { Input } from "../../atoms/input/Input";
import { UserPicker } from "../../molecules/user_picker/UserPicker";

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
      name: name || "",
      users: users,
    });
  };

  return (
    <div
      className={
        "flex flex-col justify-between items-center gap-8 w-[600px] min-h-[700px] h-fit bg-background-500 m-8 p-[30px] rounded-2xl"
      }
    >
      <div className={"flex flex-col items-center gap-4 w-full"}>
        <div className={"flex flex-col gap-2 w-full"}>
          <h1>Team</h1>
          <Input
            value={name}
            setValue={setName}
            placeholder={"Nazwa zespołu"}
          />
        </div>

        <div className={"flex flex-col gap-2 w-full"}>
          <h1>Członkowie</h1>

          <UserPicker
            users={users}
            onAdd={(user) => onAddUser(user)}
            onRoleChange={(email, role) => onRoleChange(email, role)}
            onDelete={(email) => onDeleteEmailClick(email)}
          />
        </div>
      </div>

      <div className={"flex justify-between gap-2 w-full"}>
        {deletable ? (
          <Button variant={"destructive"} onClick={onDelete}>
            Usuń
          </Button>
        ) : (
          <div />
        )}

        <Button onClick={onSubmitClick}>Zapisz</Button>
      </div>
    </div>
  );
};
