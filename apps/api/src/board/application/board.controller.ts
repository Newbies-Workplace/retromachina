import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../../auth/jwt/jwt.guard';
import { User } from '../../auth/jwt/jwtuser.decorator';
import { JWTUser } from '../../auth/jwt/JWTUser';
import { EditBoardDto } from './model/editBoard.dto';
import { BoardService } from '../board.service';
import { BoardResponse } from './model/board.response';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthAbilityFactory } from '../../auth/auth.ability';
import { ForbiddenError, subject } from '@casl/ability';

@Controller('teams')
export class BoardController {

  constructor(
    private boardService: BoardService,
    private prismaService: PrismaService,
    private abilityFactory: AuthAbilityFactory,
  ) {}

  @UseGuards(JwtGuard)
  @Put(':id/board')
  async editBoard(
    @User() user: JWTUser,
    @Body() boardDto: EditBoardDto,
    @Param('id') teamId: string,
  ) {
    const board = await this.prismaService.board.findUniqueOrThrow({
      where: {
        team_id: teamId,
      },
      include: {
        BoardColumns: true
      }
    })
    const ability = this.abilityFactory.create(user);

    ForbiddenError.from(ability).throwUnlessCan('update', subject('Board', board));

    await this.boardService.editBoard(teamId, board, boardDto)
  }

  @UseGuards(JwtGuard)
  @Get(':id/board')
  async getBoard(
    @User() user: JWTUser,
    @Param('id') teamId: string,
  ): Promise<BoardResponse> {
    const board = await this.prismaService.board.findUniqueOrThrow({
      where: {
        team_id: teamId,
      },
      include: {
        Team: {
          include: {
            TeamUser: true,
          },
        },
        BoardColumns: true,
        Tasks: true,
      }
    })
    const ability = this.abilityFactory.create(user);

    ForbiddenError.from(ability).throwUnlessCan('read', subject('Board', board));

    return {
      defaultColumnId: board.default_column_id,
      columns: board.BoardColumns.map((col) => ({
        id: col.id,
        order: col.order,
        color: col.color,
        name: col.name,
      })),
      tasks: board.Tasks.map((task) => ({
        id: task.id,
        ownerId: task.owner_id,
        text: task.description,
        columnId: task.column_id,
      }))
    }
  }
}