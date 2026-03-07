import { SunIcon, Volume1Icon } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAudio } from "@/hooks/useAudio";
import { usePreferencesStore } from "@/store/usePreferencesStore";

const items = [
  { label: "Jasny", value: "light" },
  { label: "Ciemny", value: "dark" },
  { label: "Systemowy", value: "system" },
];

export const PreferencesDialogContent = () => {
  const { volumeLevel, setVolumeLevel, theme, setTheme } =
    usePreferencesStore();
  const { play } = useAudio();
  const [tempVolumeLevel, setTempVolumeLevel] = useState(volumeLevel);

  return (
    <DialogContent showCloseButton={false} onClick={(e) => e.stopPropagation()}>
      <DialogHeader>
        <DialogTitle>Ustawienia</DialogTitle>
      </DialogHeader>

      <div className={"flex flex-col gap-4 w-full"}>
        <div className={"flex flex-row gap-2 items-center"}>
          <Volume1Icon className={"size-6"} />
          Dźwięki w aplikacji
        </div>

        <Slider
          className={"bg-red-50"}
          value={[tempVolumeLevel]}
          onValueChange={(value) => {
            setTempVolumeLevel(value[0]);
          }}
          onValueCommitted={async (value) => {
            const level = value[0];
            setTempVolumeLevel(level);
            setVolumeLevel(level);

            await play(readySingleSound, { volumeLevel: level });
          }}
          min={0}
          max={1}
          step={0.05}
        />

        <div className={"flex flex-row gap-2 items-center"}>
          <SunIcon className={"size-6"} />
          Motyw
        </div>

        <Select
          value={theme}
          itemToStringLabel={(item) => {
            const found = items.find((i) => i.value === item);
            return found ? found.label : "";
          }}
          onValueChange={(theme) => setTheme(theme ?? "system")}
        >
          <SelectTrigger className="w-45">
            <SelectValue placeholder="Motyw" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {items.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <DialogFooter>
        <DialogClose
          render={<Button variant={"destructive"}>Zamknij</Button>}
        />
      </DialogFooter>
    </DialogContent>
  );
};
