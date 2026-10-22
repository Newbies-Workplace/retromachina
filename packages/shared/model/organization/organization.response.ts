import type { UserInTeamResponse } from "../user/user.response";
import type { UserRole } from "../user/user.role";

export interface OrganizationTeamResponse {
  id: string;
  name: string;
  slug: string;
  canAccess: boolean;
}

export interface OrganizationResponse {
  id: string;
  name: string;
  slug: string;
}

export interface OrganizationMembershipResponse extends OrganizationResponse {
  role: UserRole;
}

export interface OrganizationDetailsResponse
  extends OrganizationMembershipResponse {
  teams: OrganizationTeamResponse[];
  members: UserInTeamResponse[];
}
