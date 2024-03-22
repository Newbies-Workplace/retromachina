import { ClipboardIcon, Pencil1Icon, PlusIcon } from "@radix-ui/react-icons";
import type React from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { RetroResponse } from "shared/model/retro/retro.response";
import { getRetrosByTeamId } from "../../../api/Retro.service";
import { useTeamRole } from "../../../context/useTeamRole";
import { Button } from "../../atoms/button/Button";
import styles from "./TeamRetroList.module.scss";

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
    <div className={styles.team}>
      <div className={styles.topBar}>
        <h2 className={styles.title}>{teamName}</h2>

        {isAdmin && (
          <Button onClick={() => navigate(`/team/${teamId}/edit`)} size="icon">
            <Pencil1Icon className={"size-4"} />
          </Button>
        )}
      </div>

      <div className={styles.wrapper}>
        <Button
          size={"xl"}
          className={"min-w-[256px] min-h-[126px] flex-col"}
          onClick={() => navigate(`/team/${teamId}/board`)}
        >
          Lista zadań
          <ClipboardIcon className={"size-6"} />
        </Button>

        {isAdmin && !isAnyRetroRunning && (
          <Button
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
                key={retro.id}
                size={"xl"}
                className={
                  "min-w-[256px] min-h-[126px] flex-col bg-white border-4 border-red-500"
                }
                onClick={() => navigate(`/retro/${retro.id}/reflection`)}
              >
                Retro w trakcie
                <PlusIcon className={"size-6"} />
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
