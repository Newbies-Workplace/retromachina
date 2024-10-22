import { usePreferencesStore } from "../store/usePreferencesStore";

interface UseAudio {
  play: (audio: string, options?: UseAudioOptions) => Promise<void>;
}

interface UseAudioOptions {
  volumeLevel?: number;
}

export const useAudio = (): UseAudio => {
  const { volumeLevel } = usePreferencesStore();

  const play = async (audio: string, options?: UseAudioOptions) => {
    const audioElement = new Audio(audio);
    audioElement.volume = options?.volumeLevel ?? volumeLevel;
    await audioElement.play();
  };

  return {
    play,
  };
};
