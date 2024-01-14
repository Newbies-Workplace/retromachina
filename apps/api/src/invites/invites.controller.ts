import { ForbiddenError, subject } from '@casl/ability';
import {
  Controller,
  Get,
  NotFoundException,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Team } from '@prisma/client';
import { InviteResponse } from 'shared/model/invite/Invite.response';
import { JWTUser } from 'src/auth/jwt/JWTUser';
import { JwtGuard } from 'src/auth/jwt/jwt.guard';
import { User } from 'src/auth/jwt/jwtuser.decorator';
import { AuthAbilityFactory } from '../auth/auth.ability';
import { PrismaService } from '../prisma/prisma.service';
import { toInviteResponse } from './invites.converter';

@Controller('invites')
export class InvitesController {
  constructor(
    private prismaService: PrismaService,
    private abilityFactory: AuthAbilityFactory,
  ) {}

  @Get()
  @UseGuards(JwtGuard)
  async getInvites(
    @User() user: JWTUser,
    @Query('team_id') teamId: string
  ): Promise<InviteResponse[]> {
    if (!teamId || teamId.trim().length === 0) throw new NotFoundException();

    const team: Team = await this.prismaService.team.findUniqueOrThrow({
      where: {
        id: teamId,
      },
    });
    const ability = this.abilityFactory.create(user)

    ForbiddenError.from(ability).throwUnlessCan('read', subject('Team', team));


    const invites = await this.prismaService.invite.findMany({
      where: {
        team_id: teamId,
      },
    });

    return invites.map(toInviteResponse);
  }
}
