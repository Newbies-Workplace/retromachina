import { AnimatePresence } from "motion/react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { Portal } from "react-portal";
import { Backdrop } from "@/components/molecules/backdrop/Backdrop";

interface PositioningBackdropProps {
  onDismiss?: () => void;
  visible?: boolean;
  children: React.ReactNode;
}

type Position = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export const PositioningBackdrop: React.FC<PositioningBackdropProps> = ({
  children,
  visible = true,
  onDismiss = () => {},
}) => {
  const boxRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<Position>();

  useEffect(() => {
    window.addEventListener("resize", updateElementPosition);

    return () => {
      window.removeEventListener("resize", updateElementPosition);
    };
  }, []);

  useEffect(() => {
    updateElementPosition();
  }, [visible]);

  const updateElementPosition = () => {
    const ref = boxRef.current;

    if (ref) {
      const viewportOffset = ref.getBoundingClientRect();
      const newPos: Position = {
        x: viewportOffset.left,
        y: viewportOffset.top,
        height: ref.clientHeight,
        width: ref.clientWidth,
      };

      setPos(newPos);
    }
  };

  return (
    <>
      <AnimatePresence>
        {visible && pos && (
          <Portal>
            <Backdrop onDismiss={onDismiss}>
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: "absolute",
                  top: pos.y,
                  left: pos.x,
                  width: pos.width,
                  height: pos.height,
                }}
              >
                {children}
              </div>
            </Backdrop>
          </Portal>
        )}
      </AnimatePresence>

      <div ref={boxRef}>
        {visible && pos ? (
          <div
            style={{
              display: "flex",
              height: pos.height,
            }}
          />
        ) : (
          children
        )}
      </div>
    </>
  );
};
