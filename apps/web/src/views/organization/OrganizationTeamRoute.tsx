import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { TeamService } from "@/api/Team.service";
import { Loader } from "@/components/organisms/loader/Loader";
import { organizationSubdomain } from "@/utils/organization-url";
import { NotFoundView } from "@/views/404/NotFoundView";
import { HomeView } from "@/views/home/HomeView";

export function OrganizationTeamRoute() {
  const { teamSlug } = useParams();
  const organizationSlug = organizationSubdomain();
  const [resolved, setResolved] = useState<{ path: string; teamId?: string }>();
  const path = `${organizationSlug}/${teamSlug}`;
  useEffect(() => {
    if (!organizationSlug || !teamSlug) return;
    let cancelled = false;
    TeamService.resolveTeam(organizationSlug, teamSlug)
      .then((team) => {
        if (!cancelled) setResolved({ path, teamId: team.id });
      })
      .catch(() => {
        if (!cancelled) setResolved({ path });
      });
    return () => {
      cancelled = true;
    };
  }, [organizationSlug, teamSlug, path]);
  if (!organizationSlug || !teamSlug) return <NotFoundView />;
  if (resolved?.path !== path) return <Loader />;
  return resolved.teamId ? (
    <HomeView teamId={resolved.teamId} />
  ) : (
    <NotFoundView />
  );
}
