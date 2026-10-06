import type {
  OrganizationMemberRequest,
  OrganizationRequest,
} from "shared/model/organization/organization.request";
import type {
  OrganizationDetailsResponse,
  OrganizationMembershipResponse,
} from "shared/model/organization/organization.response";
import { axiosInstance } from "./AxiosInstance";

export const OrganizationService = {
  create: (request: OrganizationRequest) =>
    axiosInstance
      .post<OrganizationMembershipResponse>("organizations", request)
      .then((res) => res.data),
  get: (id: string) =>
    axiosInstance
      .get<OrganizationDetailsResponse>(`organizations/${id}`)
      .then((res) => res.data),
  putMember: (id: string, request: OrganizationMemberRequest) =>
    axiosInstance.put(`organizations/${id}/members`, request),
  removeMember: (id: string, memberId: string) =>
    axiosInstance.delete(`organizations/${id}/members/${memberId}`),
};
