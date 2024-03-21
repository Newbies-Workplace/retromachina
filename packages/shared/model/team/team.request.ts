import { IsArray, IsNotEmpty, IsOptional, IsString } from "class-validator";
import type { UserRole } from "../user/user.role";

export class TeamRequest {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsArray()
  users?: TeamUserRequest[];
}

export class EditTeamRequest {
  @IsString()
  name: string;

  @IsArray()
  users?: TeamUserRequest[];
}

export class TeamUserRequest {
  @IsString()
  email: string;

  @IsString()
  role: UserRole;
}
