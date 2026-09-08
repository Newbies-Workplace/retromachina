import { create } from "zustand";
import { currentVersion, isNewerVersion, releases } from "@/changelog/releases";

export const VERSION_KEY = "retromachina:version";
export const DISABLED_KEY = "retromachina:changelog-disabled";

const read = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const write = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // The changelog remains usable when browser storage is unavailable.
  }
};

type ChangelogStore = {
  initialized: boolean;
  open: boolean;
  disabled: boolean;
  history: boolean;
  previous: string | null;
  initialize: () => void;
  showHistory: () => void;
  setOpen: (open: boolean) => void;
  setDisabled: (disabled: boolean) => void;
};

export const useChangelogStore = create<ChangelogStore>((set, get) => ({
  initialized: false,
  open: false,
  disabled: false,
  history: false,
  previous: null,
  initialize: () => {
    if (get().initialized) return;
    const previous = read(VERSION_KEY);
    const disabled = read(DISABLED_KEY) === "true";
    const newer = previous !== null && isNewerVersion(currentVersion, previous);
    // Preserve the highest visited version during a deployment rollback.
    if (!previous || !isNewerVersion(previous, currentVersion)) {
      write(VERSION_KEY, currentVersion);
    }
    set({ initialized: true, previous, disabled, open: newer && !disabled });
  },
  showHistory: () => set({ open: true, history: true }),
  setOpen: (open) => set({ open }),
  setDisabled: (disabled) => {
    write(DISABLED_KEY, String(disabled));
    set({ disabled });
  },
}));

export const getVisibleReleases = (
  history: boolean,
  previous: string | null,
) => {
  return history || !previous
    ? releases
    : releases.filter((release) => isNewerVersion(release.version, previous));
};
