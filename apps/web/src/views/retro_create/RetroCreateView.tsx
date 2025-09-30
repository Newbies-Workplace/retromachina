import { EraserIcon, PlusIcon, RefreshCwIcon, Share2Icon } from "lucide-react";
import * as qs from "query-string";
import type React from "react";
import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router";
import { toast } from "react-toastify";
import type { RetroCreateRequest } from "shared/model/retro/retro.request";
import type { TeamResponse } from "shared/model/team/team.response";
import type { UserResponse } from "shared/model/user/user.response";
import { v4 as uuidv4 } from "uuid";
import { createRetro } from "@/api/Retro.service";
import { getRandomTemplate } from "@/api/RetroTemplate.service";
import { getTeamById } from "@/api/Team.service";
import { getUsersByTeamId } from "@/api/User.service";
import { getRandomColor } from "@/common/Util";
import { Avatar } from "@/component/atoms/avatar/Avatar";
import { Button } from "@/component/atoms/button/Button";
import { ColumnCreate } from "@/component/molecules/column_create/ColumnCreate";
import Navbar from "@/component/organisms/navbar/Navbar";

export interface Column {
  id: string;
  color: string;
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

  useEffect(() => {
    getTeamById(teamId).then((team) => setTeam(team));

    getUsersByTeamId(teamId)
      .then((users) => setTeamUsers(users))
      .catch(console.log);
  }, [teamId]);

  const [team, setTeam] = useState<TeamResponse | null>(null);
  const [teamUsers, setTeamUsers] = useState<UserResponse[]>([]);

  const [columns, setColumns] = useState<Array<Column>>([]);
  const [templateId, setTemplateId] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    randomizeTemplate();
  }, []);

  if (!teamId) {
    return <Navigate to={"/"} />;
  }

  const onAddColumn = () => {
    const column = {
      id: uuidv4(),
      color: getRandomColor(),
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
        color: "#ffffff",
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

    const request: RetroCreateRequest = {
      teamId: teamId,
      columns: columns,
    };

    createRetro(request)
      .then((retro) => {
        const retroUrl = `${window.location.origin}/retro/${retro.data.id}`;

        navigator.clipboard?.writeText(retroUrl).catch(console.log);

        toast.success("Link został skopiowany do schowka", {
          autoClose: 3000,
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
            color: col.color,
          })),
        );
      })
      .catch(console.log);
  };

  const clearColumns = () => {
    setColumns([]);
    setTemplateId(null);
  };

  if (!team) {
    return <></>;
  }

  return (
    <>
      <Navbar />

      <div className={"flex p-2 m-2 bg-background-500 rounded-xl"}>
        <div className={"p-2 w-full rounded-lg bg-card flex flex-col gap-2"}>
          <span>Retrospektywa zespołu {team.name}</span>
          <div className={"flex flex-row -space-x-2 flex-wrap"}>
            {teamUsers.map((user) => (
              <Avatar key={user.id} url={user.avatar_link} size={48} />
            ))}
          </div>

          <div className={"flex flex-row gap-2 mt-4"}>
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
              data-testid={"randomize-template"}
              onClick={() => clearColumns()}
              variant={"destructive"}
            >
              <EraserIcon />
              Wyczyść kolumny
            </Button>
          </div>

          <div className={"flex items-start gap-2 scrollbar pb-2"}>
            {columns.map((column) => (
              <ColumnCreate
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

            <div className={"pr-4"}>
              <Button
                className={"min-w-[300px] max-w-[300px] flex-col"}
                disabled={columns.length >= MAX_COLUMNS}
                size="xl"
                onClick={onAddColumn}
              >
                Nowa
                <br />
                kolumna
                <PlusIcon className={"size-6"} />
              </Button>
            </div>
          </div>

          <Button
            data-testid={"create-retro"}
            className={"mt-4"}
            disabled={clicked}
            onClick={onCreateRetroClick}
          >
            <div className={"flex flex-col items-start gap-1 w-full"}>
              Rozpocznij retrospektywę
            </div>
            <Share2Icon className={"size-6"} />
          </Button>
          <span className={"text-sm mx-auto"}>
            (link zostanie skopiowany do schowka)
          </span>
        </div>
      </div>
    </>
  );
};
