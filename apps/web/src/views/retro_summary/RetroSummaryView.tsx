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
import { AnimatedBackground } from "../../component/organisms/animated_background/AnimatedBackground";
import Navbar from "../../component/organisms/navbar/Navbar";

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
  const unassignedTasks = useMemo(
    () => tasks.filter((task) => !task.ownerId),
    [tasks],
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

      <AnimatedBackground>
        <div
          className={
            "flex flex-col gap-2 min-w-[500px] max-w-[1200px] min-h-[700px] h-fit bg-background-500 m-8 rounded-lg"
          }
        >
          <div
            className={"bg-primary-500 p-4 pb-2 rounded-t-lg font-bold text-lg"}
          >
            Retro {dayjs(retro?.date).format("DD.MM.YYYY")}
          </div>

          <div
            className={
              "flex grow flex-col justify-between gap-2 w-full h-full p-4"
            }
          >
            {userWithTasks.map((user) => {
              const userTasks = tasks.filter(
                (task) => task.ownerId === user.id,
              );

              return (
                <div key={user.id} className={"flex flex-col gap-4 w-full"}>
                  <div
                    className={
                      "flex flex-row justify-center items-center gap-4"
                    }
                  >
                    <Avatar url={user.avatar_link} />
                    {user.nick}
                  </div>

                  <div
                    className={
                      "flex items-center justify-center gap-4 flex-wrap w-full"
                    }
                  >
                    {userTasks.map((task) => {
                      return (
                        <Card
                          id={task.id}
                          key={task.id}
                          className={"w-[350px]"}
                          teamUsers={[]}
                          author={null}
                          text={task.text}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {unassignedTasks.length !== 0 && (
              <div className={"flex flex-col gap-4 w-full pt-4"}>
                <div className={"flex flex-row justify-center flex-wrap gap-4"}>
                  Nieprzypisane zadania
                </div>

                <div
                  className={
                    "flex items-center justify-center gap-4 flex-wrap w-full"
                  }
                >
                  {unassignedTasks.map((task) => {
                    return (
                      <Card
                        id={task.id}
                        key={task.id}
                        className={"w-[350px]"}
                        teamUsers={[]}
                        author={null}
                        text={task.text}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {userWithoutTasks.length !== 0 && (
              <div className={"flex flex-col gap-4 w-full pt-4"}>
                <div className={"flex flex-row justify-center flex-wrap gap-4"}>
                  {userWithoutTasks.map((user) => {
                    return (
                      <div
                        className={
                          "flex flex-row justify-center items-center gap-4"
                        }
                        key={user.id}
                      >
                        <Avatar url={user.avatar_link} />
                        {user.nick}
                      </div>
                    );
                  })}
                </div>

                <div className={"self-center"}>Brak zadań</div>
              </div>
            )}

            <Button
              className={"mt-4 self-end"}
              size={"lg"}
              onClick={() => {
                navigate(`/team/${retro?.team_id}/board`);
              }}
            >
              Powrót do listy zadań
            </Button>
          </div>
        </div>
      </AnimatedBackground>
    </>
  );
};
