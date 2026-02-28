import { Team } from "generated/prisma/client";
import { TeamResponse } from "shared/model/team/team.response";

export const toTeamResponse = async (team: Team): Promise<TeamResponse> => {
  return {
    id: team.id,
    name: team.name,
    invite_key: team.invite_key,
  };
};
