import { useEffect, useState } from "react";
import type { WarmupLink, WarmupStatus } from "shared/model/warmup/warmup";

const FULL_TURNS = 5;
const POINTER_ANGLE = 0;
const LAMP_COUNT = 28;
const PEG_COUNT = 24;

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
  const [pointerTick, setPointerTick] = useState(0);
  const lamps = Array.from({ length: LAMP_COUNT }, (_, index) => {
    const angle = (index / LAMP_COUNT) * Math.PI * 2 - Math.PI / 2;
    const radius = 44;

    return {
      id: index,
      left: `${50 + Math.cos(angle) * radius}%`,
      top: `${50 + Math.sin(angle) * radius}%`,
      isError: index % 2 === 1,
    };
  });
  const pegs = Array.from({ length: PEG_COUNT }, (_, index) => {
    const angle = (index / PEG_COUNT) * Math.PI * 2;
    const radius = 47;

    return {
      id: index,
      left: `${50 + Math.cos(angle) * radius}%`,
      top: `${50 + Math.sin(angle) * radius}%`,
    };
  });

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

  useEffect(() => {
    if (status !== "spinning" || spinEndsAt === null) {
      return;
    }

    const startedAt = Date.now();
    const duration = Math.max(1, spinEndsAt - startedAt);
    let timeout: ReturnType<typeof setTimeout>;
    let cancelled = false;

    const tick = () => {
      const remaining = spinEndsAt - Date.now();
      if (cancelled || remaining <= 0) {
        return;
      }

      setPointerTick((current) => current + 1);
      const progress = Math.min(1, 1 - remaining / duration);
      const interval = 70 + 650 * progress ** 3;
      timeout = setTimeout(tick, interval);
    };

    timeout = setTimeout(tick, 70);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [spinEndsAt, status]);

  return (
    <div className="relative aspect-square w-full max-w-96 shrink-0 rounded-full shadow-xl [container-type:inline-size]">
      <div className="absolute inset-0 rounded-full border-2 border-foreground bg-secondary" />
      {lamps.map((lamp) => (
        <span
          aria-hidden="true"
          className={`absolute size-[4%] -translate-x-1/2 -translate-y-1/2 rounded-full ${
            lamp.isError ? "bg-destructive" : "bg-white"
          } animate-[warmup-lamp-flicker_1.6s_ease-in-out_infinite] motion-reduce:animate-none`}
          key={lamp.id}
          style={{
            left: lamp.left,
            top: lamp.top,
            animationDelay: `${lamp.id % 2 === 0 ? 0 : 0.8}s`,
            boxShadow: lamp.isError
              ? "0 0 5px 2px color-mix(in srgb, var(--destructive) 70%, transparent)"
              : "0 0 5px 2px rgb(255 255 255 / 85%)",
          }}
        />
      ))}
      <div
        className={`absolute right-[6%] top-1/2 z-10 translate-x-8 -translate-y-1/2 border-y-[18px] border-r-[64px] border-y-transparent border-r-destructive origin-right ${
          status === "spinning"
            ? "animate-[warmup-pointer-tick_120ms_cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:animate-none"
            : ""
        }`}
        key={pointerTick}
        style={{ filter: "drop-shadow(0 0 1.5px var(--foreground))" }}
      />
      <div
        aria-label="Koło losujące rozgrzewkę"
        role="img"
        className="absolute inset-[12%] aspect-square overflow-hidden rounded-full border-2 border-foreground bg-card transition-transform ease-out"
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
        {pegs.map((peg) => (
          <span
            aria-hidden="true"
            className="absolute size-[3%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-card bg-foreground shadow-sm"
            key={peg.id}
            style={{ left: peg.left, top: peg.top }}
          />
        ))}
      </div>
    </div>
  );
}
