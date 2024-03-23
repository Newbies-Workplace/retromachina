import { Cross1Icon } from "@radix-ui/react-icons";
import type React from "react";
import { useState } from "react";
import { toast } from "react-toastify";
import type { TeamUserRequest } from "shared/model/team/team.request";
import type { UserRole } from "shared/model/user/user.role";

interface UserPickerProps {
  users: TeamUserRequest[];
  onAdd: (user: TeamUserRequest) => void;
  onRoleChange: (email: string, role: UserRole) => void;
  onDelete: (email: string) => void;
}

export const UserPicker: React.FC<UserPickerProps> = ({
  users,
  onAdd,
  onRoleChange,
  onDelete,
}) => {
  const [email, setEmail] = useState<string>("");
  const [role, setRole] = useState<UserRole>("USER");

  const onUserAdd = () => {
    const mailRegex = /\S+@\S+\.\S+/;
    const trimmedEmail = email.trim();

    if (trimmedEmail.length === 0 || !mailRegex.test(trimmedEmail)) {
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
    <div
      className={
        "flex flex-row flex-wrap items-center gap-2 min-w-[100px] min-h-[34px] bg-white p-2 rounded-lg border"
      }
    >
      {users.map((user) => (
        <User
          key={user.email}
          email={user.email}
          role={user.role}
          onRoleChange={(role) => onRoleChange(user.email, role)}
          onDelete={() => onDelete(email)}
        />
      ))}

      <div
        className={
          "flex items-center grow max-h-[30px] border px-2 py-0 rounded-2xl"
        }
      >
        <input
          className={"grow bg-transparent px-0 py-2 border-[none] outline-none"}
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
          <Cross1Icon
            className={"min-w-4 min-h-4 cursor-pointer"}
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
  role: UserRole;
  onRoleChange: (role: UserRole) => void;
  onDelete: () => void;
}

const User: React.FC<UserProps> = ({ email, role, onRoleChange, onDelete }) => {
  return (
    <div
      className={
        "flex grow items-center gap-2.5 min-h-[30px] bg-white border px-2 py-0 rounded-2xl border-solid border-black [line-break:anywhere]"
      }
    >
      <span className={"grow"}>{email}</span>

      <div className={"h-5 min-w-0.5 bg-black"} />

      <select
        value={role}
        onChange={(e) => onRoleChange(e.target.value as UserRole)}
        className={"cursor-pointer border-transparent outline-none"}
      >
        <option value={"ADMIN"}>Administrator</option>
        <option value={"USER"}>Użytkownik</option>
      </select>

      <div className={"h-5 min-w-0.5 bg-black"} />

      <Cross1Icon
        className={"min-w-4 min-h-4 cursor-pointer"}
        onClick={onDelete}
      />
    </div>
  );
};
