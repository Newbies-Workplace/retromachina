import { IsArray, IsInt, IsNotEmpty, IsString, IsUUID } from "class-validator";

export class EditBoardDto {
  @IsArray()
  columns: BoardColumnDto[];
  @IsString()
  @IsNotEmpty()
  defaultColumnId: string;
}

export class BoardColumnDto {
  @IsUUID()
  id: string;
  @IsString()
  @IsNotEmpty()
  name: string;
  @IsInt()
  order: number;
}
