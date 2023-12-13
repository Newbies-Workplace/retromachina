import React, { useState } from "react";
import { Button } from "../../atoms/button/Button";
import styles from "./TeamForm.module.scss";
import { TeamRequest, TeamUser } from "../../../api/team/Team.interface";
import { Input } from "../../atoms/input/Input";
import { UserPicker } from "../../molecules/user_picker/UserPicker";
import { Role } from "../../../api/user/User.interfaces";

interface CreateTeamFormProps {
  userEmail: string;
  team: TeamRequest | null;
  onSubmit: (team: TeamRequest) => void;
  onDelete?: () => void;
  deletable?: boolean;
}

export const TeamForm: React.FC<CreateTeamFormProps> = ({
  userEmail,
  team,
  onSubmit,
  onDelete,
  deletable,
}) => {
  const [users, setUsers] = useState(team?.users || []);
  const [name, setName] = useState(team?.name || "");

  const onAddUser = (user: TeamUser) => {
    setUsers([...users, user]);
  };

  const onDeleteEmailClick = (index: number) => {
    let newUsers = [...users];
    newUsers.splice(index, 1);

    setUsers(newUsers);
  };

  const onRoleChange = (email: string, role: Role) => {
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
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <div className={styles.formWrapper}>
          <div className={styles.section}>
            <h1>Team</h1>
            <Input
              value={name}
              setValue={setName}
              placeholder={"Nazwa zespołu"}
              style={{ border: "none", paddingLeft: "10px" }}
            />
          </div>

          <div className={styles.section}>
            <h1>Członkowie</h1>

            <UserPicker
              users={users}
              onAdd={(user) => onAddUser(user)}
              onRoleChange={(email, role) => onRoleChange(email, role)}
              onDelete={(email) =>
                onDeleteEmailClick(
                  users.findIndex((user) => user.email === email)
                )
              }
            />
          </div>
        </div>
        <div className={styles.actionSection}>
          {deletable ? (
            <Button style={{ backgroundColor: "#DC6E47" }} onClick={onDelete}>
              Usuń
            </Button>
          ) : (
            <span />
          )}

          <Button onClick={onSubmitClick}>Zapisz</Button>
        </div>
      </div>
    </div>
  );
};
