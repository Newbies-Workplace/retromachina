import type React from "react";
import { useNavigate } from "react-router";
import CreateTeamSvg from "../../assets/icons/create-team.svg";
import NotFoundSvg from "../../assets/images/not-found.svg";
import { Button } from "../../component/atoms/button/Button";
import { TeamCard } from "../../component/molecules/team_retro_list/TeamCard";
import { AnimatedBackground } from "../../component/organisms/animated_background/AnimatedBackground";
import Navbar from "../../component/organisms/navbar/Navbar";
import { useUser } from "../../context/user/UserContext.hook";

export const HomeView: React.FC = () => {
  const { user } = useUser();
  const navigate = useNavigate();

  return (
    <>
      <Navbar />
      <AnimatedBackground>
        {user?.teams?.length === 0 && (
          <div
            className={
              "flex flex-col grow items-center justify-center gap-4 m-8"
            }
          >
            <NotFoundSvg />

            <div className={"flex flex-col justify-center items-center gap-4"}>
              <span className={"text-xl font-bold"}>
                Nie jesteś członkiem żadnego Zespołu!
              </span>
              <span>
                Stwórz nowy zespół lub poczekaj na zaproszenie od innego członka
                retromachiny!
              </span>

              <Button onClick={() => navigate("/team/create")}>
                <CreateTeamSvg />
                Stwórz Zespół
              </Button>
            </div>
          </div>
        )}

        <div className={"flex flex-col gap-6 m-8"}>
          {user?.teams?.map((team) => (
            <TeamCard key={team.id} teamId={team.id} teamName={team.name} />
          ))}
        </div>
      </AnimatedBackground>
    </>
  );
};
