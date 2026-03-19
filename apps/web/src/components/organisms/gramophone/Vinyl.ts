export type Vinyl = {
  id: string;
  name: string;
  author?: string;
  color?: string;
};

export const VINYLS: Vinyl[] = [
  {
    id: "1",
    name: "Space silence",
    author: "Cosmic Voyager",
    color: "#143985",
  },
  { id: "2", name: "Jazz", author: "Smooth Sax", color: "#8B4513" },
  { id: "3", name: "Funky", author: "Funky", color: "#FF6347" },
];
