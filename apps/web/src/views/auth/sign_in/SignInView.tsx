import type React from "react";
import GoogleButton from "react-google-button";
import { AnimatedBackground } from "../../../component/organisms/animated_background/AnimatedBackground";
import styles from "./SignInView.module.scss";

export const SignInView: React.FC = () => {
  const href = `${process.env.RETRO_WEB_API_URL}google/redirect`;

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

        <div className={styles.bottom}>
          <a href={href}>
            <GoogleButton className={styles.googleBtn} />
          </a>

          <span className={styles.privacy}>
            Korzystając z Retromachiny akceptujesz
            <br />
            <a href={"/privacy"} className={"underline"}>
              politykę prywatności
            </a>
          </span>
        </div>
      </div>
    </AnimatedBackground>
  );
};
