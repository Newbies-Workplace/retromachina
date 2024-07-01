import React from "react";
import { useNavigate } from "react-router";
import RetroImage from "../../assets/images/hero_retro.png?url";
import TeamsImage from "../../assets/images/hero_teams.png?url";
import { Button } from "../../component/atoms/button/Button";
import { KanbanBoard } from "./components/KanbanBoard";

export const HeroView: React.FC = () => {
  const navigate = useNavigate();

  const onJoinClick = () => {
    navigate("/signin");
  };

  return (
    <div className={"flex flex-col w-full scrollbar"}>
      <div className={"flex flex-col px-8 py-4 bg-secondary-500"}>
        <span
          className={
            "font-harlow-solid-italic text-5xl text-background-50 select-none"
          }
        >
          Retromachina
        </span>
        <span className={"text-background-50"}>
          Twoje nowe narzędzie do przeprowadzania retrospektyw
        </span>
      </div>

      <div className={"bg-secondary-500 min-h-8 h-8 w-full"}>
        <div className={"bg-background-50 min-h-8 h-4 w-full rounded-t-2xl"} />
      </div>

      <div className={"flex flex-col gap-12 p-8 w-full"}>
        <div className={"flex w-full"}>
          <div
            className={
              "flex flex-1 flex-col justify-center items-center gap-2 max-w-[1000px]"
            }
          >
            <div
              className={"w-full h-[400px] bg-secondary-500 rounded-2xl p-2"}
            >
              <img
                src={RetroImage}
                alt="Retrospektywa przeprawadzana na retromachinie"
                className={
                  "w-full h-full rounded-xl object-cover object-left-top"
                }
              />
            </div>
            <span>Przeprowadzaj retrospektywy</span>
          </div>
          <div className={"mx-auto"} />
        </div>

        <div className={"flex w-full"}>
          <div className={"mx-auto"} />

          <div
            className={
              "flex flex-1 flex-col justify-center items-center gap-2 max-w-[1000px]"
            }
          >
            <KanbanBoard />
            <span>Śledź zadania zespołu</span>
          </div>
        </div>

        <div className={"flex w-full"}>
          <div
            className={
              "flex flex-1 grow flex-col justify-center items-center gap-2 max-w-[1000px] self-start"
            }
          >
            <div
              className={"w-full h-[400px] bg-secondary-500 rounded-2xl p-2"}
            >
              <img
                src={TeamsImage}
                alt="Lista zespołów wraz z informacjami o przeprowadzonych retrospektywach"
                className={
                  "w-full h-full rounded-xl object-cover object-left-top"
                }
              />
            </div>
            <span>Zarządzaj wieloma zespołami jednocześnie!</span>
          </div>
          <div className={"mx-auto"} />
        </div>
        <div className={"flex flex-col items-center w-full gap-2"}>
          <Button size={"xl"} className={"w-full"} onClick={onJoinClick}>
            Dołącz za darmo
          </Button>
          <span>(uczciwa cena)</span>
        </div>
      </div>
    </div>
  );
};
