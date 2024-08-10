import { ReflectionCardResponse } from "shared/model/team/reflectionCard.response";
import { create } from "zustand";
import { ReflectionCardService } from "../api/ReflectionCard.service";

interface ReflectionCardState {
  reflectionCards: ReflectionCardResponse[];
  addReflectionCard: (teamId: string, text: string) => Promise<void>;
}

export const useReflectionCardStore = create<ReflectionCardState>((set) => ({
  reflectionCards: [],
  addReflectionCard: async (teamId, text) => {
    // await ReflectionCardService.addReflectionCard();
    // set({ reflectionCard });
  },
}));
