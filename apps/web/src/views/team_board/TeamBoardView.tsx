import dayjs from "dayjs";
import { PlusIcon, TrashIcon } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { useNavigate } from "react-router";
import type { TaskResponse } from "shared/model/task/task.response";
import { v4 as uuidv4 } from "uuid";
import {
  Card,
  CardActions,
  CardAuthor,
  CardContent,
  CardMetadataTooltip,
} from "@/components/molecules/card/Card";
import { Column } from "@/components/molecules/column/Column";
import { ColumnCards } from "@/components/molecules/dragndrop/ColumnCards";
import { DraggableCard } from "@/components/molecules/dragndrop/DraggableCard";
import Navbar from "@/components/organisms/navbar/Navbar";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useBoard } from "@/context/board/BoardContext.hook";
import { useUser } from "@/context/user/UserContext.hook";
import { useTeamRole } from "@/hooks/useTeamRole";

export const TeamBoardView: React.FC = () => {
  const {
    board,
    teamId,
    teamUsers,
    moveTask,
    createTask,
    updateTask,
    deleteTask,
    filters,
    setFilters,
  } = useBoard();
  const [creatingTask, setCreatingTask] = useState<TaskResponse>();
  const { user } = useUser();
  const { isOwner } = useTeamRole(teamId);
  const navigate = useNavigate();

  if (!board || !user) {
    return (
      <div>
        <Navbar />
        loading
      </div>
    );
  }

  const onEditClick = () => {
    navigate("edit");
  };

  const onCreateCardClick = (columnId: string) => {
    setCreatingTask({
      id: uuidv4(),
      text: "",
      columnId: columnId,
      ownerId: user?.id,
      createdAt: dayjs().toDate(),
      updatedAt: dayjs().toDate(),
    });
  };

  return (
    <>
      <Navbar
        topContent={
          <div className={"flex flex-row items-center gap-4"}>
            <div
              className={
                "flex flex-row items-center gap-2 bg-card h-11 -mt-2 p-2 rounded-b-lg"
              }
            >
              <span className={"text-sm"}>Tylko moje</span>

              <Switch
                checked={filters.showOnlyMyTasks}
                onCheckedChange={() => {
                  setFilters({
                    ...filters,
                    showOnlyMyTasks: !filters.showOnlyMyTasks,
                  });
                }}
              />
            </div>

            {isOwner && (
              <Button size={"sm"} onClick={onEditClick}>
                Edytuj
              </Button>
            )}
          </div>
        }
      />

      <div
        className={
          "grid grid-flow-col [grid-auto-columns:minmax(300px,1fr)] h-full scrollbar"
        }
      >
        {board.columns
          ?.sort((a, b) => a.order - b.order)
          .map((column) => (
            <Column
              key={column.id}
              columnData={{
                name: column.name,
                description: null,
              }}
              headerRight={
                <Button
                  size={"icon"}
                  onClick={() => onCreateCardClick(column.id)}
                >
                  <PlusIcon className={"size-4"} />
                </Button>
              }
            >
              <ColumnCards
                columnId={column.id}
                onCardDropped={(action) => moveTask(action.cardId, column.id)}
              >
                {creatingTask &&
                  creatingTask?.columnId === column.id &&
                  (() => {
                    const author = teamUsers.find(
                      (user) => user.id === creatingTask.ownerId,
                    );

                    return (
                      <Card
                        id={creatingTask.id}
                        onEditDismiss={() => {
                          setCreatingTask(undefined);
                        }}
                      >
                        <CardContent
                          text={creatingTask.text}
                          editable
                          autoFocus
                          onSave={(text) => {
                            createTask(
                              creatingTask.id,
                              text,
                              author?.id ?? null,
                              column.id,
                            );
                            setCreatingTask(undefined);
                          }}
                        />
                        <CardAuthor
                          author={
                            author && creatingTask.ownerId
                              ? {
                                  avatar: author.avatar_link,
                                  name: author.nick,
                                  id: creatingTask.ownerId,
                                }
                              : undefined
                          }
                        />
                      </Card>
                    );
                  })()}

                {board.tasks
                  .filter((task) => task.columnId === column.id)
                  .sort((a, b) => {
                    if (!filters.showOnlyMyTasks || a.ownerId === b.ownerId) {
                      return 0;
                    }

                    if (a.ownerId === user.id) {
                      return -1;
                    }

                    if (b.ownerId === user.id) {
                      return 1;
                    }

                    return 0;
                  })
                  .map((task) => {
                    const author = teamUsers.find(
                      (user) => user.id === task.ownerId,
                    );

                    return (
                      <DraggableCard
                        key={task.id}
                        parentCardId={null}
                        cardId={task.id}
                        columnId={column.id}
                        className={
                          filters.showOnlyMyTasks && task.ownerId !== user.id
                            ? "opacity-30"
                            : ""
                        }
                      >
                        <Card id={task.id}>
                          <CardContent
                            text={task.text}
                            editable
                            onSave={(text: string) =>
                              updateTask(task.id, author?.id ?? null, text)
                            }
                          />
                          <CardAuthor
                            author={
                              author && task.ownerId
                                ? {
                                    avatar: author.avatar_link,
                                    name: author.nick,
                                    id: task.ownerId,
                                  }
                                : undefined
                            }
                            teamUsers={teamUsers.map((user) => ({
                              id: user.id,
                              name: user.nick,
                              avatar: user.avatar_link,
                            }))}
                            editable
                            onUserChange={(ownerId: string | null) =>
                              updateTask(task.id, ownerId, task.text)
                            }
                          />
                          <CardActions>
                            <Button
                              size={"icon"}
                              variant={"destructive"}
                              onClick={() => deleteTask(task.id)}
                            >
                              <TrashIcon className={"size-4"} />
                            </Button>

                            <CardMetadataTooltip
                              createdAt={task.createdAt}
                              updatedAt={task.updatedAt}
                            />
                          </CardActions>
                        </Card>
                      </DraggableCard>
                    );
                  })}
              </ColumnCards>
            </Column>
          ))}
      </div>
    </>
  );
};
