import { useContext } from "react";
import { PokerContext } from "@/context/poker/PokerContext.context";

export const usePoker = () => useContext(PokerContext);
