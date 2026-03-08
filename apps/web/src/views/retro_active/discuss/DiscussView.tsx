import { TrashIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { UserAvatar } from "@/components/atoms/avatar/UserAvatar";
import {
  Card,
  CardActions,
  CardAuthor,
  CardContent,
} from "@/components/molecules/card/Card";
import { CardGroup } from "@/components/molecules/dragndrop/CardGroup";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useRetro } from "@/context/retro/RetroContext.hook";
import { useUser } from "@/context/user/UserContext.hook";
import { type Group, groupCards } from "@/lib/groupCards";
import { pluralText } from "@/lib/pluralText";
import { cn } from "@/lib/utils";

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
    <div className={"flex justify-between flex-row h-full"}>
      <div
        className={
          "hidden lg:flex flex-col gap-4 min-w-[250px] max-w-[50px] px-4 py-2 scrollbar"
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
                    >
                      <CardContent text={card.text} />
                      <CardAuthor
                        author={{
                          avatar: author?.avatar_link || "",
                          name: author?.nick || "",
                          id: card.authorId,
                        }}
                      />
                      {group.cards.length === index + 1 && (
                        <CardActions>
                          <div className={"flex justify-center grow w-8"}>
                            <span className={"self-center"}>{group.votes}</span>
                          </div>
                        </CardActions>
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
                  "flex flex-col mx-4 bg-card p-2.5 border rounded-2xl wrap-break-word whitespace-pre-line",
                  group.votes === 0 && "opacity-40",
                )}
              >
                {group.cards.map((card) => {
                  const author = teamUsers.find((u) => u.id === card.authorId);

                  return (
                    <div key={card.id} className={"flex gap-2 mb-4"}>
                      <UserAvatar url={author?.avatar_link ?? ""} size={24} />

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
          "flex flex-col grow p-2 min-w-75 max-w-100 my-4 rounded-l-2xl bg-card"
        }
      >
        <div className={"flex flex-col gap-2 mb-auto pb-7 h-full scrollbar"}>
          {tasks
            ?.filter(
              (actionPoint) => actionPoint.parentCardId === discussionCardId,
            )
            .map((actionPoint) => {
              const author = teamUsers.find(
                (teamUser) => teamUser.id === actionPoint.ownerId,
              );

              return (
                <Card id={actionPoint.id} key={actionPoint.id}>
                  <CardContent
                    text={actionPoint.description}
                    editable
                    onSave={(text) => {
                      updateTask(actionPoint.id, author?.id ?? null, text);
                    }}
                  />
                  <CardAuthor
                    author={
                      author
                        ? {
                            avatar: author.avatar_link,
                            name: author.nick,
                            id: author.id,
                          }
                        : undefined
                    }
                    teamUsers={teamUsers.map((user) => ({
                      id: user.id,
                      name: user.nick,
                      avatar: user.avatar_link,
                    }))}
                    editable
                    onUserChange={(ownerId) => {
                      updateTask(
                        actionPoint.id,
                        ownerId,
                        actionPoint.description,
                      );
                    }}
                  />
                  <CardActions>
                    <Button
                      size={"icon"}
                      variant={"destructive"}
                      onClick={() => deleteTask(actionPoint.id)}
                    >
                      <TrashIcon className={"size-4"} />
                    </Button>
                  </CardActions>
                </Card>
              );
            })}
        </div>

        <div className={"mt-4"}>
          <div className={"flex w-full -mb-3 px-1"}>
            <AnimatePresence>
              {usersWritingTasks.slice(0, 8).map((user) => (
                <motion.div
                  layout
                  key={user.id}
                  initial={{ y: 32 }}
                  animate={{ y: 0 }}
                  exit={{ y: 32 }}
                >
                  <UserAvatar
                    className={"animate-bounce"}
                    url={user.avatar_link}
                    size={32}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <Textarea
            value={value}
            className={"z-10 resize-none min-h-20"}
            onChange={(event) => setValue(event.target.value)}
            placeholder={"Nowy action point..."}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !!user) {
                e.preventDefault();
                createTask(value, user.id);
                setValue("");
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};
