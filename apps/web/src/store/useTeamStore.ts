import {InviteResponse} from "shared/model/invite/Invite.response";
import {TeamResponse} from "shared/model/team/team.response";
import {UserInTeamResponse} from "shared/model/user/user.response";
import {create} from "zustand";
import {TeamService} from "@/api/Team.service";
import {UserService} from "@/api/User.service";
import {TeamUserRequest} from "shared/model/team/team.request";

export type TeamState = {
  state: "loading" | "error" | "loaded";
  team: TeamResponse | null;
  users: UserInTeamResponse[];
  invites: InviteResponse[];
};

type TeamStoreState = {
  teams: Record<string, TeamState>;
  fetchTeamData: (teamId: string) => Promise<void>;
  putTeamMember: (teamId: string, user: TeamUserRequest) => Promise<void>,
  removeTeamMember: (teamId: string, userEmail: string) => Promise<void>,
};

export const useTeamStore = create<TeamStoreState>((set, get) => ({
  teams: {},
  fetchTeamData: async (teamId: string) => {
    set((state) => ({
      teams: {
        ...state.teams,
        [teamId]: {
          ...(state.teams[teamId] || {team: null, users: [], invites: []}),
          state: "loading",
        },
      },
    }));

    try {
      const [teamResponse, users, invites] = await Promise.all([
        TeamService.getTeamById(teamId),
        UserService.getUsersByTeamId(teamId),
        TeamService.getInvitesByTeamId(teamId),
      ]);

      set((state) => ({
        teams: {
          ...state.teams,
          [teamId]: {
            state: "loaded",
            team: teamResponse,
            users: users,
            invites: invites,
          },
        },
      }));
    } catch (_error) {
      set((state) => ({
        teams: {
          ...state.teams,
          [teamId]: {
            ...(state.teams[teamId] || {team: null, users: [], invites: []}),
            state: "error",
          },
        },
      }));
    }
  },
  putTeamMember: async (teamId: string, user: TeamUserRequest) => {
    await TeamService.putTeamMember(teamId, user);

    updateTeam(teamId, (teamState) => ({
      ...teamState,
      users: teamState.users.map((existingUser) =>
        existingUser.email === user.email
          ? {...existingUser, role: user.role}
          : existingUser,
      ),
      invites: teamState.invites.map((existingInvite) =>
        existingInvite.email === user.email
          ? {...existingInvite, role: user.role}
          : existingInvite)
    }));
  },
  removeTeamMember: async (teamId: string, userEmail: string) => {
    await TeamService.removeTeamMember(teamId, userEmail);

    updateTeam(teamId, (teamState) => ({
      ...teamState,
      users: teamState.users.filter((user) => user.email !== userEmail),
      invites: teamState.invites.filter((invite) => invite.email !== userEmail),
    }));
  },
}));

const updateTeam = (teamId: string, updateFn: (teamState: TeamState) => TeamState) => {
  useTeamStore.setState((state) => {
    const teamState = state.teams[teamId];
    if (!teamState) return state;

    return {
      teams: {
        ...state.teams,
        [teamId]: updateFn(teamState),
      },
    }
  });
}
