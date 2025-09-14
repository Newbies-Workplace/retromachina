import { useContext } from "react";
import { BoardContext } from "@/context/board/BoardContext";

export const useBoard = () => {
  return useContext(BoardContext);
};
