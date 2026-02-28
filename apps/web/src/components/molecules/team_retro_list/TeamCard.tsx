import {
  ArchiveIcon,
  ClipboardIcon,
  FilePlusIcon,
  PencilIcon,
  PlusIcon,
} from "lucide-react";
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { useNavigate } from "react-router";
import type { RetroResponse } from "shared/model/retro/retro.response";
import { UserInTeamResponse } from "shared/model/user/user.response";
import { RetroService } from "@/api/Retro.service";
import { UserService } from "@/api/User.service";
import SlotMachineIcon from "@/assets/icons/slot-machine-icon.svg";
import { Avatar } from "@/components/atoms/avatar/Avatar";
import { Button } from "@/components/atoms/button/Button";
import { TeamAvatars } from "@/components/molecules/team_avatars/TeamAvatars";
import {
  SLOT_MACHINE_ANIMATION_DURATION,
  SlotMachine,
  SlotMachineRef,
} from "@/components/organisms/slot_machine/SlotMachine";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useDebounce } from "@/hooks/useDebounce";
import { useTeamRole } from "@/hooks/useTeamRole";

interface TeamRetroListProps {
  teamName: string;
  teamId: string;
  openReflectionCardsShelfClick: () => void;
}

export const TeamCard: React.FC<TeamRetroListProps> = ({
  teamName,
  teamId,
  openReflectionCardsShelfClick,
}) => {
  const navigate = useNavigate();
  const { role } = useTeamRole(teamId);
  const [retros, setRetros] = useState<RetroResponse[]>([]);
  const [teamUsers, setTeamUsers] = useState<UserInTeamResponse[]>();
  const isAnyRetroRunning = retros.findIndex((a) => a.is_running) !== -1;

  useEffect(() => {
    RetroService.getRetrosByTeamId(teamId)
      .then((retros) => {
        setRetros(retros);
      })
      .catch(console.error);

    UserService.getUsersByTeamId(teamId)
      .then((users) => {
        setTeamUsers(users);
      })
      .catch(console.error);
  }, [teamId]);

  return (
    <div
      data-testid={`team-${teamName}`}
      className={"flex flex-col w-full p-4 gap-4 bg-background-500 rounded-lg"}
    >
      <div className={"flex gap-2 justify-between rounded-t-lg"}>
        <div
          className={
            "flex flex-row flex-wrap gap-2 font-bold text-xl items-center"
          }
        >
          {teamName}

          {teamUsers && (
            <TeamAvatars
              users={teamUsers.map((user) => {
                return { ...user, isActive: true, isReady: false };
              })}
            />
          )}
        </div>

        <div className={"flex gap-2"}>
          {role !== "USER" && (
            <Button
              data-testid="edit-team"
              onClick={() => navigate(`/team/${teamId}/edit`)}
              size="sm"
            >
              Edytuj
              <PencilIcon className={"size-4"} />
            </Button>
          )}
          <Button
            data-testid="open-reflection-cards-shelf"
            onClick={() => openReflectionCardsShelfClick()}
            size="sm"
          >
            Wrzutki
            <FilePlusIcon className={"size-4"} />
          </Button>

          {teamUsers && (
            <Dialog>
              <DialogTrigger asChild>
                <Button data-testid="open-slot-machine" size="icon">
                  <SlotMachineIcon className={"size-4"} />
                </Button>
              </DialogTrigger>
              <SlotMachineDialogContent teamUsers={teamUsers ?? []} />
            </Dialog>
          )}
        </div>
      </div>

      <div className={"flex flex-col sm:flex-row gap-2"}>
        <Button
          data-testid="task-list"
          size={"xl"}
          className={"flex-1 flex-row sm:flex-col min-w-32 min-h-24 scrollbar"}
          onClick={() => navigate(`/team/${teamId}/board`)}
        >
          Lista zadań
          <ClipboardIcon className={"min-size-6 size-6"} />
        </Button>

        <Button
          data-testid="task-list"
          size={"xl"}
          className={
            "flex-1 flex-row sm:flex-col min-w-32 min-h-24 scrollbar bg-white"
          }
          onClick={() => navigate(`/team/${teamId}/archive`)}
        >
          Archiwum
          <br />
          Retrospekcji
          <ArchiveIcon className={"min-size-6 size-6"} />
        </Button>

        {role !== "USER" && !isAnyRetroRunning && (
          <Button
            data-testid="create-retro"
            size={"xl"}
            variant={"destructive"}
            className={"flex-1 flex-row sm:flex-col min-w-32 min-h-24"}
            onClick={() => navigate(`/retro/create?teamId=${teamId}`)}
          >
            Nowe Retro
            <PlusIcon className={"min-size-6 size-6"} />
          </Button>
        )}

        {retros.map((retro) => {
          if (retro.is_running) {
            return (
              <Button
                data-testid="current-retro"
                key={retro.id}
                size={"xl"}
                className={
                  "flex-1 flex-row sm:flex-col min-w-32 min-h-24 bg-white border-4 border-red-500"
                }
                onClick={() => navigate(`/retro/${retro.id}/reflection`)}
              >
                Retro <br />w trakcie
              </Button>
            );
          } else {
            return null;
          }
        })}
      </div>
    </div>
  );
};

type SlotMachineDialogContentProps = {
  teamUsers: UserInTeamResponse[];
};

const SlotMachineDialogContent: React.FC<SlotMachineDialogContentProps> = ({
  teamUsers,
}) => {
  const [isDrawing, startDrawingTransition] = useTransition();

  const slotMachineRef = useRef<SlotMachineRef>(null);
  const [highlightedUserId, setHighlightedUserId] = useState<string | null>(
    null,
  );
  const highlightedUser = useMemo(
    () => teamUsers.find((u) => u.id === highlightedUserId),
    [highlightedUserId, teamUsers],
  );
  const delayedHighlightedUser = useDebounce(
    highlightedUser,
    SLOT_MACHINE_ANIMATION_DURATION - 200,
  );
  const [teamUsersInPool, setTeamUsersInPool] = useState<string[]>(
    teamUsers.map((u) => u.id),
  );

  const drawMachine = () => {
    const usersInPool = teamUsers.filter((user) =>
      teamUsersInPool.includes(user.id),
    );
    const randomUser =
      usersInPool?.[Math.floor(Math.random() * (usersInPool?.length ?? 1))];
    setHighlightedUserId(randomUser?.id ?? null);

    startDrawingTransition(async () => {
      await slotMachineRef.current?.animateSlotMachine(false);
    });
  };

  return (
    <DialogContent showCloseButton={false}>
      <DialogHeader>
        <DialogTitle>Losowanie</DialogTitle>
        <DialogDescription>
          Wybierz losowego członka zespołu, wystarczy pociągnąć za dźwignię
        </DialogDescription>
      </DialogHeader>

      <SlotMachine
        className={"mx-auto min-w-[400px]"}
        ref={slotMachineRef}
        onMachineDrawn={() => {
          if (teamUsersInPool.length === 0) return;
          if (isDrawing) return;

          drawMachine();
        }}
        highlightedUserId={highlightedUserId}
        userPool={teamUsers ?? []}
      />

      <div
        className={
          "p-2 bg-secondary-500/30 rounded h-16 font-semiboldflex flex flex-row gap-2 justify-center items-center"
        }
      >
        {delayedHighlightedUser && (
          <div className={"flex flex-row gap-2 justify-center items-center"}>
            <Avatar url={delayedHighlightedUser.avatar_link} size={50} />
            <div>{delayedHighlightedUser.nick}</div>
          </div>
        )}
        {!delayedHighlightedUser && <span>. . .</span>}
      </div>

      <div className={"mt-2 gap-2"}>
        <h3 className={"font-semibold"}>Ustawienia losowania</h3>
        <p>wybierz kto jest brany pod uwagę w losowaniu</p>

        <div className={"flex flex-row flex-wrap gap-2 mt-2"}>
          {teamUsers.map((user) => {
            return (
              <div
                key={user.id}
                className={"cursor-pointer"}
                onClick={() => {
                  if (
                    teamUsersInPool.includes(user.id) &&
                    teamUsersInPool.length === 1
                  ) {
                    return;
                  }

                  setTeamUsersInPool((prev) => {
                    if (prev.includes(user.id)) {
                      return prev.filter((id) => id !== user.id);
                    } else {
                      return [...prev, user.id];
                    }
                  });
                }}
              >
                <Avatar
                  url={user.avatar_link}
                  size={50}
                  variant={
                    teamUsersInPool.includes(user.id) ? "ready" : undefined
                  }
                />
              </div>
            );
          })}
        </div>
      </div>

      <DialogFooter>
        <DialogClose asChild>
          <Button variant={"destructive"}>Zamknij</Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  );
};
