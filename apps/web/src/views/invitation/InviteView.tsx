import { AxiosError } from "axios";
import React, { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router";
import { toast } from "react-toastify";
import { TeamResponse } from "shared/model/team/team.response";
import { RetroService } from "@/api/Retro.service";
import { TeamService } from "@/api/Team.service";
import { Button } from "@/components/atoms/button/Button";
import { AnimatedBackground } from "@/components/organisms/animated_background/AnimatedBackground";
import Navbar from "@/components/organisms/navbar/Navbar";

export const InviteView: React.FC = () => {
  const { inviteKey } = useParams<{ inviteKey: string }>();
  const navigate = useNavigate();

  if (!inviteKey) {
    return <Navigate to={"/"} />;
  }

  const [team, setTeam] = useState<TeamResponse>();

  useEffect(() => {
    TeamService.getTeamByInviteKey(inviteKey)
      .then((team) => {
        setTeam(team);
      })
      .catch((e) => {
        if ((e as AxiosError)?.response?.status === 400) {
          toast.error("Jesteś już członkiem tego zespołu");
        } else {
          navigate("/404");
        }
      });
  }, []);

  const onJoinTeamPress = () => {
    if (!inviteKey || !team) return;

    TeamService.acceptTeamInvite(inviteKey)
      .then(() => {
        RetroService.getRetrosByTeamId(team.id)
          .then((teamRetros) => {
            const activeRetro = teamRetros.find((retro) => retro.is_running);

            if (activeRetro) {
              navigate(`/retro/${activeRetro.id}`);
            } else {
              navigate(`/team/${team.id}/board`);
            }
          })
          .catch(() => {
            navigate("/");
          });
      })
      .catch(() => {
        toast.error("Nie udało się dołączyć do zespołu");
      });
  };

  return (
    <>
      <Navbar />

      <AnimatedBackground>
        <div
          className={
            "flex flex-col bg-background-500 rounded-lg min-w-[500px] m-8"
          }
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className={"flex flex-col bg-primary-500 p-4 pb-2 rounded-t-lg "}
          >
            <span className={"font-bold text-lg"}>Zaproszenia do zespołu</span>
          </div>

          <div className={"flex flex-col gap-2 p-4"}>
            {team === undefined && <span>Ładowanie...</span>}
            {team && (
              <>
                <span> Otrzymałeś zaproszenie do zespołu {team?.name}</span>

                <Button
                  onClick={onJoinTeamPress}
                  data-testid={"join-team-button"}
                >
                  Dołącz do zespołu
                </Button>
              </>
            )}
          </div>
        </div>
      </AnimatedBackground>
    </>
  );
};
