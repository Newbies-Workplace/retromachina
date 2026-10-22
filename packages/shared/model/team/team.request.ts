import { IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";
import type { UserRole } from "../user/user.role";

export class TeamRequest {
  @IsOptional()
  @IsUUID()
  organization_id?: string | null;
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  @IsUUID()
  invite_key?: string;
}

export class EditTeamRequest {
  @IsOptional()
  @IsUUID()
  organization_id?: string | null;
  @IsString()
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
  email: string;

  @IsString()
  role: UserRole;
}
