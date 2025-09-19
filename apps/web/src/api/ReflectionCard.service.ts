import { ReflectionCardRequest } from "shared/model/team/reflectionCard.request";
import { ReflectionCardResponse } from "shared/model/team/reflectionCard.response";
import { axiosInstance } from "@/api/AxiosInstance";

const getReflectionCards = async (teamId: string) => {
  return axiosInstance
    .get<ReflectionCardResponse[]>(`teams/${teamId}/reflection_cards`)
    .then((response) => response.data);
};

const addReflectionCard = async (teamId: string, text: string) => {
  const request: ReflectionCardRequest = {
    text,
  };

  return axiosInstance
    .post<ReflectionCardResponse>(`teams/${teamId}/reflection_cards`, request)
    .then((response) => response.data);
};

const deleteReflectionCard = async (
  teamId: string,
  reflectionCardId: string,
) => {
  return axiosInstance.delete<ReflectionCardResponse>(
    `teams/${teamId}/reflection_cards/${reflectionCardId}`,
  );
};

export const ReflectionCardService = {
  getReflectionCards,
  addReflectionCard,
  deleteReflectionCard,
};
