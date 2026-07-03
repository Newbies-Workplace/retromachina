import React from "react";
import { AnimatedBackground } from "@/components/organisms/animated_background/AnimatedBackground";
import { GramophonePlayer } from "@/components/organisms/gramophone/GramophonePlayer";
import { useVinylStopOnDrop } from "@/components/organisms/gramophone/useVinylStopOnDrop";
import { VinylPicker } from "@/components/organisms/gramophone/VinylPicker";
import Navbar from "@/components/organisms/navbar/Navbar";
import { useGramophone } from "@/context/gramophone/GramophoneContext.hook";

export const GramophoneView: React.FC = () => {
  const { currentVinyl, playVinyl } = useGramophone();

  useVinylStopOnDrop();

  return (
    <>
      <Navbar />

      <AnimatedBackground>
        <div className="relative z-10 flex flex-col items-center justify-center pt-10 gap-4">
          <div className="flex flex-col items-center bg-card rounded-xl p-2 gap-2 shadow">
            <div className="text-4xl font-harlow-solid-italic">Gramofon</div>

            <GramophonePlayer
              className="shadow-2xl"
              activeVinyl={currentVinyl}
              onVinylDropped={(vinyl) => playVinyl(vinyl)}
            />

            <VinylPicker activeVinyl={currentVinyl} />
          </div>
        </div>
      </AnimatedBackground>
    </>
  );
};
