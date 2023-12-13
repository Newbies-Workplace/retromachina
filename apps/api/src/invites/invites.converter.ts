import { Invite } from '@prisma/client';
import { InviteResponse } from './model/Invite.response';

export const toInviteResponse = (invite: Invite): InviteResponse => {
  return {
    email: invite.email,
    team_id: invite.team_id,
    role: invite.role,
  };
}