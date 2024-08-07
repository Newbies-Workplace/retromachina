import dayjs from "dayjs";
import React, { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router";
import type { RetroResponse } from "shared/.dist/model/retro/retro.response";
import { getRetrosByTeamId } from "../../api/Retro.service";
import { Button } from "../../component/atoms/button/Button";
import { AnimatedBackground } from "../../component/organisms/animated_background/AnimatedBackground";
import Navbar from "../../component/organisms/navbar/Navbar";
import { useTeam } from "../../context/useTeamRole";

export const RetroArchiveView = () => {
  const navigate = useNavigate();
  const { teamId } = useParams<{ teamId: string }>();
  const team = useTeam(teamId!);
  const [retros, setRetros] = useState<RetroResponse[]>([]);

  useEffect(() => {
    getRetrosByTeamId(teamId!)
      .then((retros) => {
        setRetros(retros);
      })
      .catch(console.log);
  }, []);

  if (!team) {
    return <Navigate to={"/"} />;
  }

  return (
    <>
      <Navbar />
      <AnimatedBackground contentClassName={"flex-1 max-w-[1000px]"}>
        <div
          className={
            "flex flex-col max-w-[1000px] bg-background-500 rounded-lg m-8"
          }
        >
          <div
            className={
              "flex justify-between w-full bg-primary-500 p-4 rounded-t-lg font-bold text-2xl"
            }
          >
            Archiwum
          </div>

          <div
            className={
              "grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-4 p-4 h-full scrollbar"
            }
          >
            {retros.map((retro) => {
              if (retro.is_running) {
                return (
                  <Button
                    data-testid="current-retro"
                    key={retro.id}
                    size={"xl"}
                    className={
                      "self-stretch min-h-[126px] flex-col bg-white border-4 border-red-500"
                    }
                    onClick={() => navigate(`/retro/${retro.id}/reflection`)}
                  >
                    Retro <br />w trakcie
                  </Button>
                );
              }
              return (
                <Button
                  data-testid="retro"
                  key={retro.id}
                  size={"xl"}
                  className={"self-stretch min-h-[126px] flex-col bg-white"}
                  onClick={() => navigate(`/retro/${retro.id}/summary`)}
                >
                  Retro {dayjs(retro.date).format("DD.MM.YYYY")}
                </Button>
              );
            })}
          </div>
        </div>
      </AnimatedBackground>
    </>
  );
};
