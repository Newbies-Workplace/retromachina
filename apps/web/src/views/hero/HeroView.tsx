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
    <div className={"flex flex-col w-full bg-secondary-500 scrollbar"}>
      <div className={"flex flex-row items-center w-full px-8 py-4"}>
        <div className={"flex flex-col w-full"}>
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
        <Button onClick={onJoinClick}>Dołącz</Button>
      </div>

      <div
        className={
          "flex flex-col gap-12 p-8 w-full bg-background-50 rounded-t-2xl"
        }
      >
        {/* first section */}
        <div
          className={
            "flex flex-1 flex-col xl:flex-row justify-center items-center gap-4 xl:gap-8 w-full"
          }
        >
          <div
            className={
              "flex xl:flex-1 w-full h-[500px] bg-secondary-500 rounded-2xl p-2"
            }
          >
            <img
              src={RetroImage}
              alt="Retrospektywa przeprawadzana na retromachinie"
              className={
                "w-full h-full rounded-xl object-cover object-left-top"
              }
            />
          </div>

          <div
            className={
              "flex xl:flex-1 flex-col gap-2 justify-center items-center"
            }
          >
            <b className={"text-lg block"}>
              Wyciśnij z retrospektyw tyle, ile się da!
            </b>
            <p>
              Czujesz oddech agile-manifesto na swojej szyi? Retromachina pomoże
              Ci w przeprowadzaniu retrospektyw w sposób zorganizowany i
              efektywny. Wszystko po to, abyś mógł skupić się na doskonaleniu
              swojego zespołu i sposobu pracy.
            </p>
          </div>
        </div>

        {/* second section */}
        <div
          className={
            "flex flex-1 flex-col-reverse xl:flex-row justify-center items-center gap-4 xl:gap-8 w-full"
          }
        >
          <div
            className={
              "flex xl:flex-1 flex-col gap-2 justify-center items-center"
            }
          >
            <b className={"text-lg block"}>Śledź zadania zespołu</b>
            <p>
              Action Pointy, które zostały ustalone podczas retrospektywy nie
              przepadają w czeluściach slacka. Dzięki Retromachinie możesz
              śledzić postęp w ich realizacji.
            </p>
          </div>

          <KanbanBoard />
        </div>

        {/* third section */}
        <div
          className={
            "flex flex-1 flex-col xl:flex-row justify-center items-center gap-4 xl:gap-8 w-full"
          }
        >
          <div
            className={
              "flex xl:flex-1 w-full h-[500px] bg-secondary-500 rounded-2xl p-2"
            }
          >
            <img
              src={TeamsImage}
              alt="Lista zespołów wraz z informacjami o przeprowadzonych retrospektywach"
              className={
                "w-full h-full rounded-xl object-cover object-left-top"
              }
            />
          </div>

          <div
            className={
              "flex xl:flex-1 flex-col gap-2 justify-center items-center"
            }
          >
            <b className={"text-lg block"}>
              Zarządzaj wieloma zespołami jednocześnie!
            </b>
            <p>
              Niezależnie od tego czy pracujesz w jednym zespole czy w{" "}
              <b className={"text-lg tracking-widest"}>wielkiej</b> organizacji,
              Retromachina pozwoli Ci na zarządzanie zespołami w prosty i
              przejrzysty sposób.
            </p>
          </div>
        </div>

        {/* footer */}
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
