import { ForbiddenError, subject } from "@casl/ability";
import { Body, Controller, Get, Param, Put, UseGuards } from "@nestjs/common";
import { BoardResponse } from "shared/model/board/board.response";
import { EditBoardDto } from "shared/model/board/editBoard.dto";
import { AuthAbilityFactory } from "../../auth/auth.ability";
import { JWTUser } from "../../auth/jwt/JWTUser";
import { JwtGuard } from "../../auth/jwt/jwt.guard";
import { User } from "../../auth/jwt/jwtuser.decorator";
import { PrismaService } from "../../prisma/prisma.service";
import { BoardService } from "../board.service";

@Controller("teams")
export class BoardController {
  constructor(
    private boardService: BoardService,
    private prismaService: PrismaService,
    private abilityFactory: AuthAbilityFactory,
  ) {}

  @UseGuards(JwtGuard)
  @Put(":id/board")
  async editBoard(
    @User() user: JWTUser,
    @Body() boardDto: EditBoardDto,
    @Param("id") teamId: string,
  ) {
    const board = await this.prismaService.board.findUniqueOrThrow({
      where: {
        team_id: teamId,
      },
      include: {
        BoardColumns: true,
      },
    });
    const ability = this.abilityFactory.create(user);

    ForbiddenError.from(ability).throwUnlessCan(
      "update",
      subject("Board", board),
    );

    await this.boardService.editBoard(teamId, board, boardDto);
  }

  @UseGuards(JwtGuard)
  @Get(":id/board")
  async getBoard(
    @User() user: JWTUser,
    @Param("id") teamId: string,
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
      },
    });
    const ability = this.abilityFactory.create(user);

    ForbiddenError.from(ability).throwUnlessCan(
      "read",
      subject("Board", board),
    );

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
      })),
    };
  }
}
