import { TrashIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import React, { useEffect, useMemo, useState } from "react";
import { cn } from "@/common/Util";
import { Avatar } from "@/component/atoms/avatar/Avatar";
import { Button } from "@/component/atoms/button/Button";
import { Input } from "@/component/atoms/input/Input";
import { Card } from "@/component/molecules/card/Card";
import { CardGroup } from "@/component/molecules/dragndrop/CardGroup";
import { useRetro } from "@/context/retro/RetroContext.hook";
import { useUser } from "@/context/user/UserContext.hook";
import { type Group, groupCards } from "@/common/groupCards";
import { pluralText } from "@/common/pluralText";

export const DiscussView = () => {
  const {
    cards,
    teamUsers,
    activeUsers,
    votes,
    createTask,
    deleteTask,
    updateTask,
    setCreatingTask,
    tasks,
    discussionCardId,
  } = useRetro();
  const { user } = useUser();
  const [value, setValue] = useState("");

  useEffect(() => {
    const onStopWriting = () => {
      setCreatingTask(false);
    };

    const isCurrentlyCreatingTask = activeUsers.find(
      (u) => u.userId === user?.id,
    )?.isCreatingTask;

    if (value !== "" && !isCurrentlyCreatingTask) {
      setCreatingTask(true);
    }
    const timeout = setTimeout(onStopWriting, 3000);

    return () => {
      clearTimeout(timeout);
    };
  }, [value]);

  const [groups, setGroups] = useState<Group[]>([]);

  useEffect(() => {
    setGroups(groupCards(cards, votes));
  }, [cards, votes]);

  const usersWritingTasks = useMemo(() => {
    const socketUsers = activeUsers.filter((user) => user.isCreatingTask);

    return teamUsers.filter((teamUser) => {
      return socketUsers.some(
        (socketUser) => socketUser.userId === teamUser.id,
      );
    });
  }, [activeUsers, teamUsers]);

  return (
    <div
      className={
        "flex justify-between flex-row h-full max-h-[calc(100vh-64px-76px)]"
      }
    >
      <div
        className={
          "hidden lg:flex flex-col gap-4 min-w-[250px] max-w-[w50px] px-4 py-2 scrollbar"
        }
      >
        <span className={"ml-2 text-3xl"}>Już za chwilę...</span>
        {groups
          .sort((a, b) => b.votes - a.votes)
          .filter((group, groupIndex) => {
            const discussIndex = groups.findIndex(
              (g) => g.parentCardId === discussionCardId,
            );
            return discussIndex < groupIndex;
          })
          .map((group) => {
            return (
              <CardGroup
                className={cn(group.votes === 0 && "opacity-40")}
                columnId={"next"}
                key={group.parentCardId}
                parentCardId={group.parentCardId}
              >
                {group.cards.map((card, index) => {
                  const author = teamUsers.find(
                    (user) => user.id === card.authorId,
                  );

                  return (
                    <Card
                      id={card.id}
                      key={card.id}
                      style={{ marginTop: index === 0 ? 0 : -80 }}
                      text={card.text}
                      author={{
                        avatar: author?.avatar_link || "",
                        name: author?.nick || "",
                        id: card.authorId,
                      }}
                      teamUsers={teamUsers.map((user) => ({
                        id: user.id,
                        name: user.nick,
                        avatar: user.avatar_link,
                      }))}
                    >
                      {group.cards.length === index + 1 && (
                        <div className={"flex justify-center grow w-8"}>
                          <span className={"self-center"}>{group.votes}</span>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </CardGroup>
            );
          })}
      </div>

      {discussionCardId && (
        <div className={"grow justify-center pt-4"}>
          {(() => {
            const group = groups.find(
              (g) => g.parentCardId === discussionCardId,
            );
            if (!group) {
              return null;
            }

            return (
              <div
                className={cn(
                  "flex flex-col mx-4 bg-white p-2.5 border rounded-2xl break-words whitespace-pre-line",
                  group.votes === 0 && "opacity-40",
                )}
              >
                {group.cards.map((card) => {
                  const author = teamUsers.find((u) => u.id === card.authorId);

                  return (
                    <div key={card.id} className={"flex gap-2 mb-4"}>
                      <Avatar url={author?.avatar_link ?? ""} size={24} />

                      {card.text}
                    </div>
                  );
                })}

                <span
                  className={
                    "flex justify-end items-end mt-auto text-sm text-gray-600"
                  }
                >
                  {group.votes}{" "}
                  {pluralText(group.votes, {
                    one: "głos",
                    few: "głosy",
                    other: "głosów",
                  })}
                </span>
              </div>
            );
          })()}
        </div>
      )}
      <div
        className={
          "flex flex-col grow p-2 min-w-[300px] max-w-[400px] my-4 rounded-l-2xl bg-background-500"
        }
      >
        <div className={"flex flex-col gap-2 mb-auto pb-7 scrollbar"}>
          {tasks
            ?.filter(
              (actionPoint) => actionPoint.parentCardId === discussionCardId,
            )
            .map((actionPoint) => {
              const author = teamUsers.find(
                (teamUser) => teamUser.id === actionPoint.ownerId,
              );

              return (
                <Card
                  id={actionPoint.id}
                  key={actionPoint.id}
                  editableUser
                  editableText
                  onUpdate={(ownerId, text) => {
                    updateTask(actionPoint.id, ownerId, text);
                  }}
                  teamUsers={teamUsers.map((user) => ({
                    id: user.id,
                    name: user.nick,
                    avatar: user.avatar_link,
                  }))}
                  text={actionPoint.description}
                  author={
                    author
                      ? {
                          avatar: author.avatar_link,
                          name: author.nick,
                          id: author.id,
                        }
                      : undefined
                  }
                >
                  <Button
                    size={"icon"}
                    variant={"destructive"}
                    onClick={() => deleteTask(actionPoint.id)}
                  >
                    <TrashIcon className={"size-4"} />
                  </Button>
                </Card>
              );
            })}
        </div>

        <div className={"mt-4"}>
          <div className={"flex w-full -mb-7 px-1"}>
            <AnimatePresence>
              {usersWritingTasks.slice(0, 8).map((user) => (
                <motion.div
                  layout
                  key={user.id}
                  initial={{ y: 24 }}
                  animate={{ y: 0 }}
                  exit={{ y: 24 }}
                >
                  <Avatar
                    className={"animate-bounce"}
                    url={user.avatar_link}
                    size={32}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <Input
            multiline
            value={value}
            className={"z-[1]"}
            setValue={setValue}
            placeholder={"Nowy action point..."}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                createTask(value, user?.id!);
                setValue("");
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};
