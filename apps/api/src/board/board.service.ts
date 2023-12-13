import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BoardColumnDto, EditBoardDto } from './application/model/editBoard.dto';
import { Board, BoardColumn } from '@prisma/client';

@Injectable()
export class BoardService {
  constructor(private prismaService: PrismaService) {}

  async editBoard(teamId: string, board: Board & {BoardColumns: BoardColumn[]}, boardDto: EditBoardDto) {
    const deletedColumns: BoardColumn[] = []
    const existingColumns: BoardColumnDto[] = []
    const createdColumns: BoardColumnDto[] = []

    boardDto.columns.forEach((column) => {
      if (board.BoardColumns.map(savedCol => savedCol.id).includes(column.id)) {
        existingColumns.push(column)
      } else {
        createdColumns.push(column)
      }
    })
    board.BoardColumns.forEach((column) => {
      if (!boardDto.columns.map(boardCol => boardCol.id).includes(column.id)) {
        deletedColumns.push(column)
      }
    })

    // throw if trying to delete default column
    if (![...createdColumns, ...existingColumns].map(column => column.id).includes(boardDto.defaultColumnId)) {
      throw new BadRequestException("Cannot delete column that contains defaultColumnId")
    }

    await this.prismaService.boardColumn.createMany({
      data: createdColumns.map(column => {
        return {
          id: column.id,
          name: column.name,
          color: column.color,
          team_id: teamId,
          order: column.order,
        }
      })
    })
    for (const column of existingColumns) {
      await this.prismaService.boardColumn.update({
        where: {
          id: column.id,
        },
        data: {
          name: column.name,
          color: column.color,
          team_id: teamId,
          order: column.order,
        }
      })
    }

    // move cards in deleted columns to default column
    await this.prismaService.task.updateMany({
      where: {
        column_id: {
          in: deletedColumns.map(column => column.id),
        }
      },
      data: {
        column_id: boardDto.defaultColumnId,
      }
    })

    // delete columns
    await this.prismaService.boardColumn.deleteMany({
      where: {
        id: {
          in: deletedColumns.map(column => column.id)
        }
      }
    })

    await this.prismaService.board.update({
      data: {
        default_column_id: boardDto.defaultColumnId,
      },
      where: {
        team_id: teamId
      }
    })
  }
}