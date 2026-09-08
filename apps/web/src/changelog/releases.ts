export interface Release {
  version: string;
  date: string;
  title: string;
  changes: string[];
}

// Newest first. Use stable major.minor.patch versions; see docs/changelog.md.
export const releases: Release[] = [
  {
    version: "1.0.0",
    date: "2026-09-08",
    title: "Nowości mają swój seans",
    changes: [
      "Nowe wydania przywitają Cię filmowym okienkiem ze zmianami.",
    ],
  },
];

export const currentVersion = releases[0].version;

export function isNewerVersion(current: string, previous: string): boolean {
  if (!/^\d+\.\d+\.\d+$/.test(previous)) return false;
  const next = current.split(".").map(Number);
  const last = previous.split(".").map(Number);
  for (let index = 0; index < 3; index++) {
    if (next[index] !== last[index]) return next[index] > last[index];
  }
  return false;
}
