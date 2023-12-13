import { useUser } from "../../context/user/UserContext.hook";
import { Navigate, useNavigate, useParams } from "react-router";
import { TeamForm } from "../../component/organisms/forms/TeamForm";
import { InviteResponse, TeamRequest } from "../../api/team/Team.interface";
import React, { useEffect, useState } from "react";
import Navbar from "../../component/organisms/navbar/Navbar";
import {
  deleteTeam,
  editTeam,
  getInvitesByTeamId,
  getTeamById,
} from "../../api/team/Team.service";
import styles from "./TeamEditView.module.scss";
import { ProgressBar } from "../../component/atoms/progress_bar/ProgressBar";
import { toast } from "react-toastify";
import { ConfirmDialog } from "../../component/molecules/confirm_dialog/ConfirmDialog";
import { getUsersByTeamId } from "../../api/user/User.service";
import { User } from "../../interfaces/User.interface";

const TeamEditView: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const { user, refreshUser } = useUser();
  if (!teamId || !user) {
    return <Navigate to={"/"} />;
  }
  const navigate = useNavigate();
  const [team, setTeam] = useState<TeamRequest | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    const waitForResult = async () => {
      const teamResponse = await getTeamById(teamId);

      const users = await getUsersByTeamId(teamId).then((users) =>
        users.filter((elem: User) => {
          return elem.email !== user?.email;
        })
      );

      const invites = await getInvitesByTeamId(teamId).then((data) =>
        data.map((invite: InviteResponse) => ({
          email: invite.email,
          role: invite.role,
        }))
      );

      setTeam({
        name: teamResponse.name,
        users: [...users, ...invites],
      });
    };

    waitForResult();
  }, []);

  const onSubmit = (team: TeamRequest) => {
    editTeam(teamId, team)
      .then((response) => {
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

  const onDelete = () => {
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
  };

  return (
    <>
      <Navbar />

      {!team && (
        <div className={styles.container}>
          <div className={styles.loadingWrapper}>
            <ProgressBar />
          </div>
        </div>
      )}

      {confirmOpen && (
        <ConfirmDialog
          title={"Usunięcie zespołu"}
          content={`Czy na pewno chcesz usunąć zespół ${team?.name ?? ""}?`}
          onConfirmed={onDelete}
          onDismiss={() => setConfirmOpen(false)}
        />
      )}

      {team && (
        <TeamForm
          onSubmit={onSubmit}
          onDelete={() => setConfirmOpen(true)}
          userEmail={user?.email || ""}
          team={team}
          deletable
        />
      )}
    </>
  );
};

export default TeamEditView;
