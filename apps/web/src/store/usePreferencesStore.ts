import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "light" | "dark" | "system";

type PreferencesStore = {
  volumeLevel: number;
  musicVolumeLevel: number;
  theme: Theme;
  autoReadyAfterVoting: boolean;
  autoReadyAfterDraw: boolean;
  setVolumeLevel: (volumeLevel: number) => void;
  setMusicVolumeLevel: (volumeLevel: number) => void;
  setTheme: (theme: Theme) => void;
  setAutoReadyAfterVoting: (autoReady: boolean) => void;
  setAutoReadyAfterDraw: (autoReady: boolean) => void;
};

export const usePreferencesStore = create<PreferencesStore>()(
  persist(
    (set) => ({
      volumeLevel: 0.5,
      musicVolumeLevel: 0.2,
      theme: "system",
      autoReadyAfterVoting: true,
      autoReadyAfterDraw: true,
      setVolumeLevel: (volumeLevel) => set({ volumeLevel }),
      setMusicVolumeLevel: (volumeLevel) =>
        set({ musicVolumeLevel: volumeLevel }),
      setTheme: (theme) => set({ theme }),
      setAutoReadyAfterVoting: (autoReady) =>
        set({ autoReadyAfterVoting: autoReady }),
      setAutoReadyAfterDraw: (autoReady) =>
        set({ autoReadyAfterDraw: autoReady }),
    }),
    {
      name: "preferences-store",
    },
  ),
);
