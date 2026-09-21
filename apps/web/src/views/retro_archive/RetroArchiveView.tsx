import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router";
import type { RetroResponse } from "shared/model/retro/retro.response";
import { RetroService } from "@/api/Retro.service";
import {
  PageCard,
  PageCardContent,
  PageCardHeader,
} from "@/components/molecules/page_card/PageCard";
import Navbar from "@/components/organisms/navbar/Navbar";
import { ResponsivePageLayout } from "@/components/organisms/responsive_page_layout/ResponsivePageLayout";
import { Button } from "@/components/ui/button";
import { useTeam } from "@/hooks/useTeamRole";

export const RetroArchiveView = () => {
  const navigate = useNavigate();
  const { teamId } = useParams<{ teamId: string }>();
  const team = useTeam(teamId ?? "");
  const [retros, setRetros] = useState<RetroResponse[]>([]);

  useEffect(() => {
    if (!teamId) return;

    RetroService.getRetrosByTeamId(teamId)
      .then((retros) => {
        setRetros(retros);
      })
      .catch(console.log);
  }, [teamId]);

  if (!teamId || !team) {
    return <Navigate to={"/"} />;
  }

  return (
    <>
      <Navbar />
      <ResponsivePageLayout>
        <PageCard className="max-w-6xl">
          <PageCardHeader className={"text-2xl"}>Archiwum</PageCardHeader>

          <PageCardContent
            className={
              "grid h-full grid-cols-2 gap-4 scrollbar md:grid-cols-3 lg:grid-cols-4"
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
          </PageCardContent>
        </PageCard>
      </ResponsivePageLayout>
    </>
  );
};
