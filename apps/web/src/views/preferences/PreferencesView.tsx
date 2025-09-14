import { Volume1Icon } from "lucide-react";
import React, { useState } from "react";
import readySingleSound from "@/assets/sounds/ready-single.wav";
import { Slider } from "@/component/atoms/slider/slider";
import { AnimatedBackground } from "@/component/organisms/animated_background/AnimatedBackground";
import Navbar from "@/component/organisms/navbar/Navbar";
import { useAudio } from "@/context/useAudio";
import { usePreferencesStore } from "@/store/usePreferencesStore";
export const PreferencesView: React.FC = () => {
  const { volumeLevel, setVolumeLevel } = usePreferencesStore();
  const { play } = useAudio();
  const [tempVolumeLevel, setTempVolumeLevel] = useState(volumeLevel);

  return (
    <>
      <Navbar />
      <AnimatedBackground>
        <div
          className={
            "flex flex-col gap-2 min-w-[500px] max-w-[1200px] min-h-[300px] h-fit bg-background-500 m-8 rounded-lg"
          }
        >
          <div
            className={"bg-primary-500 p-4 pb-2 rounded-t-lg font-bold text-lg"}
          >
            Ustawienia
          </div>

          <div
            className={
              "flex grow flex-col justify-between gap-2 w-full h-full p-4"
            }
          >
            <div className={"flex flex-col gap-4"}>
              <div className={"flex flex-row gap-2 items-center"}>
                <Volume1Icon className={"size-6"} />
                Wszystkie dźwięki
              </div>

              <Slider
                value={[tempVolumeLevel]}
                onValueChange={(value) => {
                  setTempVolumeLevel(value[0]);
                }}
                onValueCommit={async (value) => {
                  const level = value[0];
                  setTempVolumeLevel(level);
                  setVolumeLevel(level);

                  await play(readySingleSound, { volumeLevel: level });
                }}
                min={0}
                max={1}
                step={0.05}
              />
            </div>
          </div>
        </div>
      </AnimatedBackground>
    </>
  );
};
