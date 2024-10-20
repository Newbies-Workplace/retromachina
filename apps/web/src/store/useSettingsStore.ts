import { create } from "zustand";

type SettingsStore = {};

export const useSettingsStore = create<SettingsStore>((set) => ({}));
