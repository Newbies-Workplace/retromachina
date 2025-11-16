import type { InviteResponse } from "shared/model/invite/Invite.response";
import {
  EditTeamInviteRequest,
  TeamRequest, TeamUserRequest,
} from "shared/model/team/team.request";
import type { TeamResponse } from "shared/model/team/team.response";
import { axiosInstance } from "@/api/AxiosInstance";

const getTeamById = async (teamId: string): Promise<TeamResponse> => {
  return axiosInstance.get(`teams/${teamId}`).then((res) => res.data);
};

const getTeamByInviteKey = async (
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

const putTeamMember = async (teamId: string, user: TeamUserRequest): Promise<void> => {
  return axiosInstance.put(`teams/${teamId}/members`, user);
}

const deleteTeamMember = async (teamId: string, email: string): Promise<void> => {
  return axiosInstance.delete(`teams/${teamId}/members/${email}`);
}

const acceptTeamInvite = async (inviteKey: string): Promise<void> => {
  return axiosInstance.post(`teams/link_invite/${inviteKey}/accept`);
};

const getInvitesByTeamId = async (
  teamId: string,
): Promise<InviteResponse[]> => {
  return axiosInstance.get(`invites?team_id=${teamId}`).then((res) => res.data);
};

const createTeam = async (team: TeamRequest): Promise<TeamResponse> => {
  return axiosInstance.post("teams", team).then((res) => res.data);
};

const editTeam = async (
  teamId: string,
  team: TeamRequest,
): Promise<TeamResponse> => {
  return axiosInstance.put(`teams/${teamId}`, team).then((res) => res.data);
};

const editTeamInvitation = async (
  teamId: string,
  invitation: EditTeamInviteRequest,
): Promise<TeamResponse> => {
  return axiosInstance
    .put(`teams/${teamId}/link_invite`, invitation)
    .then((res) => res.data);
};

const deleteTeam = async (teamId: string): Promise<void> => {
  return axiosInstance.delete(`teams/${teamId}`);
};


export const TeamService = {
  getTeamById,
  getTeamByInviteKey,
  putTeamMember,
  removeTeamMember: deleteTeamMember,
  acceptTeamInvite,
  getInvitesByTeamId,
  createTeam,
  editTeam,
  editTeamInvitation,
  deleteTeam,
}
