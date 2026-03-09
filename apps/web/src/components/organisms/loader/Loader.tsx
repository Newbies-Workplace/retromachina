import React from "react";
import { AnimatedBackground } from "@/components/organisms/animated_background/AnimatedBackground";
import { Spinner } from "@/components/ui/spinner";

export const Loader = () => {
  return (
    <AnimatedBackground className={"items-center"}>
      <div
        className={
          "flex flex-col justify-center items-center gap-35 max-w-175 px-20 py-30 rounded-2xl bg-card"
        }
      >
        <div
          className={"w-full flex flex-col justify-center items-center gap-2"}
        >
          <span className={"font-harlow-solid-italic text-5xl select-none"}>
            Retromachine
          </span>

          <span>
            powered by{" "}
            <a href="https://newbies.pl" className={"underline text-md"}>
              Newbies
            </a>
          </span>
        </div>

        <Spinner className={"size-10"} />
      </div>
    </AnimatedBackground>
  );
};
