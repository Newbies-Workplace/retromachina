import type React from "react";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";
import type { TeamRequest } from "shared/model/team/team.request";
import { createTeam } from "@/api/Team.service";
import { AnimatedBackground } from "@/components/organisms/animated_background/AnimatedBackground";
import { TeamForm } from "@/components/organisms/forms/TeamForm";
import Navbar from "@/components/organisms/navbar/Navbar";
import { useUser } from "@/context/user/UserContext.hook";

export const TeamCreateView: React.FC = () => {
  const { refreshUser } = useUser();
  const navigate = useNavigate();

  const onSubmit = (team: TeamRequest) => {
    createTeam(team)
      .then(() => {
        refreshUser().then(() => {
          navigate("/");
        });
      })
      .then(() => {
        toast.success("Zespół stworzono");
      })
      .catch((e) => {
        console.log(e);
        toast.error("Wystąpił błąd");
      });
  };

  return (
    <>
      <Navbar />

      <AnimatedBackground>
        <TeamForm onSubmit={onSubmit} team={null} />
      </AnimatedBackground>
    </>
  );
};
