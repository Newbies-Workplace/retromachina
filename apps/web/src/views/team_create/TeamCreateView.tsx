import type React from "react";
import { useNavigate } from "react-router";
import type { TeamRequest } from "shared/model/team/team.request";
import { toast } from "sonner";
import { TeamService } from "@/api/Team.service";
import { PageCard } from "@/components/molecules/page_card/PageCard";
import { TeamForm } from "@/components/organisms/forms/TeamForm";
import Navbar from "@/components/organisms/navbar/Navbar";
import { ResponsivePageLayout } from "@/components/organisms/responsive_page_layout/ResponsivePageLayout";
import { useUser } from "@/context/user/UserContext.hook";

export const TeamCreateView: React.FC = () => {
  const { refreshUser } = useUser();
  const navigate = useNavigate();

  const onSubmit = (team: TeamRequest) => {
    TeamService.createTeam(team)
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

      <ResponsivePageLayout>
        <PageCard className="max-w-2xl">
          <TeamForm onSubmit={onSubmit} team={null} />
        </PageCard>
      </ResponsivePageLayout>
    </>
  );
};
