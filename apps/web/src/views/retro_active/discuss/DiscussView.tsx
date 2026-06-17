import { TrashIcon } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardActions,
  CardAuthor,
  CardContent,
} from "@/components/molecules/card/Card";
import { CardGroup } from "@/components/molecules/dragndrop/CardGroup";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Textarea } from "@/components/ui/textarea";
import { useRetro } from "@/context/retro/RetroContext.hook";
import { useUser } from "@/context/user/UserContext.hook";
import { type Group, groupCards } from "@/lib/groupCards";
import { pluralText } from "@/lib/pluralText";
import { cn } from "@/lib/utils";

export const DiscussView = () => {
  const { cards, votes, discussionCardId } = useRetro();

  const groups = useMemo(() => {
    return groupCards(cards, votes);
  }, [cards, votes]);

  const discussedGroup = useMemo(() => {
    return groups.find((g) => g.parentCardId === discussionCardId);
  }, [discussionCardId, groups]);

  return (
    <SidebarProvider className={"flex flex-row justify-between"}>
      <InAMomentSection groups={groups} />

      <SidebarInset>
        {discussedGroup && (
          <CurrentlyDiscussedGroupSection group={discussedGroup} />
        )}
      </SidebarInset>

      <ActionPointsSection />
    </SidebarProvider>
  );
};

const InAMomentSection: React.FC<{ groups: Group[] }> = ({ groups }) => {
  const { teamUsers, discussionCardId } = useRetro();

  return (
    <Sidebar
      variant="floating"
      className={
        "flex flex-col gap-4 py-2 mt-[70px] h-[calc(100vh-70px-100px)]"
      }
    >
      <SidebarHeader>
        <span className={"ml-2 text-xl"}>Już za chwilę...</span>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
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
                              <span className={"self-center"}>
                                {group.votes}
                              </span>
                            </div>
                          </CardActions>
                        )}
                      </Card>
                    );
                  })}
                </CardGroup>
              );
            })}
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

const CurrentlyDiscussedGroupSection: React.FC<{ group: Group }> = ({
  group,
}) => {
  const { teamUsers, votes, discussionCardId } = useRetro();
  const { user } = useUser();

  // todo fix vote for second card in group
  const hasCurrentUserVotedOnDiscussedGroup = useMemo(() => {
    const votesOnGroup = votes.filter(
      (vote) => vote.parentCardId === discussionCardId,
    );
    return votesOnGroup.some((vote) => vote.voterId === user?.id);
  }, [votes, discussionCardId, user?.id]);

  return (
    <div className={"grow pt-4 mx-4 gap-4 flex flex-col"}>
      <div className={"flex flex-row gap-2"}>
        <SidebarTrigger variant={"default"} />
        <span>Aktualnie omawiany temat:</span>
      </div>

      <div
        className={cn(
          "flex flex-col bg-card p-2.5 border rounded-2xl wrap-break-word whitespace-pre-line",
          group.votes === 0 && "opacity-40",
        )}
      >
        {group.cards.map((card) => {
          const author = teamUsers.find((u) => u.id === card.authorId);

          return (
            <div key={card.id} className={"flex gap-2 mb-4"}>
              <Avatar size={"sm"}>
                <AvatarImage src={author?.avatar_link} />
                <AvatarFallback>:)</AvatarFallback>
              </Avatar>

              {card.text}
            </div>
          );
        })}

        <span className={"flex justify-end items-end mt-auto text-sm"}>
          {group.votes}{" "}
          {pluralText(group.votes, {
            one: "głos",
            few: "głosy",
            other: "głosów",
          })}
        </span>
      </div>

      <div className={"flex gap-4 justify-end"}>
        {hasCurrentUserVotedOnDiscussedGroup && (
          <Badge>zagłosowałeś/aś na ten temat</Badge>
        )}
      </div>
    </div>
  );
};

const ActionPointsSection: React.FC = () => {
  const {
    teamUsers,
    activeUsers,
    createTask,
    deleteTask,
    updateTask,
    setCreatingTask,
    tasks,
    discussionCardId,
  } = useRetro();
  const { user } = useUser();
  const [value, setValue] = useState("");

  const usersWritingTasks = useMemo(() => {
    const socketUsers = activeUsers.filter((user) => user.isCreatingTask);

    return teamUsers.filter((teamUser) => {
      return socketUsers.some(
        (socketUser) => socketUser.userId === teamUser.id,
      );
    });
  }, [activeUsers, teamUsers]);

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

  return (
    <div
      className={
        "flex flex-col grow p-2 min-w-75 max-w-100 my-4 rounded-l-2xl bg-card h-[calc(100vh-70px-100px)]"
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

      <div className={"relative mt-4"}>
        <div className={"absolute top-0 flex gap-1 w-full px-1 h-0 -mt-6"}>
          {usersWritingTasks.slice(0, 8).map((user) => (
            <Avatar key={user.id} size={"sm"} className={"animate-bounce"}>
              <AvatarImage src={user.avatar_link} />
              <AvatarFallback>:)</AvatarFallback>
            </Avatar>
          ))}
        </div>

        <Textarea
          value={value}
          className={"resize-none min-h-20"}
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
  );
};
