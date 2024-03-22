import {
  PlusIcon,
  TrackNextIcon,
  TrackPreviousIcon,
} from "@radix-ui/react-icons";
import type React from "react";
import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router";
import { toast } from "react-toastify";
import type { BoardResponse } from "shared/model/board/board.response";
import type { BoardColumnDto } from "shared/model/board/editBoard.dto";
import { v4 as uuidv4 } from "uuid";
import { editBoard, getBoard } from "../../api/Board.service";
import { getRandomColor } from "../../common/Util";
import { Button } from "../../component/atoms/button/Button";
import { ColumnCreate } from "../../component/molecules/column_create/ColumnCreate";
import Navbar from "../../component/organisms/navbar/Navbar";
import styles from "./TeamBoardEditView.module.scss";

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
      <Navbar
        topContent={
          <Button size={"sm"} onClick={saveBoard}>
            Zapisz
          </Button>
        }
      />

      <div className={styles.container}>
        <div className={styles.columns}>
          {board.columns
            .sort((a, b) => a.order - b.order)
            .map((col, index) => (
              <div key={col.id}>
                <ColumnCreate
                  color={col.color}
                  name={col.name}
                  desc={""}
                  onChange={({ color, name }) =>
                    onChangeColumn(col.id, {
                      id: col.id,
                      name: name,
                      color: color,
                      order: index,
                    })
                  }
                  onDelete={() => onDeleteColumn(col.id)}
                />

                <div className={styles.columnAction}>
                  {index !== 0 && (
                    <Button
                      size={"icon"}
                      onClick={() => onChangeOrder(index, "prev")}
                    >
                      <TrackPreviousIcon className={"size-4"} />
                    </Button>
                  )}

                  {index !== board.columns.length - 1 && (
                    <Button
                      size={"icon"}
                      onClick={() => onChangeOrder(index, "next")}
                    >
                      <TrackNextIcon className={"size-4"} />
                    </Button>
                  )}

                  <div onClick={() => onChangeDefaultColumn(col.id)}>
                    <input
                      type={"radio"}
                      name={"default"}
                      value={col.id}
                      checked={board.defaultColumnId === col.id}
                    />
                    <span>Domyślna</span>
                  </div>
                </div>
              </div>
            ))}

          <Button
            className={"mr-4"}
            disabled={board.columns.length >= MAX_COLUMNS}
            onClick={onAddColumn}
          >
            <PlusIcon className={"size-6"} />
            Nowa Kolumna
          </Button>
        </div>
      </div>
    </>
  );
};
