import { IsString, IsNotEmpty, IsArray, IsOptional } from 'class-validator';
import {UserRole} from "../user/user.role";

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
