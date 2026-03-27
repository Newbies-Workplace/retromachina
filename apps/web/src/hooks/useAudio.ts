import { useCallback, useEffect, useRef } from "react";
import { usePreferencesStore } from "@/store/usePreferencesStore";

interface UseAudio {
  playAudio: (audio: string, options?: UseAudioOptions) => Promise<void>;
  stopAudio: (channel: AudioChannel) => void;
  pauseAudio: (channel: AudioChannel) => void;
  resumeAudio: (channel: AudioChannel) => void;
}

type AudioChannel = "sfx" | "music";

interface UseAudioOptions {
  volumeLevel?: number;
  channel?: AudioChannel;
  loop?: boolean;
}

export const useAudio = (): UseAudio => {
  const { volumeLevel, musicVolumeLevel } = usePreferencesStore();
  const audioChannelsRef = useRef<
    Record<AudioChannel, HTMLAudioElement | null>
  >({ music: null, sfx: null });

  const getVolumeForChannel = useCallback(
    (channel: AudioChannel): number => {
      return channel === "music" ? musicVolumeLevel : volumeLevel;
    },
    [volumeLevel, musicVolumeLevel],
  );

  // Update volume on all channels when volumeLevel changes
  useEffect(() => {
    for (const [channel, audioElement] of Object.entries(
      audioChannelsRef.current,
    )) {
      if (audioElement) {
        audioElement.volume = getVolumeForChannel(channel as AudioChannel);
      }
    }
  }, [getVolumeForChannel]);

  const playAudio = useCallback(
    async (audio: string, options?: UseAudioOptions) => {
      const channel = options?.channel ?? "sfx";
      const currentAudio = audioChannelsRef.current[channel];

      // Stop previous audio if playing
      if (currentAudio && !currentAudio.paused) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }

      const audioElement = new Audio(audio);
      audioElement.loop = options?.loop ?? false;
      audioElement.volume =
        options?.volumeLevel ?? getVolumeForChannel(channel);
      audioChannelsRef.current[channel] = audioElement;

      await audioElement.play();
    },
    [volumeLevel, getVolumeForChannel],
  );

  const stopAudio = useCallback((channel: AudioChannel) => {
    const audioElement = audioChannelsRef.current[channel];
    if (audioElement) {
      audioElement.pause();
      audioElement.srcObject = null;
      audioChannelsRef.current[channel] = null;
    }
  }, []);

  const pauseAudio = useCallback((channel: AudioChannel) => {
    const audioElement = audioChannelsRef.current[channel];
    if (audioElement && !audioElement.paused) {
      audioElement.pause();
    }
  }, []);

  const resumeAudio = useCallback((channel: AudioChannel) => {
    const audioElement = audioChannelsRef.current[channel];
    if (audioElement?.paused) {
      audioElement.play();
    }
  }, []);

  return {
    playAudio,
    stopAudio,
    pauseAudio,
    resumeAudio,
  };
};
