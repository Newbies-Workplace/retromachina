import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "light" | "dark" | "system";

type PreferencesStore = {
  volumeLevel: number;
  theme: Theme;
  setVolumeLevel: (volumeLevel: number) => void;
  setTheme: (theme: Theme) => void;
};

export const usePreferencesStore = create<PreferencesStore>()(
  persist(
    (set) => ({
      volumeLevel: 0.5,
      theme: "system",
      setVolumeLevel: (volumeLevel) => set({ volumeLevel }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: "preferences-store",
    },
  ),
);
