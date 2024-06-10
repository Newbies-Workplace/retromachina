import React from "react";
import { ProgressBar } from "../../atoms/progress_bar/ProgressBar";
import { AnimatedBackground } from "../animated_background/AnimatedBackground";
import styles from "./LoadingView.module.scss";

export const Loader = () => {
  return (
    <AnimatedBackground className={"items-center"}>
      <div className={styles.dialog}>
        <div className={styles.text}>
          <span
            className={
              "font-harlow-solid-italic text-5xl text-background-50 cursor-pointer"
            }
          >
            Retromachina
          </span>

          <span>
            powered by{" "}
            <a href="http://newbies.pl" className={"underline"}>
              Newbies
            </a>
          </span>
        </div>

        <ProgressBar />
      </div>
    </AnimatedBackground>
  );
};
