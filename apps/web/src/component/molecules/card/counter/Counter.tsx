import { MinusIcon, PlusIcon } from "lucide-react";
import type React from "react";
import { cn } from "@/common/Util";

interface CounterProps {
  className?: string;
  canIncrement: boolean;
  count: number;
  onIncrement(): void;
  onDecrement(): void;
}

const Counter: React.FC<CounterProps> = ({
  count,
  canIncrement,
  onIncrement,
  onDecrement,
  className,
}) => {
  const onMinusClick = () => {
    if (count > 0) {
      onDecrement();
    }
  };

  const onPlusClick = () => {
    if (canIncrement) {
      onIncrement();
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2",
        className,
      )}
    >
      <MinusIcon
        onClick={onMinusClick}
        className={cn("cursor-pointer size-8", {
          "*:fill-[#888888]": count <= 0,
        })}
      />

      <span
        className={cn("flex justify-center items-center size-8 rounded-full", {
          "bg-primary-500": count > 0,
        })}
      >
        {count}
      </span>

      <PlusIcon
        onClick={onPlusClick}
        className={cn("cursor-pointer size-8", {
          "*:fill-[#888888]": !canIncrement,
        })}
      />
    </div>
  );
};
export default Counter;
