import { XIcon } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { toast } from "react-toastify";
import type { UserRole } from "shared/model/user/user.role";
import { Avatar } from "@/components/atoms/avatar/Avatar";
import { Button } from "@/components/atoms/button/Button";
import { Input } from "@/components/atoms/input/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUser } from "@/context/user/UserContext.hook";
import { useTeamData } from "@/hooks/useTeamData";
import { useTeamRole } from "@/hooks/useTeamRole";
import { useTeamStore } from "@/store/useTeamStore";

type UserPickerProps = {
  teamId: string;
};

export const TeamMemberPicker: React.FC<UserPickerProps> = ({ teamId }) => {
  const [email, setEmail] = useState<string>("");

  const { users, invites } = useTeamData(teamId);
  const { user } = useUser();
  const { isOwner, role: currentUserRole } = useTeamRole(teamId);
  const { putTeamMember, removeTeamMember } = useTeamStore();

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

    putTeamMember(teamId, { email: trimmedEmail, role: "USER" })
      .then(() => {
        setEmail("");
      })
      .catch(() => {
        toast.error("Wystąpił błąd podczas dodawania użytkownika");
      });
  };

  const onUserRoleChange = (email: string, role: UserRole) => {
    putTeamMember(teamId, { email: email, role }).catch(() => {
      toast.error("Wystąpił błąd podczas zmiany roli użytkownika");
    });
  };

  const onUserDelete = (email: string) => {
    removeTeamMember(teamId, email).catch(() => {
      toast.error("Wystąpił błąd podczas usuwania użytkownika");
    });
  };

  return (
    <div
      className={
        "flex flex-col items-center gap-2 min-w-[100px] min-h-[34px] rounded-lg"
      }
    >
      {[...users, ...invites].map((member) => {
        const isCurrentUser = member.email === user?.email;
        const hasHigherRoleThanCurrentUser = hasHigherRole(
          currentUserRole ?? "USER",
          member.role,
        );

        const enableRoleChanging =
          !isCurrentUser && !hasHigherRoleThanCurrentUser;

        return (
          <TeamMember
            avatarUrl={
              "avatar_link" in member ? member?.avatar_link : undefined
            }
            key={member.email}
            email={member.email}
            role={member.role}
            maxRole={currentUserRole ?? "USER"}
            onRoleChange={
              enableRoleChanging
                ? (role) => onUserRoleChange(member.email, role)
                : undefined
            }
            onDelete={
              isOwner && !isCurrentUser
                ? () => onUserDelete(member.email)
                : undefined
            }
          />
        );
      })}

      <div className="flex w-full items-center gap-2">
        <Input
          data-testid={"new-user-email"}
          value={email}
          placeholder="Podaj adres email..."
          setValue={(value) => setEmail(value)}
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
            }}
          />
        )}
      </div>
    </div>
  );
};

type UserProps = {
  email: string;
  avatarUrl?: string;
  role: UserRole;
  maxRole: UserRole;
  onRoleChange?: (role: UserRole) => void;
  onDelete?: () => void;
};

const TeamMember: React.FC<UserProps> = ({
  email,
  avatarUrl,
  role,
  maxRole,
  onRoleChange,
  onDelete,
}) => {
  return (
    <div
      className={
        "flex grow items-center bg-white w-full gap-2.5 min-h-[40px] border p-1 rounded-md border-solid border [line-break:anywhere]"
      }
    >
      <Avatar size={32} url={avatarUrl} />

      <span className={"grow"}>{email}</span>

      <Select
        data-testid={"role-select"}
        value={role}
        onValueChange={onRoleChange}
      >
        <SelectTrigger disabled={!onRoleChange}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem
            value={"OWNER"}
            disabled={hasHigherRole(maxRole, "OWNER")}
          >
            Właściciel
          </SelectItem>
          <SelectItem
            value={"ADMIN"}
            disabled={hasHigherRole(maxRole, "ADMIN")}
          >
            Administrator
          </SelectItem>
          <SelectItem value={"USER"} disabled={hasHigherRole(maxRole, "USER")}>
            Użytkownik
          </SelectItem>
        </SelectContent>
      </Select>

      {!!onDelete && (
        <Button
          data-testid={"remove-user"}
          size={"icon"}
          onClick={onDelete}
          variant={"destructive"}
        >
          <XIcon className={"min-w-4 min-h-4 cursor-pointer"} />
        </Button>
      )}
    </div>
  );
};

const ROLES_HIERARCHY: UserRole[] = ["OWNER", "ADMIN", "USER"];
const hasHigherRole = (first: UserRole, second: UserRole): boolean => {
  const firstIndex = ROLES_HIERARCHY.indexOf(first);
  const secondIndex = ROLES_HIERARCHY.indexOf(second);

  if (firstIndex === -1 || secondIndex === -1) {
    throw new Error(`Unknown role: ${firstIndex === -1 ? first : second}`);
  }

  return firstIndex > secondIndex;
};
