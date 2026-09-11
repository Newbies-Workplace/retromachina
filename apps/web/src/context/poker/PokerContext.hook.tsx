import { useContext } from "react";
import { PokerContext } from "@/context/poker/PokerContext";

export const usePoker = () => useContext(PokerContext);
