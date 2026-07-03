import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { useEffect } from "react";
import { getVinyl, isVinyl } from "@/components/organisms/gramophone/dragndrop";
import { useGramophone } from "@/context/gramophone/GramophoneContext.hook";

export const useVinylStopOnDrop = () => {
  const { currentVinyl, stopVinyl } = useGramophone();

  useEffect(() => {
    if (!currentVinyl) return;

    return dropTargetForElements({
      element: document.body,
      canDrop: ({ source }) => {
        const data = source.data;
        return isVinyl(data) && currentVinyl !== null;
      },
      onDrop: (args) => {
        const data = args.source.data;
        if (!isVinyl(data)) {
          return;
        }

        const vinyl = getVinyl(data);
        // Only clear if the dropped vinyl matches the current vinyl
        if (vinyl.id === currentVinyl?.id) {
          stopVinyl();
        }
      },
    });
  }, [currentVinyl, stopVinyl]);
};
