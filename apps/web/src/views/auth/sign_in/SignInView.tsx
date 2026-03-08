import type React from "react";
import GoogleButton from "react-google-button";
import { Navigate } from "react-router";
import { AnimatedBackground } from "@/components/organisms/animated_background/AnimatedBackground";
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
          "flex flex-col justify-center items-center gap-35 max-w-175 px-20 py-30 rounded-2xl bg-card"
        }
      >
        <div
          className={"w-full flex flex-col justify-center items-center gap-2"}
        >
          <span className={"font-harlow-solid-italic text-5xl select-none"}>
            Retromachina
          </span>

          <span className={"text-md"}>
            powered by{" "}
            <a href="https://newbies.pl" className={"underline text-md"}>
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

          <span className={"text-sm"}>
            Korzystając z Retromachiny akceptujesz
            <br />
            <a href={"/privacy"} className={"underline text-sm"}>
              politykę prywatności
            </a>
          </span>
        </div>
      </div>
    </AnimatedBackground>
  );
};
