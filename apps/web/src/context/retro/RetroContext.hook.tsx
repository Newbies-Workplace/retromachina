import { useContext } from "react";
import { RetroContext } from "@/context/retro/RetroContext";

export const useRetro = () => {
  return useContext(RetroContext);
};
