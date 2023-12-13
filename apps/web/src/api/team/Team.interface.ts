import { Role } from "../user/User.interfaces";

export interface TeamRequest {
  name: string;
  users: TeamUser[];
}

export interface TeamUser {
  email: string;
  role: Role;
}

export interface TeamResponse {
  id: string;
  name: string;
  owner_id: string;
}

export interface InviteResponse {
  email: string;
  team_id: string;
  role: Role;
}
