import {Board} from "./Board.interface";
import {axiosInstance} from "../AxiosInstance";

export const editBoard = async (teamId: string, board: Board) => {
    return axiosInstance.put(`teams/${teamId}/board`, board)
}

export const getBoard = async (teamId: string): Promise<Board> => {
    return axiosInstance.get<Board>(`teams/${teamId}/board`)
        .then(res => res.data)
}