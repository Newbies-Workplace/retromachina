import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from "class-validator";
import type { UserRole } from "../user/user.role";

export const MAX_TEAM_NAME_LENGTH = 100;

export class TeamRequest {
  @IsNotEmpty()
  @IsString()
  @MaxLength(MAX_TEAM_NAME_LENGTH)
  name: string;

  @IsOptional()
  @IsString()
  @IsUUID()
  invite_key?: string;
}

export class EditTeamRequest {
  @IsString()
  @MaxLength(MAX_TEAM_NAME_LENGTH)
  name: string;

  @IsOptional()
  @IsString()
  @IsUUID()
  invite_key?: string;
}

export class EditTeamInviteRequest {
  @IsOptional()
  @IsString()
  @IsUUID()
  invite_key?: string;
}

export class TeamUserRequest {
  @IsString()
  @IsEmail()
  @MaxLength(254)
  email: string;

  @IsString()
  @IsIn(["USER", "ADMIN", "OWNER"])
  role: UserRole;
}
