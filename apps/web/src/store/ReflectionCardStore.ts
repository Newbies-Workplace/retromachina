import {ReflectionCardResponse} from "shared/model/team/reflectionCard.response";
import {create} from "zustand";
import {ReflectionCardService} from "../api/ReflectionCard.service";

interface ReflectionCardState {
  state: "idle" | "loading" | "success" | "error";
  reflectionCards: ReflectionCardResponse[];
  fetchReflectionCards: (teamId: string) => Promise<void>;
  addReflectionCard: (teamId: string, text: string) => Promise<void>;
  deleteReflectionCard: (teamId: string, reflectionCardId: string) => Promise<void>;
  clear: () => void;
}

export const useReflectionCardStore = create<ReflectionCardState>((set) => ({
  state: "idle",
  reflectionCards: [],
  fetchReflectionCards: async (teamId) => {
    set({ state: "loading" });

    try {
      const cards = await ReflectionCardService.getReflectionCards(teamId);
      set({ reflectionCards: cards, state: "success" });
    } catch (error) {
      set({ state: "error" });
    }
  },
  addReflectionCard: async (teamId, text) => {
    const card = await ReflectionCardService.addReflectionCard(teamId, text);

    set((state) => ({
      reflectionCards: [...state.reflectionCards, card],
    }));
  },
  deleteReflectionCard: async (teamId, reflectionCardId) => {
    await ReflectionCardService.deleteReflectionCard(teamId, reflectionCardId);

    set((state) => ({
      reflectionCards: state.reflectionCards.filter((card) => card.id !== reflectionCardId),
    }));
  },
  clear: () => {
    set({ state: "idle", reflectionCards: [] });
  }
}));
