import type React from "react";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";
import type { TeamRequest } from "shared/model/team/team.request";
import { createTeam } from "../../api/Team.service";
import { TeamForm } from "../../component/organisms/forms/TeamForm";
import Navbar from "../../component/organisms/navbar/Navbar";
import { useUser } from "../../context/user/UserContext.hook";

export const TeamCreateView: React.FC = () => {
  const { user, refreshUser } = useUser();
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

      <TeamForm onSubmit={onSubmit} userEmail={user?.email || ""} team={null} />
    </>
  );
};
