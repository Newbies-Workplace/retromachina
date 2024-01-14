import { UserRole } from "../user/user.role";

export interface InviteResponse {
	email: string;
	team_id: string;
	role: UserRole;
}
