import React from "react";
import styles from "./Backdrop.module.scss"
import {Portal} from "react-portal";

interface BackdropProps {
    onDismiss?: () => void
    children: React.ReactNode
}

export const Backdrop: React.FC<BackdropProps> = (
    {
        children,
        onDismiss = () => {},
    }
) => {
    return (
        <Portal>
            <div className={styles.backdrop} onClick={onDismiss}>
                {children}
            </div>
        </Portal>
    )
}