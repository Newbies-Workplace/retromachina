import {useContext} from "react"
import {RetroContext} from "./RetroContext";

export const useRetro = () => {
    return useContext(RetroContext)
}
