import { create } from "zustand";
import { persist } from "zustand/middleware";

type PreferencesStore = {
  volumeLevel: number;
  setVolumeLevel: (volumeLevel: number) => void;
};

export const usePreferencesStore = create<PreferencesStore>()(
  persist(
    (set) => ({
      volumeLevel: 0.5,
      setVolumeLevel: (volumeLevel) => set({ volumeLevel }),
    }),
    {
      name: "preferences-store",
    },
  ),
);
