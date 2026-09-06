import { AnimatePresence, domAnimation, LazyMotion } from "motion/react";
import { createContext, FC, ReactNode, useState } from "react";
import {
  ConfirmDialog,
  ConfirmDialogProps,
} from "@/components/molecules/confirm_dialog/ConfirmDialog";

interface ConfirmContext {
  showConfirm: (props: ConfirmDialogProps) => void;
}

export const ConfirmContext = createContext<ConfirmContext>({
  showConfirm: () => {},
});

export const ConfirmProvider: FC<{ children?: ReactNode | undefined }> = (
  props,
) => {
  const [confirmProps, setConfirmProps] = useState<ConfirmDialogProps>();

  const showConfirm = (props: ConfirmDialogProps) => {
    setConfirmProps(props);
  };

  return (
    <ConfirmContext.Provider value={{ showConfirm }}>
      {props.children}
      <LazyMotion features={domAnimation}>
        <AnimatePresence>
          {confirmProps && (
            <ConfirmDialog
              {...confirmProps}
              onConfirmed={() => {
                confirmProps.onConfirmed?.();
                setConfirmProps(undefined);
              }}
              onDismiss={() => {
                confirmProps.onDismiss?.();
                setConfirmProps(undefined);
              }}
            />
          )}
        </AnimatePresence>
      </LazyMotion>
    </ConfirmContext.Provider>
  );
};
