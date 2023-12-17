import { Team } from "@prisma/client";
import { TeamResponse } from "shared/model/team/team.response";
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
