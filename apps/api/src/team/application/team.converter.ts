import { Injectable } from "@nestjs/common";
import type { Team } from "@prisma/client";
import type { TeamResponse } from "shared/model/team/team.response";

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
