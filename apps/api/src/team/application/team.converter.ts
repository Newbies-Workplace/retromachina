import { Team } from "generated/prisma/client";
import { TeamResponse } from "shared/model/team/team.response";

export const toTeamResponse = async (team: Team): Promise<TeamResponse> => {
  return {
    id: team.id,
    name: team.name,
    slug: team.slug,
    organization_id: team.organization_id,
    invite_key: team.invite_key,
  };
};
