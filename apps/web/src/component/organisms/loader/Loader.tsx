import React from "react";
import { ProgressBar } from "../../atoms/progress_bar/ProgressBar";
import { AnimatedBackground } from "../animated_background/AnimatedBackground";

export const Loader = () => {
  return (
    <AnimatedBackground className={"items-center"}>
      <div
        className={
          "flex flex-col justify-center items-center gap-[140px] max-w-[700px] max-h-[400px] px-20 py-[120px] rounded-2xl text-background-500 bg-secondary-500"
        }
      >
        <div
          className={"w-full flex flex-col justify-center items-center gap-2"}
        >
          <span
            className={
              "font-harlow-solid-italic text-5xl text-background-50 select-none"
            }
          >
            Retromachina
          </span>

          <span className={"text-md  text-background-50"}>
            powered by{" "}
            <a
              href="https://newbies.pl"
              className={"underline text-md text-background-500"}
            >
              Newbies
            </a>
          </span>
        </div>

        <ProgressBar />
      </div>
    </AnimatedBackground>
  );
};
