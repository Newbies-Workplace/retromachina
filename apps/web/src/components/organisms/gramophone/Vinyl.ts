import elevatorSound from "@/assets/vinyl/elevator.mp3";
import focusSound from "@/assets/vinyl/focus.mp3";
import lofiSound from "@/assets/vinyl/lofi.mp3";

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
    name: "Lofi",
    author: "BFCMUSIC",
    color: "#143985",
    path: lofiSound,
  },
  {
    id: "2",
    name: "Focus",
    author: "FreeGroove",
    color: "#8B4513",
    path: focusSound,
  },
  {
    id: "3",
    name: "Elevator",
    author: "Ievgen Poltavskyi",
    color: "#FF6347",
    path: elevatorSound,
  },
];
