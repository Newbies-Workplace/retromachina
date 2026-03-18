import {
  draggable,
  dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { Disc3Icon } from "lucide-react";
import React, { createRef, useEffect, useRef, useState } from "react";
import { NavbarAction } from "@/components/organisms/navbar/NavbarAction";
import { Button } from "@/components/ui/button";
import useClickOutside from "@/hooks/useClickOutside";
import { cn } from "@/lib/utils";

type Vinyl = {
  id: string;
  name: string;
  author?: string;
  color?: string;
};

const VINYLS: Vinyl[] = [
  {
    id: "1",
    name: "Space silence",
    author: "Cosmic Voyager",
    color: "#143985",
  },
  { id: "2", name: "Jazz", author: "Smooth Sax", color: "#8B4513" },
  { id: "3", name: "Funky", author: "Funky", color: "#FF6347" },
];

export const Gramophone: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <NavbarAction>
      <Button
        size={"icon"}
        onClick={() => {
          setIsOpen(true);
        }}
      >
        <Disc3Icon className={"size-5"} />
      </Button>

      {isOpen && (
        <GramophoneModal
          onDismiss={() => {
            setIsOpen(false);
          }}
        />
      )}
    </NavbarAction>
  );
};

const GramophoneModal: React.FC<{ onDismiss: () => void }> = ({
  onDismiss,
}) => {
  const gramophonePopover = createRef<HTMLDivElement>();

  useClickOutside(gramophonePopover, onDismiss);

  const [activeVinyl, setActiveVinyl] = useState<Vinyl | null>(null);

  return (
    <div
      className={
        "flex flex-col absolute top-12 right-12 bg-card rounded-xl p-2 shadow-lg gap-2"
      }
      ref={gramophonePopover}
    >
      <div className={"flex flex-col gap-2 items-center rounded-lgtext-3xl"}>
        <div className={"flex text-3xl font-harlow-solid-italic items-center"}>
          Gramofon
        </div>

        <GramophoneDropzone
          activeVinyl={activeVinyl}
          onVinylDropped={(vinyl) => {
            setActiveVinyl(vinyl);
          }}
        />

        {activeVinyl && (
          <div>
            <div className={"text-sm mt-2"}>{activeVinyl.name}</div>
            <div className={"text-xs"}>{activeVinyl.author}</div>
          </div>
        )}

        <div className={"flex flex-col gap-2 items-center justify-center"}>
          {VINYLS.map((vinyl) => (
            <VinylRecord key={vinyl.id} isDraggable data={vinyl} />
          ))}
        </div>
      </div>
    </div>
  );
};

const GramophoneDropzone: React.FC<{
  activeVinyl: Vinyl | null;
  onVinylDropped: (vinyl: Vinyl) => void;
}> = ({ activeVinyl, onVinylDropped }) => {
  const dropzoneRef = useRef<HTMLDivElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    const element = dropzoneRef.current;
    if (!element) return;

    return dropTargetForElements({
      element,
      onDrop: (args) => {
        const vinyl = args.source.data as Vinyl;
        onVinylDropped(vinyl);
        setIsDragOver(false);
      },
      onDragEnter: () => setIsDragOver(true),
      onDragLeave: () => setIsDragOver(false),
    });
  }, [onVinylDropped]);

  return (
    <div
      ref={dropzoneRef}
      className={cn(
        "size-32 rounded-lg flex items-center justify-center bg-secondary",
        isDragOver ? "border-2 border-dashed" : "",
      )}
    >
      {activeVinyl ? (
        <div className={"animate-[spin_5s_linear_infinite]"}>
          <VinylRecord data={activeVinyl} isDraggable={false} />
        </div>
      ) : (
        <div className={"text-center text-sm"}>Drop vinyl here</div>
      )}
    </div>
  );
};

const VinylRecord: React.FC<{
  className?: string;
  isDraggable?: boolean;
  data: Vinyl;
}> = ({ className, isDraggable = false, data }) => {
  const dragRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const element = dragRef.current;
    if (!element || !isDraggable) return;

    return draggable({
      element,
      getInitialData: () => data,
      onDragStart: () => setIsDragging(true),
      onDrop: () => setIsDragging(false),
    });
  }, [isDraggable, data]);

  const vinylContent = (
    <div
      ref={dragRef}
      className={cn(
        "relative size-24 min-w-24 min-h-24 transition-opacity",
        isDragging && "opacity-0",
        isDraggable && "cursor-grab active:cursor-grabbing",
        className,
      )}
    >
      {/* Vinyl Record with grooves */}
      <div
        className={"relative w-full h-full rounded-full"}
        style={{
          background: `linear-gradient(135deg, ${data.color} 0%, #000000 100%)`,
        }}
      >
        {/* Grooves effect */}
        <div className={"absolute inset-0 rounded-full overflow-hidden"}>
          {/** biome-ignore lint/a11y/noSvgWithoutTitle: svg */}
          <svg className={"w-full h-full"} viewBox={"0 0 100 100"}>
            {Array.from({ length: 8 }).map((_, i) => (
              <circle
                // biome-ignore lint/suspicious/noArrayIndexKey: fixed amount of circles
                key={i}
                cx={"50"}
                cy={"50"}
                r={10 + i * 10}
                fill={"none"}
                stroke={"rgba(0,0,0,0.3)"}
                strokeWidth={"0.5"}
              />
            ))}
          </svg>
        </div>

        <div
          className={"absolute inset-0 rounded-full"}
          style={{
            background:
              "radial-gradient(circle, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 70%)",
          }}
        />

        <div
          className={
            "absolute inset-0 flex items-center justify-center rounded-full"
          }
        >
          <div
            className={
              "w-12 h-12 rounded-full flex items-center justify-center border-2"
            }
            style={{
              background: `linear-gradient(135deg, ${data.color} 0%, ${data.color}dd 100%)`,
              borderColor: data.color,
            }}
          >
            {/** biome-ignore lint/a11y/noSvgWithoutTitle: svg */}
            <svg
              className={"absolute w-full h-full"}
              viewBox={"0 0 100 100"}
              style={{ filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.5))" }}
            >
              <defs>
                <path
                  id={`curve-${data.id}`}
                  d={"M 50, 50 m -40, 0 a 40,40 0 1,1 80,0 a 40,40 0 1,1 -80,0"}
                  fill={"none"}
                />
              </defs>
              <text
                fontSize={"10"}
                fontWeight={"bold"}
                fill={"white"}
                letterSpacing={"2"}
              >
                <textPath
                  href={`#curve-${data.id}`}
                  startOffset={"0%"}
                  textAnchor={"start"}
                >
                  {data.name.toUpperCase()} • {data.name.toUpperCase()} •{" "}
                </textPath>
              </text>
            </svg>

            {/* Center hole */}
            <div className={"absolute w-2 h-2 rounded-full bg-gray-900"}></div>
          </div>
        </div>
      </div>
    </div>
  );

  if (isDraggable) {
    return (
      <div className={"flex flex-row items-start w-full p-2 gap-2"}>
        {vinylContent}

        <div className={"flex flex-col text-sm justify-center"}>
          <span>{data.name}</span>
          <span>{data.author}</span>
        </div>
      </div>
    );
  }

  return vinylContent;
};
