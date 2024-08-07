import {
  ClipboardIcon,
  FilePlusIcon,
  Pencil1Icon,
  PlusIcon,
} from "@radix-ui/react-icons";
import type React from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { RetroResponse } from "shared/model/retro/retro.response";
import { getRetrosByTeamId } from "../../../api/Retro.service";
import { useTeamRole } from "../../../context/useTeamRole";
import { Button } from "../../atoms/button/Button";

interface TeamRetroListProps {
  teamName: string;
  teamId: string;
}

export const TeamCard: React.FC<TeamRetroListProps> = ({
  teamName,
  teamId,
}) => {
  const navigate = useNavigate();
  const { isAdmin } = useTeamRole(teamId);
  const [retros, setRetros] = useState<RetroResponse[]>([]);
  const isAnyRetroRunning = retros.findIndex((a) => a.is_running) !== -1;

  useEffect(() => {
    getRetrosByTeamId(teamId)
      .then((retros) => {
        setRetros(retros);
      })
      .catch(console.log);
  }, [teamId]);

  return (
    <div
      data-testid={`team-${teamName}`}
      className={"flex flex-col w-full p-4 gap-4 bg-background-500 rounded-lg"}
    >
      <div className={"flex justify-between rounded-t-lg font-bold text-2xl"}>
        {teamName}

        <div className={"flex gap-2"}>
          {isAdmin && (
            <Button
              data-testid="edit-team"
              onClick={() => navigate(`/team/${teamId}/edit`)}
              size="sm"
            >
              Edytuj
              <Pencil1Icon className={"size-4"} />
            </Button>
          )}

          <Button
            data-testid="edit-team"
            onClick={() => navigate(`/team/${teamId}/edit`)}
            size="sm"
          >
            Wrzutki
            <FilePlusIcon className={"size-4"} />
          </Button>
        </div>
      </div>

      <div className={"flex gap-2"}>
        <Button
          data-testid="task-list"
          size={"xl"}
          className={"min-w-[256px] min-h-[126px] flex-col scrollbar"}
          onClick={() => navigate(`/team/${teamId}/board`)}
        >
          Lista zadań
          <ClipboardIcon className={"size-6"} />
        </Button>

        <Button
          data-testid="task-list"
          size={"xl"}
          className={"min-w-[256px] min-h-[126px] flex-col scrollbar bg-white"}
          onClick={() => navigate(`/team/${teamId}/archive`)}
        >
          Archiwum
          <br />
          Retrospekcji
          <ClipboardIcon className={"size-6"} />
        </Button>

        {isAdmin && !isAnyRetroRunning && (
          <Button
            data-testid="create-retro"
            size={"xl"}
            variant={"destructive"}
            className={"min-w-[256px] min-h-[126px] flex-col"}
            onClick={() => navigate(`/retro/create?teamId=${teamId}`)}
          >
            Nowe Retro
            <PlusIcon className={"size-6"} />
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
                  "min-w-[256px] min-h-[126px] flex-col bg-white border-4 border-red-500"
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
