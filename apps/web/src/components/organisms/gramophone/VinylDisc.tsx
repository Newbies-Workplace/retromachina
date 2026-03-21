import React from "react";
import { Vinyl } from "@/components/organisms/gramophone/Vinyl";
import { cn } from "@/lib/utils";

export const VinylDisc: React.FC<{
  className?: string;
  dragRef: React.RefObject<HTMLDivElement | null>;
  data: Vinyl;
}> = ({ className, dragRef, data }) => {
  return (
    <div
      ref={dragRef}
      className={cn(
        "relative size-24 min-w-24 min-h-24 transition-opacity",
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
              className={"absolute w-1/2 h-1/2"}
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
                className={"select-none"}
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
};
