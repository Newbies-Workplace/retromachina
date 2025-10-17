import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import {cn} from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex gap-2 items-center justify-center whitespace-nowrap text-sm font-medium transition shadow-[0_4px_0_rgba(0,0,0,0.25)] hover:translate-y-1 hover:shadow-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:bg-[#c2c2c2] overflow-hidden cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-primary-500 text-black",
        destructive: "bg-red-500 text-black",
      },
      size: {
        xs: "h-6 rounded-md px-3 text-xs",
        sm: "h-8 rounded-md px-3 text-xs",
        md: "h-9 rounded-md px-4 py-2",
        lg: "h-10 rounded-md px-8",
        xl: "min-w-32 px-8 py-4 rounded-lg text-lg",
        "2xl": "min-w-[250px] px-[42px] py-[25px] rounded-lg text-xl",
        icon: "min-w-8 min-h-8 size-8 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
