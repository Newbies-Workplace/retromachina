import { Volume1Icon } from "lucide-react";
import React, { useState } from "react";
import readySingleSound from "@/assets/sounds/ready-single.wav";
import { Button } from "@/components/atoms/button/Button";
import { Slider } from "@/components/atoms/slider/slider";
import {
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAudio } from "@/hooks/useAudio";
import { usePreferencesStore } from "@/store/usePreferencesStore";

export const PreferencesDialogContent = () => {
  const { volumeLevel, setVolumeLevel } = usePreferencesStore();
  const { play } = useAudio();
  const [tempVolumeLevel, setTempVolumeLevel] = useState(volumeLevel);

  return (
    <DialogContent showCloseButton={false} onClick={(e) => e.stopPropagation()}>
      <DialogHeader>
        <DialogTitle>Ustawienia</DialogTitle>
      </DialogHeader>

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

      <DialogFooter>
        <DialogClose
          render={<Button variant={"destructive"}>Zamknij</Button>}
        />
      </DialogFooter>
    </DialogContent>
  );
};
