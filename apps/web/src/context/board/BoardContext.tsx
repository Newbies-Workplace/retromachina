import type React from "react";
import { createContext, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import type {
  TaskCreateCommand,
  TaskDeleteCommand,
  TaskUpdateCommand,
} from "shared/model/board/board.commands";
import type {
  TaskCreatedEvent,
  TaskDeletedEvent,
  TaskUpdatedEvent,
} from "shared/model/board/board.events";
import type { BoardResponse } from "shared/model/board/board.response";
import type { TeamResponse } from "shared/model/team/team.response";
import type { UserResponse } from "shared/model/user/user.response";
import io, { type Socket } from "socket.io-client";
import { getBoard } from "../../api/Board.service";
import { getTeamById } from "../../api/Team.service";
import { getUsersByTeamId } from "../../api/User.service";

interface BoardContextParams {
  teamId: string;
}

interface BoardContext {
  teamId: string;
  board: BoardResponse | null;
  team: TeamResponse | null;
  teamUsers: UserResponse[];
  moveTask: (taskId: string, targetColumnId: string) => void;
  createTask: (
    taskId: string,
    text: string,
    ownerId: string | null,
    columnId: string,
  ) => void;
  updateTask: (taskId: string, newOwnerId: string | null, text: string) => void;
  deleteTask: (taskId: string) => void;
}

export const BoardContext = createContext<BoardContext>({
  teamId: "",
  board: null,
  team: null,
  teamUsers: [],
  moveTask: () => {},
  createTask: () => {},
  updateTask: () => {},
  deleteTask: () => {},
});

export const BoardContextProvider: React.FC<
  React.PropsWithChildren<BoardContextParams>
> = ({ children, teamId }) => {
  const socket = useRef<Socket>();
  const [board, setBoard] = useState<BoardResponse | null>(null);
  const [team, setTeam] = useState<TeamResponse | null>(null);
  const [teamUsers, setTeamUsers] = useState<UserResponse[]>([]);

  useEffect(() => {
    getBoard(teamId).then((board) => setBoard(board));

    getTeamById(teamId).then((team) => setTeam(team));

    getUsersByTeamId(teamId)
      .then((users) => setTeamUsers(users))
      .catch(console.log);
  }, [teamId]);

  useEffect(() => {
    const createdSocket = io(`${process.env.RETRO_WEB_SOCKET_URL}/board`, {
      query: {
        team_id: teamId,
      },
      extraHeaders: {
        //@ts-ignore
        Authorization: window.localStorage.getItem("Bearer"),
      },
      reconnection: true,
      reconnectionAttempts: Number.POSITIVE_INFINITY,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 8000,
      randomizationFactor: 0.5,
    });
    socket.current = createdSocket;

    createdSocket.on("task_created_event", (event: TaskCreatedEvent) => {
      setBoard((board) =>
        board
          ? {
              ...board,
              tasks: [
                ...board.tasks,
                {
                  id: event.taskId,
                  columnId: event.columnId,
                  ownerId: event.ownerId,
                  text: event.text,
                  createdAt: event.createdAt,
                  updatedAt: event.updatedAt,
                },
              ],
            }
          : null,
      );
    });

    createdSocket.on("task_updated_event", (event: TaskUpdatedEvent) => {
      setBoard((board) =>
        board
          ? {
              ...board,
              tasks: board.tasks.map((task) => {
                if (task.id === event.taskId) {
                  task.columnId = event.columnId;
                  task.ownerId = event.ownerId;
                  task.text = event.text;
                  task.createdAt = event.createdAt;
                  task.updatedAt = event.updatedAt;
                }

                return task;
              }),
            }
          : null,
      );
    });

    createdSocket.on("task_deleted_event", (event: TaskDeletedEvent) => {
      setBoard((board) =>
        board
          ? {
              ...board,
              tasks: board.tasks.filter((task) => task.id !== event.taskId),
            }
          : null,
      );
    });

    createdSocket.on("error", (e) => {
      console.log(e);
      toast.error("Wystąpił błąd");
    });

    return () => {
      createdSocket.removeAllListeners();
      createdSocket.disconnect();
    };
  }, []);

  const moveTask = (taskId: string, targetColumnId: string) => {
    const command: TaskUpdateCommand = {
      taskId: taskId,
      columnId: targetColumnId,
    };

    socket.current?.emit("command_update_task", command);
  };

  const createTask = (
    taskId: string,
    text: string,
    ownerId: string | null,
    columnId: string,
  ) => {
    const command: TaskCreateCommand = {
      taskId: taskId,
      ownerId: ownerId,
      text: text,
      columnId: columnId,
    };

    socket.current?.emit("command_create_task", command);
  };

  const updateTask = (
    taskId: string,
    newOwnerId: string | null,
    text: string,
  ) => {
    const command: TaskUpdateCommand = {
      taskId: taskId,
      ownerId: newOwnerId,
      text: text,
    };

    const task = board?.tasks.find((task) => task.id === taskId);
    if (task) {
      task.ownerId = newOwnerId;
      task.text = text;
    }

    socket.current?.emit("command_update_task", command);
  };

  const deleteTask = (taskId: string) => {
    const command: TaskDeleteCommand = {
      taskId: taskId,
    };

    socket.current?.emit("command_delete_task", command);
  };

  return (
    <BoardContext.Provider
      value={{
        teamId: teamId,
        board: board,
        team: team,
        teamUsers: teamUsers,
        moveTask: moveTask,
        createTask: createTask,
        updateTask: updateTask,
        deleteTask: deleteTask,
      }}
    >
      {children}
    </BoardContext.Provider>
  );
};
