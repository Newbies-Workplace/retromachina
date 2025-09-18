import { useContext } from "react";
import { ConfirmContext } from "@/context/confirm/ConfirmContext";

export const useConfirm = () => useContext(ConfirmContext);
