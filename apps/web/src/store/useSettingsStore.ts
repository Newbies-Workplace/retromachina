import { create } from "zustand";
import { persist } from "zustand/middleware";

type SettingsStore = {
  volumeLevel: number;
  setVolumeLevel: (volumeLevel: number) => void;
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      volumeLevel: 0.5,
      setVolumeLevel: (volumeLevel) => set({ volumeLevel }),
    }),
    {
      name: "settings-store",
    }
  )
);
