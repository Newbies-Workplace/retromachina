import React, { createContext, useState } from "react";
import { Vinyl } from "@/components/organisms/gramophone/Vinyl";
import { useAudio } from "@/hooks/useAudio";

interface GramophoneContext {
  currentVinyl: Vinyl | null;

  playVinyl: (vinyl: Vinyl) => void;
  stopVinyl: () => void;
}

export const GramophoneContext = createContext<GramophoneContext>({
  currentVinyl: null,
  playVinyl: () => {},
  stopVinyl: () => {},
});

export const GramophoneContextProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const [currentVinyl, setCurrentVinyl] = useState<Vinyl | null>(null);
  const { playAudio, stopAudio } = useAudio();

  const playVinyl = (vinyl: Vinyl) => {
    setCurrentVinyl(vinyl);

    playAudio(vinyl.path, { channel: "music", loop: true });
  };

  const stopVinyl = () => {
    setCurrentVinyl(null);

    stopAudio("music");
  };

  return (
    <GramophoneContext.Provider value={{ currentVinyl, playVinyl, stopVinyl }}>
      {children}
    </GramophoneContext.Provider>
  );
};
