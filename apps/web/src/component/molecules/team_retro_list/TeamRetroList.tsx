import cs from "classnames";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RetroResponse } from "shared/model/retro/retro.response";
import { getRetrosByTeamId } from "../../../api/Retro.service";
import AddIcon from "../../../assets/icons/add-icon.svg";
import EditIconSvg from "../../../assets/icons/edit-icon.svg";
import TaskIconSvg from "../../../assets/icons/task-list.svg";
import { useTeamRole } from "../../../context/useTeamRole";
import { Button } from "../../atoms/button/Button";
import { ActiveRetroCard } from "../retro_card/ActiveRetroCard";
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
          <Button onClick={() => navigate(`/team/${teamId}/edit`)} size="round">
            <EditIconSvg />
          </Button>
        )}
      </div>

      <div className={styles.wrapper}>
        <Button
          className={styles.retroButton}
          onClick={() => navigate(`/team/${teamId}/board`)}
        >
          Lista zadań
          <TaskIconSvg />
        </Button>

        {isAdmin && !isAnyRetroRunning && (
          <Button
            className={styles.retroButton}
            onClick={() => navigate(`/retro/create?teamId=${teamId}`)}
            style={{ backgroundColor: "#DC6E47" }}
          >
            Nowa Retrospektywa
            <AddIcon />
          </Button>
        )}

        {retros.map((retro, index) => {
          if (retro.is_running) {
            return (
              <ActiveRetroCard
                key={retro.id}
                onClick={() => navigate(`/retro/${retro.id}/reflection`)}
              />
            );
          }

          return (
            <Button
              className={cs(styles.retroButton, styles.retro)}
              key={retro.id}
              onClick={() => navigate(`/retro/${retro.id}/summary`)}
            >
              <span style={{ fontSize: 24 }}>
                {`Retro #${retros.length - index}`}
              </span>
              <span style={{ fontSize: 24 }}>
                {new Date(retro.date).toLocaleDateString("pl-Pl")}
              </span>
            </Button>
          );
        })}
      </div>
    </div>
  );
};
