import React from "react";
import { cn } from "../../../common/Util";
import styles from "./AnimatedBackground.module.scss";

interface AnimatedBackgroundProps {
  children: React.ReactNode;
  className?: string;
}

export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({
  children,
  className,
}) => {
  return <div className={cn(styles.container, className)}>{children}</div>;
};
