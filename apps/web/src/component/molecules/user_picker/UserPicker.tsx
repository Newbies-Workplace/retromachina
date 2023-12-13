import React, { useState } from "react";
import CloseIcon from "../../../assets/icons/close-icon.svg";
import styles from "./UserPicker.module.scss";
import { Role } from "../../../api/user/User.interfaces";
import { TeamUser } from "../../../api/team/Team.interface";
import { toast } from "react-toastify";

interface UserPickerProps {
  users: TeamUser[];
  onAdd: (user: TeamUser) => void;
  onRoleChange: (email: string, role: Role) => void;
  onDelete: (email: string) => void;
}

export const UserPicker: React.FC<UserPickerProps> = ({
  users,
  onAdd,
  onRoleChange,
  onDelete,
}) => {
  const [email, setEmail] = useState<string>("");
  const [role, setRole] = useState<Role>("USER");

  const onUserAdd = () => {
    const mailRegex = /\S+@\S+\.\S+/;
    const trimmedEmail = email.trim();

    if (trimmedEmail.length == 0 || !mailRegex.test(trimmedEmail)) {
      return;
    }

    if (users.map((user) => user.email).includes(trimmedEmail)) {
      toast.error("Użytkownik o podanym adresie email już istnieje");
      return;
    }

    onAdd({ email: trimmedEmail, role: role });

    setEmail("");
    setRole("USER");
  };

  return (
    <div className={styles.picker}>
      {users.map((user) => (
        <User
          key={user.email}
          email={user.email}
          role={user.role}
          onRoleChange={(role) => onRoleChange(user.email, role)}
          onDelete={() => onDelete(email)}
        />
      ))}

      <div className={styles.inputWrapper}>
        <input
          className={styles.input}
          value={email}
          placeholder="Podaj adres email..."
          onBlur={onUserAdd}
          onChange={(e) => setEmail(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onUserAdd();
            }
          }}
        />

        {email.length > 0 && (
          <CloseIcon
            className={styles.close}
            onClick={() => {
              setEmail("");
              setRole("USER");
            }}
          />
        )}
      </div>
    </div>
  );
};

interface UserProps {
  email: string;
  role: Role;
  onRoleChange: (role: Role) => void;
  onDelete: () => void;
}

const User: React.FC<UserProps> = ({ email, role, onRoleChange, onDelete }) => {
  return (
    <div className={styles.user}>
      <span className={styles.email}>{email}</span>

      <div className={styles.separator} />

      <select
        value={role}
        onChange={(e) => onRoleChange(e.target.value as Role)}
        className={styles.role}
      >
        <option value={"ADMIN"}>Administrator</option>
        <option value={"USER"}>Użytkownik</option>
      </select>

      <div className={styles.separator} />

      <CloseIcon className={styles.close} onClick={onDelete} />
    </div>
  );
};
