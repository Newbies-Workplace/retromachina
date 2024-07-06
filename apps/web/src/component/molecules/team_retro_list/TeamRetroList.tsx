import { ClipboardIcon, Pencil1Icon, PlusIcon } from "@radix-ui/react-icons";
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

export const TeamRetroList: React.FC<TeamRetroListProps> = ({
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
  }, []);

  return (
    <div
      className={"flex flex-col gap-2 w-full bg-background-500 p-2 rounded-md"}
    >
      <div className={"flex flex-row justify-between gap-2"}>
        <span className={"text-xl font-bold"}>{teamName}</span>

        {isAdmin && (
          <Button
            data-testid="edit-team"
            onClick={() => navigate(`/team/${teamId}/edit`)}
            size="icon"
          >
            <Pencil1Icon className={"size-4"} />
          </Button>
        )}
      </div>

      <div className={"flex gap-2 pb-2 scrollbar"}>
        <Button
          data-testid="task-list"
          size={"xl"}
          className={"min-w-[256px] min-h-[126px] flex-col scrollbar"}
          onClick={() => navigate(`/team/${teamId}/board`)}
        >
          Lista zadań
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

        {retros.map((retro, index) => {
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
                Retro w trakcie
              </Button>
            );
          }

          return (
            <Button
              key={retro.id}
              size={"xl"}
              className={"min-w-[256px] min-h-[126px] flex-col bg-white"}
              onClick={() => navigate(`/retro/${retro.id}/summary`)}
            >
              <div>{`Retro #${retros.length - index}`}</div>
              <div>{new Date(retro.date).toLocaleDateString("pl-Pl")}</div>
            </Button>
          );
        })}
      </div>
    </div>
  );
};
