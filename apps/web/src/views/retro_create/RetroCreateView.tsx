import { PlusIcon, Share1Icon } from "@radix-ui/react-icons";
import * as qs from "query-string";
import type React from "react";
import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router";
import { toast } from "react-toastify";
import type { RetroCreateRequest } from "shared/model/retro/retro.request";
import { v4 as uuidv4 } from "uuid";
import { createRetro } from "../../api/Retro.service";
import { getRandomTemplate } from "../../api/RetroTemplate.service";
import { getRandomColor } from "../../common/Util";
import { Button } from "../../component/atoms/button/Button";
import { ProgressBar } from "../../component/atoms/progress_bar/ProgressBar";
import { ColumnCreate } from "../../component/molecules/column_create/ColumnCreate";
import Navbar from "../../component/organisms/navbar/Navbar";

export interface Column {
  id: string;
  color: string;
  name: string;
  desc: string | null;
}

interface RawColumn {
  color: string;
  name: string;
  desc: string | null;
}

const MAX_COLUMNS = 6;

export const RetroCreateView: React.FC = () => {
  const [clicked, setClicked] = useState(false);
  const params = qs.parse(location.search);
  const teamId: string = params.teamId as string;
  if (!teamId) {
    return <Navigate to={"/"} />;
  }

  const [columns, setColumns] = useState<Array<Column>>([]);
  const [templateId, setTemplateId] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    randomizeTemplate();
  }, []);

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

    const columnsTemp = Array<Column>();

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

  return (
    <>
      <Navbar
        topContent={
          <Button
            data-testid={"randomize-template"}
            size={"sm"}
            onClick={() => randomizeTemplate()}
          >
            Losuj szablon
          </Button>
        }
      />

      <div className={"flex grow scrollbar"}>
        <div className={"flex items-start gap-4 mt-4 ml-3"}>
          {columns.map((column) => (
            <ColumnCreate
              key={column.id}
              onChange={({ color, name, desc }) =>
                onChangeColumn(column.id, { color, name, desc })
              }
              onDelete={() => onDeleteColumn(column.id)}
              color={column.color}
              name={column.name}
              desc={column.desc ?? ""}
              withDescription
            />
          ))}

          <div className={"pr-4"}>
            <Button
              disabled={columns.length >= MAX_COLUMNS}
              size="xl"
              onClick={onAddColumn}
            >
              <PlusIcon className={"size-6"} />
              Nowa kolumna
            </Button>
          </div>
        </div>

        <div className={"fixed bottom-5 flex justify-center w-full"}>
          <Button
            data-testid={"create-retro"}
            size={"xl"}
            className={"min-w-[600px]"}
            onClick={onCreateRetroClick}
          >
            <div className={"flex flex-col items-start gap-1 w-full"}>
              <span className={"font-bold"}>Akcja!</span>
              (Zacznij & skopiuj link)
            </div>
            {clicked ? (
              <ProgressBar color="black" />
            ) : (
              <Share1Icon className={"size-8"} />
            )}
          </Button>
        </div>
      </div>
    </>
  );
};
