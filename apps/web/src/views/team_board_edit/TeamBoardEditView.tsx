import {
  CornerLeftUpIcon,
  PlusIcon,
  SaveIcon,
  SkipBackIcon,
  SkipForwardIcon,
} from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router";
import { toast } from "react-toastify";
import type { BoardResponse } from "shared/model/board/board.response";
import type { BoardColumnDto } from "shared/model/board/editBoard.dto";
import { v4 as uuidv4 } from "uuid";
import { editBoard, getBoard } from "@/api/Board.service";
import { getRandomColor } from "@/common/Util";
import { Button } from "@/component/atoms/button/Button";
import { BoardCreator } from "@/component/molecules/board_creator/BoardCreator";
import { BoardCreatorColumn } from "@/component/molecules/board_creator/BoardCreatorColumn";
import Navbar from "@/component/organisms/navbar/Navbar";

const MAX_COLUMNS = 6;

export const TeamBoardEditView: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const [board, setBoard] = useState<BoardResponse>();
  if (!teamId) {
    return <Navigate to={"/"} />;
  }

  useEffect(() => {
    getBoard(teamId).then((board) => setBoard(board));
  }, [teamId]);

  if (!board) {
    return (
      <div>
        <Navbar />
        loading
      </div>
    );
  }

  const onAddColumn = () => {
    const column: BoardColumnDto = {
      id: uuidv4(),
      color: getRandomColor(),
      name: "",
      order: board.columns.length,
    };

    setBoard({ ...board, columns: [...board.columns, column] });
  };

  const onChangeColumn = (id: string, column: BoardColumnDto) => {
    const columnIndex = board.columns.findIndex((col) => col.id === id);

    const newColumns = [...board.columns];
    newColumns[columnIndex] = column;

    setBoard({ ...board, columns: newColumns });
  };

  const onChangeOrder = (from: number, action: "next" | "prev") => {
    const newColumns = [...board.columns];
    const to = action === "next" ? from + 1 : from - 1;
    const fromIndex = newColumns.findIndex((col) => col.order === from);
    const toIndex = newColumns.findIndex((col) => col.order === to);

    newColumns[fromIndex].order = to;
    newColumns[toIndex].order = from;

    setBoard({ ...board, columns: newColumns });
  };

  const onChangeDefaultColumn = (id: string) => {
    setBoard({ ...board, defaultColumnId: id });
  };

  const onDeleteColumn = (id: string) => {
    if (board.defaultColumnId === id) {
      return;
    }

    const columnIndex = board.columns.findIndex((col) => col.id === id);
    const newColumns = [...board.columns];

    newColumns.splice(columnIndex, 1);

    setBoard({ ...board, columns: newColumns });
  };

  const saveBoard = () => {
    editBoard(teamId, board)
      .then(() => {
        navigate(`/team/${teamId}/board`);
      })
      .then(() => {
        toast.success("Tablicę zapisano");
      })
      .catch((e) => {
        console.log(e);
        toast.error("Wystąpił błąd");
      });
  };

  return (
    <>
      <Navbar />

      <div className={"flex p-2 m-2 bg-background-500 rounded-xl"}>
        <div className={"p-2 w-full rounded-lg bg-card flex flex-col gap-2"}>
          <div className={"flex justify-between"}>
            <span>Edycja tablicy</span>
            <Button
              disabled={board.columns.length >= MAX_COLUMNS}
              onClick={onAddColumn}
            >
              <PlusIcon />
              Nowa Kolumna
            </Button>
          </div>

          <BoardCreator>
            {board.columns
              .sort((a, b) => a.order - b.order)
              .map((col, index) => (
                <div className={"flex flex-col gap-2"} key={col.id}>
                  <BoardCreatorColumn
                    name={col.name}
                    desc={""}
                    className={
                      index === 0 ? "ring-primary-500 ring-2" : undefined
                    }
                    onChange={({ name }) =>
                      onChangeColumn(col.id, {
                        id: col.id,
                        name: name,
                        color: "#ffffff",
                        order: index,
                      })
                    }
                    onDelete={() => onDeleteColumn(col.id)}
                  />
                  {index === 0 && (
                    <div className={"flex flex-row"}>
                      <CornerLeftUpIcon />
                      <span className={"font-bold"}>Domyślna kolumna</span>
                    </div>
                  )}
                </div>
              ))}
          </BoardCreator>

          <Button className={"mt-4"} size={"sm"} onClick={saveBoard}>
            <SaveIcon />
            Zapisz tablicę
          </Button>
        </div>
      </div>
    </>
  );
};
