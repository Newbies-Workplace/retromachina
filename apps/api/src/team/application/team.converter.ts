import { Team } from "@prisma/client";
import { TeamResponse } from "./model/team.response";
import { Injectable } from "@nestjs/common";

@Injectable()
export class TeamConverter {
  async toTeamResponse(team: Team): Promise<TeamResponse> {
    return {
      id: team.id,
      name: team.name,
      owner_id: team.owner_id,
    };
  }
}
