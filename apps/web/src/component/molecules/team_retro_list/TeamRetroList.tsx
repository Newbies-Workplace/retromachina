import React, {useEffect, useState} from "react";
import styles from "./TeamRetroList.module.scss";
import AddIcon from "../../../assets/icons/add-icon.svg";
import TaskIconSvg from "../../../assets/icons/task-icon.svg";
import EditIconSvg from "../../../assets/icons/edit-icon.svg";
import {useNavigate} from "react-router-dom";
import cs from "classnames";
import {ActiveRetroCard} from "../retro_card/ActiveRetroCard";
import {useUser} from "../../../context/user/UserContext.hook";
import {getRetrosByTeamId} from "../../../api/retro/Retro.service";
import {Button} from "../../atoms/button/Button";
import {RetroResponse} from "../../../api/retro/Retro.interface";
import {useTeamRole} from "../../../context/useTeamRole";

interface TeamRetroListProps {
    teamName: string;
    teamId: string;
}

export const TeamRetroList: React.FC<TeamRetroListProps> = (
    {
        teamName,
        teamId,
    }
) => {
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
                <Button onClick={() => navigate(`/team/${teamId}/board`)} size="small">
                    <TaskIconSvg />
                    Lista zadań
                </Button>

                {isAdmin &&
                    <Button onClick={() => navigate(`/team/${teamId}/edit`)} size="round">
                        <EditIconSvg />
                    </Button>
                }
            </div>

            <div className={styles.wrapper}>
                {isAdmin && !isAnyRetroRunning && (
                    <Button
                        className={styles.retroButton}
                        onClick={() => navigate(`/retro/create?teamId=${teamId}`)}
                    >
                        Nowa Retrospektywa
                        <AddIcon />
                    </Button>
                )}
                {retros.map((retro, index) => {
                    if (retro.is_running) {
                        return (
                            <ActiveRetroCard key={retro.id} onClick={() => navigate(`/retro/${retro.id}/reflection`)}/>
                        )
                    }

                    return (
                        <Button
                            className={cs(styles.retroButton, styles.retro)}
                            key={retro.id}
                            onClick={() => navigate(`/retro/${retro.id}/summary`)}>
                            <span style={{ fontSize: 24 }}>
                                {`Retro #${retros.length - index}`}
                            </span>
                            <span style={{ fontSize: 24 }}>
                                {new Date(retro.date).toLocaleDateString("pl-Pl")}
                            </span>
                        </Button>
                    )
                })}
            </div>
        </div>
    );
};
