import type { InviteResponse } from "shared/model/invite/Invite.response";
import {
  EditTeamInviteRequest,
  TeamRequest,
} from "shared/model/team/team.request";
import type { TeamResponse } from "shared/model/team/team.response";
import { axiosInstance } from "./AxiosInstance";

export const getTeamById = async (teamId: string): Promise<TeamResponse> => {
  return axiosInstance.get(`teams/${teamId}`).then((res) => res.data);
};

export const getTeamByInviteKey = async (
  inviteKey: string,
): Promise<TeamResponse> => {
  return axiosInstance
    .get("teams", {
      params: {
        invite_key: inviteKey,
      },
    })
    .then((res) => res.data);
};

export const acceptTeamInvite = async (inviteKey: string): Promise<void> => {
  return axiosInstance.post(`teams/link_invite/${inviteKey}/accept`);
};

export const getInvitesByTeamId = async (
  teamId: string,
): Promise<InviteResponse[]> => {
  return axiosInstance.get(`invites?team_id=${teamId}`).then((res) => res.data);
};

export const createTeam = async (team: TeamRequest): Promise<TeamResponse> => {
  return axiosInstance.post("teams", team).then((res) => res.data);
};

export const editTeam = async (
  teamId: string,
  team: TeamRequest,
): Promise<TeamResponse> => {
  return axiosInstance.put(`teams/${teamId}`, team).then((res) => res.data);
};

export const editTeamInvitation = async (
  teamId: string,
  invitation: EditTeamInviteRequest,
): Promise<TeamResponse> => {
  return axiosInstance
    .put(`teams/${teamId}/link_invite`, invitation)
    .then((res) => res.data);
};

export const deleteTeam = async (teamId: string): Promise<void> => {
  return axiosInstance.delete(`teams/${teamId}`);
};
