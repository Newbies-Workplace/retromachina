import { reorder } from "@atlaskit/pragmatic-drag-and-drop/reorder";
import { PlusIcon, SaveIcon } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router";
import { toast } from "react-toastify";
import type { BoardResponse } from "shared/model/board/board.response";
import type { BoardColumnDto } from "shared/model/board/editBoard.dto";
import { v4 as uuidv4 } from "uuid";
import { editBoard, getBoard } from "@/api/Board.service";
import { Button } from "@/components/atoms/button/Button";
import { BoardCreator } from "@/components/molecules/board_creator/BoardCreator";
import { BoardCreatorColumn } from "@/components/molecules/board_creator/BoardCreatorColumn";
import Navbar from "@/components/organisms/navbar/Navbar";

const MAX_COLUMNS = 6;

export const TeamBoardEditView: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const [board, setBoard] = useState<BoardResponse>();

  useEffect(() => {
    if (!teamId) return;

    getBoard(teamId).then((board) => setBoard(board));
  }, [teamId]);

  if (!teamId) {
    return <Navigate to={"/"} />;
  }

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
      color: "#ffffff",
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

      <div className={"m-4 flex rounded-xl bg-background-500 p-2"}>
        <div className={"flex w-full flex-col gap-2 rounded-lg p-2"}>
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

          <BoardCreator
            onColumnReorder={({ fromId, toId }) => {
              const columns = board?.columns ?? [];
              const fromIndex = columns.findIndex((c) => c.id === fromId);
              const toIndex = columns.findIndex((c) => c.id === toId);
              if (fromIndex === -1 || toIndex === -1) return;
              if (fromIndex === toIndex) return;

              const reorderedColumns = reorder({
                list: columns,
                startIndex: fromIndex,
                finishIndex: toIndex,
              }).map((column, i) => ({
                ...column,
                order: i,
              }));

              setBoard({
                ...board,
                columns: reorderedColumns,
              });
            }}
          >
            {board.columns
              .sort((a, b) => a.order - b.order)
              .map((col, index) => (
                <BoardCreatorColumn
                  id={col.id}
                  key={col.id}
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
                      order: col.order,
                    })
                  }
                  onDelete={() => onDeleteColumn(col.id)}
                />
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
