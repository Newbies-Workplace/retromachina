import { XIcon } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { toast } from "react-toastify";
import type { UserRole } from "shared/model/user/user.role";
import { Avatar } from "@/components/atoms/avatar/Avatar";
import {useTeamData} from "@/hooks/useTeamData";
import {useTeamStore} from "@/store/useTeamStore";

interface UserPickerProps {
  teamId: string;
}

export const UserPicker: React.FC<UserPickerProps> = ({
  teamId,
}) => {
  const [email, setEmail] = useState<string>("");
  const [role, setRole] = useState<UserRole>("USER");

  const {users, invites} = useTeamData(teamId)
  const {putTeamMember, removeTeamMember} = useTeamStore()

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

    putTeamMember(teamId, { email: trimmedEmail, role })
      .then(() => {
        setEmail("");
        setRole("USER");
      })
      .catch(() => {
        toast.error("Wystąpił błąd podczas dodawania użytkownika");
      })
  };

  const onUserRoleChange = (email: string, role: UserRole) => {
    putTeamMember(teamId, { email: email, role })
      .catch(() => {
        toast.error("Wystąpił błąd podczas zmiany roli użytkownika");
      })
  }

  const onUserDelete = (email: string) => {
    removeTeamMember(teamId, email).catch(() => {
      toast.error("Wystąpił błąd podczas usuwania użytkownika");
    });
  }

  return (
    <div
      className={
        "flex flex-col items-center gap-2 min-w-[100px] min-h-[34px] bg-white p-2 rounded-lg border"
      }
    >
      {[...users, ...invites].map((user) => (
        <User
          avatarUrl={user?.avatar_link}
          key={user.email}
          email={user.email}
          role={user.role}
          onRoleChange={(role) => onUserRoleChange(user.email, role)}
          onDelete={() => onUserDelete(user.email)}
        />
      ))}

      <div
        className={
          "flex items-center grow w-full max-h-[30px] border px-2 py-0 rounded-2xl"
        }
      >
        <input
          data-testid={"new-user-email"}
          className={"grow bg-transparent px-0 py-2 border-[none] outline-none"}
          value={email}
          placeholder="Podaj adres email..."
          onChange={(e) => setEmail(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onUserAdd();
            }
          }}
        />

        {email.length > 0 && (
          <XIcon
            data-testid={"remove-user"}
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
  avatarUrl?: string;
  role: UserRole;
  onRoleChange: (role: UserRole) => void;
  onDelete: () => void;
}

const User: React.FC<UserProps> = ({
  email,
  avatarUrl,
  role,
  onRoleChange,
  onDelete,
}) => {
  return (
    <div
      className={
        "flex grow items-center w-full gap-2.5 min-h-[30px] bg-white border px-2 py-0 rounded-2xl border-solid border-black [line-break:anywhere]"
      }
    >
      <Avatar size={24} url={avatarUrl} />
      <span className={"grow"}>{email}</span>

      <div className={"h-5 min-w-0.5 bg-black"} />

      <select
        data-testid={"role-select"}
        value={role}
        onChange={(e) => onRoleChange(e.target.value as UserRole)}
        className={"cursor-pointer border-transparent outline-none"}
      >
        <option value={"OWNER"}>Właściciel</option>
        <option value={"ADMIN"}>Administrator</option>
        <option value={"USER"}>Użytkownik</option>
      </select>

      <div className={"h-5 min-w-0.5 bg-black"} />

      <XIcon
        data-testid={"remove-user"}
        className={"min-w-4 min-h-4 cursor-pointer"}
        onClick={onDelete}
      />
    </div>
  );
};
