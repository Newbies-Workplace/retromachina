import type React from "react";

interface ProgressBarProps {
  color?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  color = "white",
}) => {
  return (
    <div className={"flex justify-center items-center"}>
      <div className={"size-[80px]"}>
        <div
          className="absolute animate-spin rounded-full h-20 w-20 border-4 bg-transparent"
          style={{
            borderColor: color,
            borderBottomColor: "transparent",
            animationDuration: "1.2s",
          }}
        />
      </div>
    </div>
  );
};
