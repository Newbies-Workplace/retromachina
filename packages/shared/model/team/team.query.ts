import { IsString, IsUUID } from "class-validator";

export class TeamGetQuery {
  @IsString()
  @IsUUID()
  invite_key?: string;
}
