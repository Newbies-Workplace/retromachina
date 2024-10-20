import {useSettingsStore} from "../store/useSettingsStore";

interface UseAudio {
  play: (audio: string) => Promise<void>;
}

export const useAudio = (): UseAudio => {
  const {volumeLevel} = useSettingsStore();

  const play = async (audio: string) => {
    if (volumeLevel === 0) {
      return;
    }

    const audioElement = new Audio(audio);
    audioElement.volume = volumeLevel
    await audioElement.play();
  };

  return {
    play,
  };
}
