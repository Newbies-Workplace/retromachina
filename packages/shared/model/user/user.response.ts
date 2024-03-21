import type { TeamResponse } from "../team/team.response";
import type { UserRole } from "./user.role";

export interface UserResponse {
  id: string;
  nick: string;
  email: string;
  avatar_link: string;
}

export interface UserWithTeamsResponse extends UserResponse {
  teams: (TeamResponse & { role: UserRole })[];
}

export interface UserInTeamResponse extends UserResponse {
  role: UserRole;
}
