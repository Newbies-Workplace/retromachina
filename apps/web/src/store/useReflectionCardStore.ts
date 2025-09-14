import { ReflectionCardResponse } from "shared/model/team/reflectionCard.response";
import { create } from "zustand";
import { ReflectionCardService } from "@/api/ReflectionCard.service";

interface ReflectionCardState {
  reflectionCards: ReflectionCardResponse[];
  fetchReflectionCards: (teamId: string) => Promise<void>;
  addReflectionCard: (teamId: string, text: string) => Promise<void>;
  deleteReflectionCard: (
    teamId: string,
    reflectionCardId: string,
  ) => Promise<void>;
}

export const useReflectionCardStore = create<ReflectionCardState>((set) => ({
  reflectionCards: [],
  fetchReflectionCards: async (teamId) => {
    const cards = await ReflectionCardService.getReflectionCards(teamId);
    set({ reflectionCards: cards });
  },
  addReflectionCard: async (teamId, text) => {
    const card = await ReflectionCardService.addReflectionCard(teamId, text);

    set((state) => ({
      reflectionCards: [card, ...state.reflectionCards],
    }));
  },
  deleteReflectionCard: async (teamId, reflectionCardId) => {
    await ReflectionCardService.deleteReflectionCard(
      teamId,
      reflectionCardId,
    ).then(() => {
      set((state) => ({
        reflectionCards: state.reflectionCards.filter(
          (card) => card.id !== reflectionCardId,
        ),
      }));
    });
  },
}));
