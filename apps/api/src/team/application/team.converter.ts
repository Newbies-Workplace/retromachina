import { Role, Team } from "@prisma/client";
import { TeamResponse } from "shared/model/team/team.response";

export const toTeamResponse = async (
  team: Team,
  requesterRole: Role,
): Promise<TeamResponse> => {
  return {
    id: team.id,
    name: team.name,
    owner_id: team.owner_id,
    invite_key: requesterRole === "ADMIN" ? team.invite_key : undefined,
  };
};
