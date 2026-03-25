import { useContext } from "react";
import { GramophoneContext } from "@/context/gramophone/GramophoneContext";

export const useGramophone = () => {
  return useContext(GramophoneContext);
};
