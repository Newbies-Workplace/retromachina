import type React from "react";
import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router";
import { toast } from "react-toastify";
import type { TeamRequest } from "shared/model/team/team.request";
import { deleteTeam, editTeam } from "../../api/Team.service";
import { ProgressBar } from "../../component/atoms/progress_bar/ProgressBar";
import { AnimatedBackground } from "../../component/organisms/animated_background/AnimatedBackground";
import { TeamForm } from "../../component/organisms/forms/TeamForm";
import Navbar from "../../component/organisms/navbar/Navbar";
import { useConfirm } from "../../context/confirm/ConfirmContext.hook";
import { useTeamData } from "../../context/useTeamData";
import { useUser } from "../../context/user/UserContext.hook";

export const TeamEditView: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const { user, refreshUser } = useUser();
  if (!teamId || !user) {
    return <Navigate to={"/"} />;
  }
  const navigate = useNavigate();
  const { showConfirm } = useConfirm();
  const { team: initialTeam } = useTeamData(teamId);

  const [team, setTeam] = useState<TeamRequest | null>(null);

  useEffect(() => {
    setTeam(initialTeam);
  }, [initialTeam]);

  const onSubmit = (team: TeamRequest) => {
    editTeam(teamId, team)
      .then(() => {
        refreshUser().then(() => {
          navigate("/");
        });
      })
      .then(() => {
        toast.success("Zmiany zapisano");
      })
      .catch((e) => {
        console.log(e);
        toast.error("Wystąpił błąd");
      });
  };

  const onDeleteTeamPress = () => {
    showConfirm({
      title: "Usunięcie zespołu",
      content: `Czy na pewno chcesz usunąć zespół ${team?.name ?? ""}?`,
      onConfirmed: () => {
        deleteTeam(teamId)
          .then(() => {
            refreshUser().then(() => {
              navigate("/");
            });
          })
          .then(() => {
            toast.success("Zespół usunięto");
          })
          .catch((e) => {
            console.log(e);
            toast.error("Wystąpił błąd");
          });
      },
    });
  };

  return (
    <>
      <Navbar />

      <AnimatedBackground>
        {!team && (
          <div className={"flex items-center justify-center"}>
            <ProgressBar color={"black"} />
          </div>
        )}

        {team && (
          <TeamForm
            onSubmit={onSubmit}
            onDelete={onDeleteTeamPress}
            team={team}
            deletable
          />
        )}
      </AnimatedBackground>
    </>
  );
};
