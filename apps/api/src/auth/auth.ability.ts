import { Board, Retrospective, Role, Team } from "generated/prisma/client";
import { AbilityBuilder, type PureAbility } from "@casl/ability";
import {
  createPrismaAbility,
  type PrismaQuery,
  type Subjects,
} from "@casl/prisma";
import { Injectable } from "@nestjs/common";
import { JWTUser } from "./jwt/JWTUser";

export type Action = "create" | "read" | "update" | "delete" | "startRetro";

type AppSubjects = Subjects<{
  Team: Team;
  Retro: Retrospective;
  Board: Board;
}>;
export type AppAbility = PureAbility<[Action, AppSubjects], PrismaQuery>;

@Injectable()
export class AuthAbilityFactory {
  create(user: JWTUser) {
    const { can, build } = new AbilityBuilder<AppAbility>(createPrismaAbility);

    const userTeamIds = user.teams.map((team) => team.id);
    const ownerTeamIds = user.teams
      .filter((team) => team.role === Role.OWNER)
      .map((team) => team.id);
    const adminTeamIds = user.teams
      .filter((team) => team.role === Role.ADMIN)
      .map((team) => team.id);

    can("create", "Team");
    can("read", "Team", { id: { in: userTeamIds } });

    can("update", "Team", { id: { in: [...adminTeamIds, ...ownerTeamIds] } });
    can("delete", "Team", { id: { in: ownerTeamIds } });

    can("startRetro", "Team", { id: { in: adminTeamIds } });

    can("read", "Retro", { team_id: { in: userTeamIds } });

    can("update", "Board", { team_id: { in: adminTeamIds } });
    can("read", "Board", { team_id: { in: userTeamIds } });

    return build();
  }
}
