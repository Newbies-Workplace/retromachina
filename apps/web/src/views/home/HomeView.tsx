import React, { useState } from "react";
import { useNavigate } from "react-router";
import CreateTeamSvg from "../../assets/icons/create-team.svg";
import NotFoundSvg from "../../assets/images/not-found.svg";
import { Button } from "../../component/atoms/button/Button";
import { TeamCard } from "../../component/molecules/team_retro_list/TeamCard";
import { AnimatedBackground } from "../../component/organisms/animated_background/AnimatedBackground";
import Navbar from "../../component/organisms/navbar/Navbar";
import { useUser } from "../../context/user/UserContext.hook";
import { useReflectionCardStore } from "../../store/useReflectionCardStore";
import { ReflectionCardsShelf } from "../retro_active/components/toolbox/ReflectionCardsShelf";

export const HomeView: React.FC = () => {
  const { user } = useUser();
  const { fetchReflectionCards } = useReflectionCardStore();
  const [reflectionCardsShelfTeamId, setReflectionCardsShelfTeamId] =
    useState<string>();

  const onOpenReflectionCardsShelf = (teamId: string) => {
    fetchReflectionCards(teamId);
    setReflectionCardsShelfTeamId(teamId);
  };

  return (
    <>
      <Navbar />
      <AnimatedBackground
        contentClassName={"flex w-full max-w-4xl justify-center"}
      >
        {user?.teams?.length === 0 && <EmptyState />}

        <div className={"flex w-full container flex-col gap-6 m-4"}>
          {user?.teams?.map((team) => (
            <TeamCard
              key={team.id}
              teamId={team.id}
              teamName={team.name}
              openReflectionCardsShelfClick={() => {
                onOpenReflectionCardsShelf(team.id);
              }}
            />
          ))}
        </div>
      </AnimatedBackground>

      {reflectionCardsShelfTeamId && (
        <ReflectionCardsShelf
          teamId={reflectionCardsShelfTeamId}
          onDismiss={() => setReflectionCardsShelfTeamId(undefined)}
        />
      )}
    </>
  );
};

const EmptyState: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div
      className={
        "flex flex-col grow items-center justify-center gap-4 m-8 p-4 bg-background-500 rounded-2xl pointer-events-auto"
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
  );
};
