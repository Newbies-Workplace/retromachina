import React, {createContext, useEffect, useRef, useState} from "react";
import io, {Socket} from "socket.io-client";
import {TaskCreatedEvent, TaskDeletedEvent, TaskUpdatedEvent} from "../../api/board/Board.events";
import {Board} from "../../api/board/Board.interface";
import {getBoard} from "../../api/board/Board.service";
import {getUsersByTeamId} from "../../api/user/User.service";
import {UserResponse} from "../../api/user/User.interfaces";
import {TaskCreateCommand, TaskDeleteCommand, TaskUpdateCommand} from "../../api/board/Board.commands";
import {TeamResponse} from "../../api/team/Team.interface";
import {getTeamById} from "../../api/team/Team.service";
import {toast} from "react-toastify";

interface BoardContextParams {
    teamId: string
}

interface BoardContext {
    teamId: string
    board: Board | null
    team: TeamResponse | null
    teamUsers: UserResponse[]
    moveTask: (taskId: string, targetColumnId: string) => void
    createTask: (taskId: string, text: string, ownerId: string, columnId: string) => void
    updateTask: (taskId: string, newOwnerId: string, text: string) => void
    deleteTask: (taskId: string) => void
}

export const BoardContext = createContext<BoardContext>({
    teamId: '',
    board: null,
    team: null,
    teamUsers: [],
    moveTask: () => {},
    createTask: () => {},
    updateTask: () => {},
    deleteTask: () => {},
})

export const BoardContextProvider: React.FC<React.PropsWithChildren<BoardContextParams>> = (
    {
        children,
        teamId,
    }
) => {
    const socket = useRef<Socket>()
    const [board, setBoard] = useState<Board | null>(null)
    const [team, setTeam] = useState<TeamResponse | null>(null)
    const [teamUsers, setTeamUsers] = useState<UserResponse[]>([])

    useEffect(() => {
        getBoard(teamId)
            .then(board => setBoard(board))

        getTeamById(teamId)
            .then(team => setTeam(team))

        getUsersByTeamId(teamId)
            .then((users) => setTeamUsers(users))
            .catch(console.log);
    }, [teamId])

    useEffect(() => {
        const createdSocket = io(
            `${process.env.RETRO_SOCKET_URL}/board`,
            {
                query: {
                    team_id: teamId,
                },
                extraHeaders: {
                    //@ts-ignore
                    Authorization: window.localStorage.getItem("Bearer"),
                },
            }
        );
        socket.current = createdSocket;

        createdSocket.on("task_created_event", (event: TaskCreatedEvent) => {
            setBoard((board) => board
                ? {
                    ...board,
                    tasks: [
                        ...board.tasks,
                        {
                            id: event.taskId,
                            columnId: event.columnId,
                            ownerId: event.ownerId,
                            text: event.text,
                        }
                    ]
                }
                : null
            )
        })

        createdSocket.on("task_updated_event", (event: TaskUpdatedEvent) => {
            setBoard((board) => board
                ? {
                    ...board,
                    tasks: board.tasks.map((task) => {
                        if (task.id === event.taskId) {
                            task.columnId = event.columnId
                            task.ownerId = event.ownerId
                            task.text = event.text
                        }

                        return task
                    })
                }
                : null
            )
        })

        createdSocket.on("task_deleted_event", (event: TaskDeletedEvent) => {
            setBoard((board) => board
                ? {
                    ...board,
                    tasks: board.tasks.filter(task => task.id !== event.taskId)
                }
                : null
            )
        })

        createdSocket.on("error", (e) => {
            console.log(e)
            toast.error('Wystąpił błąd')
        });

        return () => {
            createdSocket.removeAllListeners()
            createdSocket.disconnect()
        }
    }, [])

    const moveTask = (taskId: string, targetColumnId: string) => {
        const command: TaskUpdateCommand = {
            taskId: taskId,
            columnId: targetColumnId,
        }

        socket.current?.emit("command_update_task", command)
    }

    const createTask = (taskId: string, text: string, ownerId: string, columnId: string) => {
        const command: TaskCreateCommand = {
            taskId: taskId,
            ownerId: ownerId,
            text: text,
            columnId: columnId,
        }

        socket.current?.emit("command_create_task", command)
    }

    const updateTask = (taskId: string, newOwnerId: string, text: string) => {
        const command: TaskUpdateCommand = {
            taskId: taskId,
            ownerId: newOwnerId,
            text: text,
        }

        const task = board?.tasks.find(task => task.id === taskId)
        if (task) {
            task.ownerId = newOwnerId
            task.text = text
        }

        socket.current?.emit("command_update_task", command)
    }

    const deleteTask = (taskId: string) => {
        const command: TaskDeleteCommand = {
            taskId: taskId
        }

        socket.current?.emit("command_delete_task", command)
    }

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
    )
}