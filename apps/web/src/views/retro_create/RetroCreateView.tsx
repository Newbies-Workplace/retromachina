import { reorder } from "@atlaskit/pragmatic-drag-and-drop/reorder";
import { EraserIcon, PlusIcon, RefreshCwIcon, Share2Icon } from "lucide-react";
import * as qs from "query-string";
import type React from "react";
import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router";
import type { RetroCreateRequest } from "shared/model/retro/retro.request";
import type { TeamResponse } from "shared/model/team/team.response";
import type { UserResponse } from "shared/model/user/user.response";
import type {
  WarmupLinkResponse,
  WarmupSelection,
} from "shared/model/warmup/warmup";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { RetroService } from "@/api/Retro.service";
import { getRandomTemplate } from "@/api/RetroTemplate.service";
import { TeamService } from "@/api/Team.service";
import { UserService } from "@/api/User.service";
import { BoardCreator } from "@/components/molecules/board_creator/BoardCreator";
import { BoardCreatorColumn } from "@/components/molecules/board_creator/BoardCreatorColumn";
import {
  PageCard,
  PageCardContent,
  PageCardHeader,
} from "@/components/molecules/page_card/PageCard";
import { UserAvatar } from "@/components/molecules/user_avatar/UserAvatar";
import Navbar from "@/components/organisms/navbar/Navbar";
import { ResponsivePageLayout } from "@/components/organisms/responsive_page_layout/ResponsivePageLayout";
import { AvatarGroup } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUser } from "@/context/user/UserContext.hook";

export interface Column {
  id: string;
  name: string;
  desc: string | null;
}

interface RawColumn {
  name: string;
  desc: string | null;
}

const MAX_COLUMNS = 6;

export const RetroCreateView: React.FC = () => {
  const [clicked, setClicked] = useState(false);
  const params = qs.parse(location.search);
  const teamId: string = params.teamId as string;
  const { user } = useUser();
  const navigate = useNavigate();
  const hasTeamAccess = Boolean(
    teamId && user?.teams.some((team) => team.id === teamId),
  );

  useEffect(() => {
    if (!hasTeamAccess) return;

    Promise.all([
      TeamService.getTeamById(teamId),
      UserService.getUsersByTeamId(teamId),
    ])
      .then(([team, users]) => {
        setTeam(team);
        setTeamUsers(users);
      })
      .catch(() => navigate("/", { replace: true }));
  }, [hasTeamAccess, navigate, teamId]);

  const [team, setTeam] = useState<TeamResponse | null>(null);
  const [teamUsers, setTeamUsers] = useState<UserResponse[]>([]);

  const [columns, setColumns] = useState<Array<Column>>([]);
  const [templateId, setTemplateId] = useState<number | null>(null);
  const [warmups, setWarmups] = useState<WarmupLinkResponse[]>([]);
  const [warmupChoice, setWarmupChoice] = useState("random");

  useEffect(() => {
    randomizeTemplate();
  }, []);

  useEffect(() => {
    if (!hasTeamAccess) return;
    TeamService.getWarmups(teamId).then(setWarmups).catch(console.log);
  }, [hasTeamAccess, teamId]);

  if (!hasTeamAccess) {
    return <Navigate to={"/"} />;
  }

  const onAddColumn = () => {
    const column = {
      id: uuidv4(),
      color: "#ffffff",
      name: "",
      desc: "",
    };

    setColumns([...columns, column]);
  };

  const onChangeColumn = (id: string, column: RawColumn) => {
    const columnIndex = columns.findIndex((column) => column.id === id);
    if (columnIndex === -1) return;

    const columnsTemp: Column[] = [];

    columns.forEach((_column, index) => {
      if (index !== columnIndex) {
        columnsTemp.push(_column);
        return;
      }

      columnsTemp.push({
        id: id,
        ...column,
      });
    });

    setColumns(columnsTemp);
  };

  const onDeleteColumn = (id: string) => {
    const columnIndex = columns.findIndex((column) => column.id === id);

    const newColumns = [...columns];
    newColumns.splice(columnIndex, 1);

    setColumns(newColumns);
  };

  const onCreateRetroClick = async () => {
    setClicked(true);

    let warmup: WarmupSelection = { mode: "none" };
    if (warmupChoice === "random") warmup = { mode: "deferred-random" };
    if (warmupChoice.startsWith("selected:")) {
      warmup = {
        mode: "selected",
        warmupId: warmupChoice.slice("selected:".length),
      };
    }
    const request: RetroCreateRequest = {
      teamId: teamId,
      columns: columns,
      warmup,
    };

    RetroService.createRetro(request)
      .then((retro) => {
        const retroUrl = `${window.location.origin}/retro/${retro.data.id}`;

        navigator.clipboard?.writeText(retroUrl).catch(console.log);

        toast.success("Link został skopiowany do schowka", {
          duration: 3000,
        });

        navigate(`/retro/${retro.data.id}`);
      })
      .catch((e) => {
        console.log(e);
        toast.error("Wystąpił błąd");
        setClicked(false);
        navigate("/");
      });
  };

  const randomizeTemplate = () => {
    getRandomTemplate(templateId)
      .then((template) => {
        setTemplateId(template.id);
        setColumns(
          template.columns.map((col) => ({
            id: uuidv4(),
            name: col.name,
            desc: col.desc,
          })),
        );
      })
      .catch(console.log);
  };

  const clearTemplate = () => {
    setColumns([]);
    setTemplateId(null);
  };

  if (!team) {
    return (
      <>
        <Navbar />
        loading
      </>
    );
  }

  return (
    <>
      <Navbar />
      <ResponsivePageLayout>
        <PageCard>
          <PageCardHeader>Retrospektywa zespołu {team.name}</PageCardHeader>

          <PageCardContent>
            <AvatarGroup>
              {teamUsers.map((user) => (
                <UserAvatar
                  key={user.id}
                  avatarUrl={user.avatar_link}
                  name={user.nick}
                />
              ))}
            </AvatarGroup>

            <section className="flex flex-col gap-2 rounded-lg border p-4">
              <div>
                <h2 className="font-medium">Rozgrzewka</h2>
                <p className="text-sm text-muted-foreground">
                  Możesz ją pominąć, wybrać teraz lub wylosować po starcie.
                </p>
              </div>
              <Select
                value={warmupChoice}
                onValueChange={(value) => setWarmupChoice(value ?? "none")}
                itemToStringLabel={(value) => {
                  if (value === "none") return "Bez rozgrzewki";
                  if (value === "random") return "Losuj po starcie";
                  const id = value.replace("selected:", "");
                  return warmups.find((item) => item.id === id)?.name ?? value;
                }}
              >
                <SelectTrigger className="w-full" data-testid="warmup-select">
                  <SelectValue placeholder="Wybierz rozgrzewkę" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="none">Bez rozgrzewki</SelectItem>
                    <SelectItem value="random">Losuj po starcie</SelectItem>
                    {warmups.map((warmup) => (
                      <SelectItem
                        key={warmup.id}
                        value={`selected:${warmup.id}`}
                      >
                        {warmup.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </section>

            <div className={"flex justify-between mt-4"}>
              <div className={"flex flex-row gap-2"}>
                <Button
                  className={"grow-0"}
                  data-testid={"randomize-template"}
                  onClick={() => randomizeTemplate()}
                >
                  <RefreshCwIcon />
                  Losuj szablon
                </Button>

                <Button
                  className={"grow-0"}
                  data-testid={"clear-template"}
                  onClick={() => clearTemplate()}
                  variant={"destructive"}
                >
                  <EraserIcon />
                  Wyczyść szablon
                </Button>
              </div>

              <Button
                disabled={columns.length >= MAX_COLUMNS}
                onClick={onAddColumn}
              >
                <PlusIcon />
                Nowa kolumna
              </Button>
            </div>

            <BoardCreator
              className={"min-h-20"}
              onColumnReorder={({ fromId, toId }) => {
                const fromIndex = columns.findIndex((c) => c.id === fromId);
                const toIndex = columns.findIndex((c) => c.id === toId);
                if (fromIndex === -1 || toIndex === -1) return;
                if (fromIndex === toIndex) return;

                setColumns(
                  reorder({
                    list: columns,
                    startIndex: fromIndex,
                    finishIndex: toIndex,
                  }),
                );
                setTemplateId(null);
              }}
            >
              {columns.map((column) => (
                <BoardCreatorColumn
                  id={column.id}
                  key={column.id}
                  onChange={({ name, desc }) =>
                    onChangeColumn(column.id, { name, desc })
                  }
                  onDelete={() => onDeleteColumn(column.id)}
                  name={column.name}
                  desc={column.desc ?? ""}
                  withDescription
                />
              ))}
            </BoardCreator>

            <Button
              data-testid={"create-retro-confirm"}
              className={"mt-4"}
              disabled={clicked}
              onClick={onCreateRetroClick}
            >
              <Share2Icon />
              Rozpocznij retrospektywę
            </Button>
            <span className={"text-sm mx-auto"}>
              (link zostanie skopiowany do schowka)
            </span>
          </PageCardContent>
        </PageCard>
      </ResponsivePageLayout>
    </>
  );
};
