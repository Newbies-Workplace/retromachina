import type { Invite } from "@prisma/client";
import type { InviteResponse } from "shared/model/invite/Invite.response";

export const toInviteResponse = (invite: Invite): InviteResponse => {
  return {
    email: invite.email,
    team_id: invite.team_id,
    role: invite.role,
  };
};
