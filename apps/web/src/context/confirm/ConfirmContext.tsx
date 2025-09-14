import { AnimatePresence } from "motion/react";
import React, { createContext, FC, ReactNode, useState } from "react";
import {
  ConfirmDialog,
  ConfirmDialogProps,
} from "../../component/molecules/confirm_dialog/ConfirmDialog";

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
    </ConfirmContext.Provider>
  );
};
