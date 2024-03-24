import { motion } from "framer-motion";
import type React from "react";
import { Portal } from "react-portal";

interface BackdropProps {
  onDismiss?: () => void;
  children: React.ReactNode;
}

export const Backdrop: React.FC<BackdropProps> = ({
  children,
  onDismiss = () => {},
}) => {
  return (
    <Portal>
      <motion.div
        initial={{ backgroundColor: "#00000000" }}
        animate={{ backgroundColor: "#00000045" }}
        exit={{ backgroundColor: "#00000000" }}
        transition={{ duration: 0.15 }}
        className={
          "absolute z-10 top-0 flex justify-center items-center h-screen w-screen bg-black"
        }
        onClick={onDismiss}
      >
        {children}
      </motion.div>
    </Portal>
  );
};
