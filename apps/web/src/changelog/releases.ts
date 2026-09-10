export interface Release {
  version: string;
  title: string;
  changes: string[];
}

// Newest first. Use stable major.minor.patch versions; see docs/changelog.md.
export const releases: Release[] = [
  {
    version: "1.27.0",
    title: "Edycja kolumn",
    changes: [
      "Kolumny możesz teraz edytować także podczas trwania retrospektywy",
      "Gdy ktoś rozpocznie retrospektywę, pozostali członkowie zespołu zobaczą powiadomienie z możliwością szybkiego dołączenia",
    ],
  },
  {
    version: "1.26.0",
    title: "Co nowego?",
    changes: [
      "Od teraz przy aktualizacjach zobaczysz co zmieniło się w retromachinie",
      "Aktywne retrospektywy są teraz odporne na restart usługi",
    ],
  },
];

export function isNewerVersion(current: string, previous: string): boolean {
  if (!/^\d+\.\d+\.\d+$/.test(previous)) return false;
  const next = current.split(".").map(Number);
  const last = previous.split(".").map(Number);
  for (let index = 0; index < 3; index++) {
    if (next[index] !== last[index]) return next[index] > last[index];
  }
  return false;
}
