import type { BoardResponse } from "shared/model/board/board.response";
import { axiosInstance } from "@/api/AxiosInstance";

const editBoard = async (teamId: string, board: BoardResponse) => {
  return axiosInstance.put(`teams/${teamId}/board`, board);
};

const getBoard = async (teamId: string): Promise<BoardResponse> => {
  return axiosInstance
    .get<BoardResponse>(`teams/${teamId}/board`)
    .then((res) => res.data);
};

export const BoardService = {
  editBoard,
  getBoard,
};
