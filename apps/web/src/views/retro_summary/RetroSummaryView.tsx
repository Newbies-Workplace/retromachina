import dayjs from "dayjs";
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import type { RetroResponse } from "shared/model/retro/retro.response";
import type { TaskResponse } from "shared/model/task/task.response";
import type { UserResponse } from "shared/model/user/user.response";
import { getRetroByRetroId } from "../../api/Retro.service";
import { getTasksByRetroId } from "../../api/Task.service";
import { getUsersByTeamId } from "../../api/User.service";
import { Avatar } from "../../component/atoms/avatar/Avatar";
import { Button } from "../../component/atoms/button/Button";
import { Card } from "../../component/molecules/card/Card";
import Navbar from "../../component/organisms/navbar/Navbar";
import styles from "./RetroSummaryView.module.scss";

export const RetroSummaryView = () => {
  const { retroId } = useParams<{ retroId: string }>();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<TaskResponse[]>([]);
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [retro, setRetro] = useState<RetroResponse | null>(null);

  const userWithTasks = useMemo(
    () =>
      users.filter(
        (user) => tasks.filter((task) => task.ownerId === user.id).length !== 0,
      ),
    [users],
  );
  const userWithoutTasks = useMemo(
    () =>
      users.filter(
        (user) => tasks.filter((task) => task.ownerId === user.id).length === 0,
      ),
    [users],
  );

  useEffect(() => {
    if (!retroId) return;

    getTasksByRetroId(retroId).then((tasks) => {
      setTasks(tasks);
    });

    getRetroByRetroId(retroId).then((retro) => {
      setRetro(retro);

      getUsersByTeamId(retro.team_id).then((users) => {
        setUsers(users);
      });
    });
  }, []);

  return (
    <>
      <Navbar />

      <div className={styles.container}>
        <div className={styles.wrapper}>
          <div className={"flex justify-center font-bold text-2xl w-full"}>
            Retro {dayjs(retro?.date).format("YYYY-MM-DD")}
          </div>

          {userWithTasks.map((user) => {
            const userTasks = tasks.filter((task) => task.ownerId === user.id);

            return (
              <div key={user.id} className={styles.authorAndCardSection}>
                <div className={styles.authorSection}>
                  <Avatar url={user.avatar_link} />
                  {user.nick}
                </div>

                <div className={styles.cardSection}>
                  {userTasks.map((task) => {
                    return (
                      <Card
                        className={styles.card}
                        key={task.id}
                        teamUsers={[]}
                        text={task.text}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}

          {userWithoutTasks.length !== 0 && (
            <div className={styles.noTasksSection}>
              <div className={styles.authors}>
                {userWithoutTasks.map((user) => {
                  return (
                    <div className={styles.authorSection} key={user.id}>
                      <Avatar url={user.avatar_link} />
                      {user.nick}
                    </div>
                  );
                })}
              </div>
              Brak zadań
            </div>
          )}

          <div className={styles.goBack}>
            <Button
              onClick={() => {
                navigate(`/team/${retro?.team_id}/board`);
              }}
            >
              Powrót do listy zadań
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};
