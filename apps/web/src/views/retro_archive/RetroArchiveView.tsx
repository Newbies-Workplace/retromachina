import dayjs from "dayjs";
import React, { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router";
import type { RetroResponse } from "shared/model/retro/retro.response";
import { RetroService } from "@/api/Retro.service";
import { AnimatedBackground } from "@/components/organisms/animated_background/AnimatedBackground";
import Navbar from "@/components/organisms/navbar/Navbar";
import { Button } from "@/components/ui/button";
import { useTeam } from "@/hooks/useTeamRole";

export const RetroArchiveView = () => {
  const navigate = useNavigate();
  const { teamId } = useParams<{ teamId: string }>();
  const team = useTeam(teamId!);
  const [retros, setRetros] = useState<RetroResponse[]>([]);

  useEffect(() => {
    RetroService.getRetrosByTeamId(teamId!)
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
      <AnimatedBackground contentClassName={"flex-1 max-w-250"}>
        <div className={"flex flex-col max-w-250 bg-card rounded-lg m-8"}>
          <div
            className={
              "flex justify-between w-full bg-primary p-4 rounded-t-lg font-bold text-2xl"
            }
          >
            Archiwum
          </div>

          <div
            className={
              "grid lg:grid-cols-4 md:grid-cols-3 grid-cols-2 gap-4 p-4 h-full scrollbar"
            }
          >
            {retros.map((retro) => {
              if (retro.is_running) {
                return (
                  <Button
                    data-testid="current-retro"
                    key={retro.id}
                    className={
                      "self-stretch min-h-[126px] flex-col bg-secondary/50 text-secondary-foreground border-4 border-destructive"
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
                  className={
                    "self-stretch min-h-[126px] flex-col bg-secondary/50 text-secondary-foreground"
                  }
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
