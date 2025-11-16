import { Board, BoardColumn } from "generated/prisma/client";
import { BadRequestException, Injectable } from "@nestjs/common";
import { BoardColumnDto, EditBoardDto } from "shared/model/board/editBoard.dto";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class BoardService {
  constructor(private prismaService: PrismaService) {}

  async editBoard(
    teamId: string,
    board: Board & { BoardColumns: BoardColumn[] },
    boardDto: EditBoardDto,
  ) {
    const deletedColumns: BoardColumn[] = [];
    const existingColumns: BoardColumnDto[] = [];
    const createdColumns: BoardColumnDto[] = [];

    for (const column of boardDto.columns) {
      if (
        board.BoardColumns.map((savedCol) => savedCol.id).includes(column.id)
      ) {
        existingColumns.push(column);
      } else {
        createdColumns.push(column);
      }
    }
    for (const column of board.BoardColumns) {
      if (
        !boardDto.columns.map((boardCol) => boardCol.id).includes(column.id)
      ) {
        deletedColumns.push(column);
      }
    }

    // throw if trying to delete default column
    if (
      ![...createdColumns, ...existingColumns]
        .map((column) => column.id)
        .includes(boardDto.defaultColumnId)
    ) {
      throw new BadRequestException(
        "Cannot delete column that contains defaultColumnId",
      );
    }

    await this.prismaService.boardColumn.createMany({
      data: createdColumns.map((column) => {
        return {
          id: column.id,
          name: column.name,
          team_id: teamId,
          order: column.order,
        };
      }),
    });
    for (const column of existingColumns) {
      await this.prismaService.boardColumn.update({
        where: {
          id: column.id,
        },
        data: {
          name: column.name,
          team_id: teamId,
          order: column.order,
        },
      });
    }

    // move cards in deleted columns to default column
    await this.prismaService.task.updateMany({
      where: {
        column_id: {
          in: deletedColumns.map((column) => column.id),
        },
      },
      data: {
        column_id: boardDto.defaultColumnId,
      },
    });

    // delete columns
    await this.prismaService.boardColumn.deleteMany({
      where: {
        id: {
          in: deletedColumns.map((column) => column.id),
        },
      },
    });

    await this.prismaService.board.update({
      data: {
        default_column_id: boardDto.defaultColumnId,
      },
      where: {
        team_id: teamId,
      },
    });
  }
}
