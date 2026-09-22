import { useEffect, useState } from "react";
import type { WarmupLink, WarmupStatus } from "shared/model/warmup/warmup";

const FULL_TURNS = 5;
const POINTER_ANGLE = 0;

function normalizeRotation(rotation: number) {
  return ((rotation % 360) + 360) % 360;
}

export interface WarmupWheelProps {
  candidates: WarmupLink[];
  status: WarmupStatus;
  resultId?: string | null;
  spinEndsAt?: number | null;
}

export function WarmupWheel({
  candidates,
  status,
  resultId = null,
  spinEndsAt = null,
}: WarmupWheelProps) {
  const resultIndex = candidates.findIndex((item) => item.id === resultId);
  const slice = 360 / Math.max(1, candidates.length);
  const resultRotation =
    resultIndex < 0
      ? 0
      : normalizeRotation(POINTER_ANGLE - (resultIndex * slice + slice / 2));
  const [rotation, setRotation] = useState(() =>
    status === "revealed" ? resultRotation : 0,
  );

  useEffect(() => {
    if (status === "revealed") {
      setRotation(resultRotation);
      return;
    }

    if (status !== "spinning" || resultIndex < 0) {
      setRotation(0);
      return;
    }

    const animationFrame = requestAnimationFrame(() => {
      setRotation(FULL_TURNS * 360 + resultRotation);
    });

    return () => cancelAnimationFrame(animationFrame);
  }, [resultIndex, resultRotation, status]);

  return (
    <div className="relative aspect-square w-full max-w-96 shrink-0 rounded-full shadow-xl [container-type:inline-size]">
      <div className="absolute right-0 top-1/2 z-10 translate-x-2 -translate-y-1/2 border-y-[12px] border-r-[20px] border-y-transparent border-r-foreground" />
      <div
        aria-label="Koło losujące rozgrzewkę"
        role="img"
        className="relative aspect-square w-full overflow-hidden rounded-full border-4 border-foreground bg-card transition-transform ease-out"
        style={{
          transform: `rotate(${rotation}deg)`,
          transitionDuration:
            status === "spinning"
              ? `${Math.max(0, (spinEndsAt ?? Date.now()) - Date.now())}ms`
              : "0ms",
        }}
      >
        {candidates.map((item, index) => (
          <div key={item.id}>
            <div
              className="absolute left-1/2 top-1/2 h-0.5 w-1/2 origin-left bg-primary"
              style={{
                transform: `translateY(-50%) rotate(${index * slice}deg)`,
              }}
            />
            <div
              className="absolute left-1/2 top-1/2 flex h-6 w-1/2 origin-left items-center justify-center px-[8%] text-[clamp(0.45rem,3.2cqi,0.875rem)] font-semibold"
              style={{
                transform: `translateY(-50%) rotate(${index * slice + slice / 2}deg)`,
              }}
            >
              <span className="w-full truncate text-center">{item.name}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
