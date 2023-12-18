import { Injectable } from '@nestjs/common';
import { Team, Retrospective, Board } from '@prisma/client';
import { AbilityBuilder, PureAbility } from '@casl/ability';
import { createPrismaAbility, PrismaQuery, Subjects } from '@casl/prisma';
import { JWTUser } from './jwt/JWTUser';
import { PrismaService } from '../prisma/prisma.service';


export type Action = 'create' | 'read' | 'update' | 'delete' | 'startRetro';

type AppSubjects = Subjects<{
  Team: Team
  Retro: Retrospective
  Board: Board
}>;
export type AppAbility = PureAbility<[Action, AppSubjects], PrismaQuery>;

@Injectable()
export class AuthAbilityFactory {

  constructor(private prismaService: PrismaService) {}

  create(user: JWTUser) {
    const { can, cannot, build } = new AbilityBuilder<AppAbility>(createPrismaAbility);

    const userTeamIds = user.teams.map(team => team.id);
    const adminTeamIds = user.teams.filter(team => team.role === 'ADMIN').map(team => team.id);

    can('create', 'Team');
    can('read', 'Team', { id: { in: userTeamIds }});
    can('update', 'Team', { owner_id: user.id });
    can('delete', 'Team', { owner_id: user.id });
    can('startRetro', 'Team', { id: { in: adminTeamIds }});

    can('read', 'Retro', { team_id: { in: userTeamIds }});

    can('update', 'Board', { team_id: { in: adminTeamIds }});
    can('read', 'Board', { team_id: { in: userTeamIds }});

    return build()
  }
}

