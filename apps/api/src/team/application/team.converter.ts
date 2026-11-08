import { Team } from "generated/prisma/client";
import { TeamResponse } from "shared/model/team/team.response";

/**
 * The invite key lets anyone join the team, so it is only returned to users
 * who can manage the team (ADMIN/OWNER).
 */
export const toTeamResponse = async (
  team: Team,
  { includeInviteKey = false }: { includeInviteKey?: boolean } = {},
): Promise<TeamResponse> => {
  return {
    id: team.id,
    name: team.name,
    ...(includeInviteKey ? { invite_key: team.invite_key } : {}),
  };
};
