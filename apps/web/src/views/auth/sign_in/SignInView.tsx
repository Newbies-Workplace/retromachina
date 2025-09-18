import type React from "react";
import GoogleButton from "react-google-button";
import { Navigate } from "react-router";
import { AnimatedBackground } from "@/component/organisms/animated_background/AnimatedBackground";
import { useUser } from "@/context/user/UserContext.hook";

export const SignInView: React.FC = () => {
  const href = `${process.env.RETRO_WEB_API_URL}google/redirect`;
  const { user } = useUser();

  if (user) {
    return <Navigate to={"/"} />;
  }

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

          <span className={"text-md text-background-50"}>
            powered by{" "}
            <a
              href="https://newbies.pl"
              className={"underline text-md text-background-500"}
            >
              Newbies
            </a>
          </span>
        </div>

        <div
          className={
            "flex flex-col justify-center items-center gap-5 text-center"
          }
        >
          <a href={href} className={"rounded-full overflow-hidden shadow-lg"}>
            <GoogleButton type={"light"} />
          </a>

          <span className={"text-sm text-background-50"}>
            Korzystając z Retromachiny akceptujesz
            <br />
            <a
              href={"/privacy"}
              className={"underline text-sm text-background-500"}
            >
              politykę prywatności
            </a>
          </span>
        </div>
      </div>
    </AnimatedBackground>
  );
};
