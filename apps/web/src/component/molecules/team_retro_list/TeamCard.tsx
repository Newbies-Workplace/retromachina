import {
  ArchiveIcon,
  ClipboardIcon,
  FilePlusIcon,
  PencilIcon,
  PlusIcon,
} from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import type { RetroResponse } from "shared/model/retro/retro.response";
import { UserInTeamResponse } from "shared/model/user/user.response";
import { getRetrosByTeamId } from "@/api/Retro.service";
import { getUsersByTeamId } from "@/api/User.service";
import { Button } from "@/component/atoms/button/Button";
import { TeamAvatars } from "@/component/molecules/team_avatars/TeamAvatars";
import { useTeamRole } from "@/context/useTeamRole";

interface TeamRetroListProps {
  teamName: string;
  teamId: string;
  openReflectionCardsShelfClick: () => void;
}

export const TeamCard: React.FC<TeamRetroListProps> = ({
  teamName,
  teamId,
  openReflectionCardsShelfClick,
}) => {
  const navigate = useNavigate();
  const { isAdmin } = useTeamRole(teamId);
  const [retros, setRetros] = useState<RetroResponse[]>([]);
  const [teamUsers, setTeamUsers] = useState<UserInTeamResponse[]>();
  const isAnyRetroRunning = retros.findIndex((a) => a.is_running) !== -1;

  useEffect(() => {
    getRetrosByTeamId(teamId)
      .then((retros) => {
        setRetros(retros);
      })
      .catch(console.error);

    getUsersByTeamId(teamId)
      .then((users) => {
        setTeamUsers(users);
      })
      .catch(console.error);
  }, [teamId]);

  return (
    <div
      data-testid={`team-${teamName}`}
      className={"flex flex-col w-full p-4 gap-4 bg-background-500 rounded-lg"}
    >
      <div className={"flex gap-2 justify-between rounded-t-lg"}>
        <div
          className={
            "flex flex-row flex-wrap gap-2 font-bold text-xl items-center"
          }
        >
          {teamName}

          {teamUsers && (
            <TeamAvatars
              users={teamUsers.map((user) => {
                return { ...user, isActive: true, isReady: false };
              })}
            />
          )}
        </div>

        <div className={"flex gap-2"}>
          {isAdmin && (
            <Button
              data-testid="edit-team"
              onClick={() => navigate(`/team/${teamId}/edit`)}
              size="sm"
            >
              Edytuj
              <PencilIcon className={"size-4"} />
            </Button>
          )}

          <Button
            data-testid="open-reflection-cards-shelf"
            onClick={() => openReflectionCardsShelfClick()}
            size="sm"
          >
            Wrzutki
            <FilePlusIcon className={"size-4"} />
          </Button>
        </div>
      </div>

      <div className={"flex flex-col sm:flex-row gap-2"}>
        <Button
          data-testid="task-list"
          size={"xl"}
          className={"flex-1 flex-row sm:flex-col min-w-32 min-h-24 scrollbar"}
          onClick={() => navigate(`/team/${teamId}/board`)}
        >
          Lista zadań
          <ClipboardIcon className={"min-size-6 size-6"} />
        </Button>

        <Button
          data-testid="task-list"
          size={"xl"}
          className={
            "flex-1 flex-row sm:flex-col min-w-32 min-h-24 scrollbar bg-white"
          }
          onClick={() => navigate(`/team/${teamId}/archive`)}
        >
          Archiwum
          <br />
          Retrospekcji
          <ArchiveIcon className={"min-size-6 size-6"} />
        </Button>

        {isAdmin && !isAnyRetroRunning && (
          <Button
            data-testid="create-retro"
            size={"xl"}
            variant={"destructive"}
            className={"flex-1 flex-row sm:flex-col min-w-32 min-h-24"}
            onClick={() => navigate(`/retro/create?teamId=${teamId}`)}
          >
            Nowe Retro
            <PlusIcon className={"min-size-6 size-6"} />
          </Button>
        )}

        {retros.map((retro) => {
          if (retro.is_running) {
            return (
              <Button
                data-testid="current-retro"
                key={retro.id}
                size={"xl"}
                className={
                  "flex-1 flex-row sm:flex-col min-w-32 min-h-24 bg-white border-4 border-red-500"
                }
                onClick={() => navigate(`/retro/${retro.id}/reflection`)}
              >
                Retro <br />w trakcie
              </Button>
            );
          }
        })}
      </div>
    </div>
  );
};
