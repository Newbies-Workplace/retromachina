import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs));
};

export const debounced = (fn: () => void, delay: number) => {
  let timer: number;
  return () => {
    clearTimeout(timer);
    timer = window.setTimeout(() => {
      fn();
    }, delay);
  };
};

export const randomInteger = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
