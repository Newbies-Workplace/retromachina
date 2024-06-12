import { useEffect, useState } from "react";
import type { InviteResponse } from "shared/model/invite/Invite.response";
import type { TeamRequest } from "shared/model/team/team.request";
import type { UserInTeamResponse } from "shared/model/user/user.response";
import { getInvitesByTeamId, getTeamById } from "../api/Team.service";
import { getUsersByTeamId } from "../api/User.service";
import { useUser } from "./user/UserContext.hook";

export const useTeamData = (teamId: string | null) => {
  const { user } = useUser();
  const [team, setTeam] = useState<TeamRequest | null>(null);

  useEffect(() => {
    const waitForResult = async () => {
      if (!teamId || !user) {
        return;
      }
      const teamResponse = await getTeamById(teamId);

      const users = await getUsersByTeamId(teamId).then((users) =>
        users.filter((elem: UserInTeamResponse) => {
          return elem.email !== user?.email;
        }),
      );

      const invites = await getInvitesByTeamId(teamId).then((data) =>
        data.map((invite: InviteResponse) => ({
          email: invite.email,
          role: invite.role,
        })),
      );

      setTeam({
        name: teamResponse.name,
        invite_key: teamResponse.invite_key,
        users: [...users, ...invites],
      });
    };

    waitForResult();
  }, [teamId, user]);

  return { team };
};
