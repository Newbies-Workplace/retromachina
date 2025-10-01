import dayjs from "dayjs";
import { InfoIcon, PlusIcon, TrashIcon } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { useNavigate } from "react-router";
import type { TaskResponse } from "shared/model/task/task.response";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/component/atoms/button/Button";
import { Switch } from "@/component/atoms/switch/Switch";
import { Card } from "@/component/molecules/card/Card";
import { Column } from "@/component/molecules/column/Column";
import { ColumnCards } from "@/component/molecules/dragndrop/ColumnCards";
import { DraggableCard } from "@/component/molecules/dragndrop/DraggableCard";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/component/molecules/tooltip/Tooltip";
import Navbar from "@/component/organisms/navbar/Navbar";
import { useBoard } from "@/context/board/BoardContext.hook";
import { useUser } from "@/context/user/UserContext.hook";

export const TeamBoardView: React.FC = () => {
  const {
    board,
    team,
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
                "flex flex-row items-center gap-2 bg-background-500 h-11 -mt-2 p-2 rounded-b-lg"
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

            {team?.owner_id === user?.id && (
              <Button size={"xs"} onClick={onEditClick}>
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
                color: column.color,
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
                        text={creatingTask.text}
                        author={
                          author && creatingTask.ownerId
                            ? {
                                avatar: author.avatar_link,
                                name: author.nick,
                                id: creatingTask.ownerId,
                              }
                            : undefined
                        }
                        teamUsers={[]}
                        editableText
                        autoFocus
                        onEditDismiss={() => {
                          setCreatingTask(undefined);
                        }}
                        onUpdate={(ownerId, text) => {
                          createTask(creatingTask.id, text, ownerId, column.id);
                          setCreatingTask(undefined);
                        }}
                      />
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
                        <Card
                          id={task.id}
                          text={task.text}
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
                          editableUser
                          editableText
                          onUpdate={(ownerId, text) =>
                            updateTask(task.id, ownerId, text)
                          }
                        >
                          <Button
                            size={"icon"}
                            variant={"destructive"}
                            onClick={() => deleteTask(task.id)}
                          >
                            <TrashIcon className={"size-4"} />
                          </Button>

                          <div className={"mt-auto self-end h-6"}>
                            <Tooltip>
                              <TooltipTrigger>
                                <InfoIcon
                                  className={
                                    "size-6 p-1 rounded-full hover:bg-gray-500"
                                  }
                                />
                              </TooltipTrigger>
                              <TooltipContent
                                side={"bottom"}
                                className={"flex flex-col gap-2"}
                              >
                                <div
                                  className={
                                    "flex flex-row justify-between gap-1"
                                  }
                                >
                                  <span className={"text-xs font-bold"}>
                                    Stworzono:
                                  </span>
                                  <span className={"text-xs"}>
                                    {dayjs(task.createdAt).format(
                                      "DD.MM.YYYY HH:mm",
                                    )}
                                  </span>
                                </div>
                                <div
                                  className={
                                    "flex flex-row justify-between gap-1"
                                  }
                                >
                                  <span className={"text-xs font-bold"}>
                                    Zaktualizowano:
                                  </span>
                                  <span className={"text-xs"}>
                                    {dayjs(task.updatedAt).format(
                                      "DD.MM.YYYY HH:mm",
                                    )}
                                  </span>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </div>
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
