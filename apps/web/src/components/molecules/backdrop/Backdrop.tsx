import { domAnimation, LazyMotion, m } from "motion/react";
import type React from "react";
import { Portal } from "react-portal";

interface BackdropProps {
  onDismiss?: () => void;
  hasDarkBackground?: boolean;
  children: React.ReactNode;
}

export const Backdrop: React.FC<BackdropProps> = ({
  children,
  hasDarkBackground = true,
  onDismiss = () => {},
}) => {
  return (
    <Portal>
      <LazyMotion features={domAnimation}>
        <m.div
          initial={{ backgroundColor: "#00000000", opacity: 0 }}
          animate={{
            backgroundColor: hasDarkBackground ? "#00000045" : "#00000000",
            opacity: 1,
          }}
          exit={{ backgroundColor: "#00000000", opacity: 0 }}
          transition={{ duration: 0.15 }}
          className={
            "absolute z-10 top-0 flex justify-center items-center h-screen w-screen bg-black"
          }
          onClick={onDismiss}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              onDismiss();
            }
          }}
          role="button"
          tabIndex={0}
        >
          {children}
        </m.div>
      </LazyMotion>
    </Portal>
  );
};
