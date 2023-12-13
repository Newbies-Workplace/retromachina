import React from "react";
import styles from "./Button.module.scss";
import cs from "classnames";

interface ButtonProps {
    onClick?: () => void;
    className?: string;
    size?: "medium" | "small" | "big" | "round";
    disabled?: boolean;
    style?: React.CSSProperties
}

export const Button: React.FC<React.PropsWithChildren<ButtonProps>> = (
    {
        children,
        onClick,
        size = "medium",
        className,
        disabled = false,
        style
    }
) => {
    return (
        <button
            onClick={onClick}
            disabled = {disabled}
            style={{...style}}
            className={cs(
                styles.button,
                {
                    [styles.disabled]: disabled,
                    [styles.small]: size === "small",
                    [styles.medium]: size === "medium",
                    [styles.big]: size === "big",
                    [styles.round]: size === "round",
                },
                className
            )}
        >
            {children}
        </button>
    );
};