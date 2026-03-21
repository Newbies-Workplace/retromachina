export type Vinyl = {
  id: string;
  name: string;
  author?: string;
  color?: string;
  path: string;
};

export const VINYLS: Vinyl[] = [
  {
    id: "1",
    name: "Space silence",
    author: "Cosmic Voyager",
    color: "#143985",
    path: "",
  },
  {
    id: "2",
    name: "Focus",
    author: "FreeGroove",
    color: "#8B4513",
    path: "/assets/vinyl/focus.mp3",
  },
  {
    id: "3",
    name: "Elevator",
    author: "Ievgen Poltavskyi",
    color: "#FF6347",
    path: "/assets/vinyl/elevator.mp3",
  },
];
