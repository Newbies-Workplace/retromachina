import {useContext} from "react";
import {BoardContext} from "./BoardContext";

export const useBoard = () => {
    return useContext(BoardContext)
}