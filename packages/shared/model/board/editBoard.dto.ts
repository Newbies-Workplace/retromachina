import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from "class-validator";

export const MAX_BOARD_COLUMNS = 20;
export const MAX_BOARD_COLUMN_NAME_LENGTH = 100;

export class BoardColumnDto {
  @IsUUID()
  id: string;
  @IsString()
  @IsNotEmpty()
  @MaxLength(MAX_BOARD_COLUMN_NAME_LENGTH)
  name: string;
  @IsInt()
  order: number;
}

export class EditBoardDto {
  @IsArray()
  @ArrayMaxSize(MAX_BOARD_COLUMNS)
  @ValidateNested({ each: true })
  @Type(() => BoardColumnDto)
  columns: BoardColumnDto[];
  @IsString()
  @IsNotEmpty()
  defaultColumnId: string;
}
