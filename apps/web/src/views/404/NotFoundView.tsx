import type React from "react";
import { useNavigate } from "react-router";
import NotFoundSvg from "../../assets/images/not-found.svg";
import { Button } from "../../component/atoms/button/Button";
import Navbar from "../../component/organisms/navbar/Navbar";

export const NotFoundView: React.FC = () => {
  const navigate = useNavigate();

  return (
    <>
      <Navbar />

      <div className={"flex flex-col justify-center items-center gap-4 h-full"}>
        <NotFoundSvg />

        <div className={"flex flex-col items-center"}>
          <span className={"text-xl font-bold"}>404</span>
          <span>Strony nie znaleziono</span>
        </div>

        <Button onClick={() => navigate("/")}>Powrót na stronę główną</Button>
      </div>
    </>
  );
};
