import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from "class-validator";
import type { UserRole } from "../user/user.role";

export class TeamRequest {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsArray()
  users?: TeamUserRequest[];

  @IsOptional()
  @IsString()
  @IsUUID()
  invite_key?: string;
}

export class EditTeamRequest {
  @IsString()
  name: string;

  @IsArray()
  users?: TeamUserRequest[];

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
  email: string;

  @IsString()
  role: UserRole;
}
