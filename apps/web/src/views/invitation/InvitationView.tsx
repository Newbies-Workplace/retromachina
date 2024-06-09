import { AxiosError } from "axios";
import React, { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router";
import { toast } from "react-toastify";
import { TeamResponse } from "shared/model/team/team.response";
import { acceptTeamInvite, getTeamByInviteKey } from "../../api/Team.service";
import { Button } from "../../component/atoms/button/Button";
import { AnimatedBackground } from "../../component/organisms/animated_background/AnimatedBackground";
import Navbar from "../../component/organisms/navbar/Navbar";

export const InvitationView: React.FC = () => {
  const { invitationKey } = useParams<{ invitationKey: string }>();
  const navigate = useNavigate();

  if (!invitationKey) {
    return <Navigate to={"/"} />;
  }

  const [team, setTeam] = useState<TeamResponse>();

  useEffect(() => {
    getTeamByInviteKey(invitationKey)
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
    if (!invitationKey) return;

    acceptTeamInvite(invitationKey)
      .then(() => {
        navigate("/");
      })
      .catch(() => {
        toast.error("Nie udało się dołączyć do zespołu");
      });
  };

  return (
    <div className={"flex flex-col grow"}>
      <Navbar />
      <AnimatedBackground className={"flex flex-col items-center"}>
        <div
          className={"flex flex-col bg-background-500 rounded-xl min-w-[500px]"}
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

                <Button onClick={onJoinTeamPress}>Dołącz do zespołu</Button>
              </>
            )}
          </div>
        </div>
      </AnimatedBackground>
    </div>
  );
};
