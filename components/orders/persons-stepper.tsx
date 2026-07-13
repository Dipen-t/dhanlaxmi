"use client";

import { Minus, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type PersonsStepperProps = {
  name: string;
  id?: string;
  defaultValue?: number;
  min?: number;
  max?: number;
};

type HoldState = {
  timeoutId: ReturnType<typeof setTimeout> | null;
  intervalId: ReturnType<typeof setInterval> | null;
  direction: 1 | -1;
  startedAt: number;
};

function stepSize(direction: 1 | -1, startedAt: number) {
  const elapsed = Date.now() - startedAt;
  if (elapsed > 3000) return direction * 25;
  if (elapsed > 2000) return direction * 10;
  if (elapsed > 1000) return direction * 5;
  return direction;
}

export function PersonsStepper({
  name,
  id = "order-persons",
  defaultValue = 1,
  min = 1,
  max = 100000,
}: PersonsStepperProps) {
  const [value, setValue] = useState(() =>
    Math.max(min, Math.min(max, defaultValue || min)),
  );
  const holdRef = useRef<HoldState | null>(null);

  function clamp(next: number) {
    if (!Number.isFinite(next)) return min;
    return Math.max(min, Math.min(max, Math.trunc(next)));
  }

  function applyStep(delta: number) {
    setValue((prev) => clamp(prev + delta));
  }

  function clearHold() {
    const hold = holdRef.current;
    if (!hold) return;
    if (hold.timeoutId) clearTimeout(hold.timeoutId);
    if (hold.intervalId) clearInterval(hold.intervalId);
    holdRef.current = null;
  }

  function startHold(direction: 1 | -1) {
    clearHold();
    applyStep(direction);

    const hold: HoldState = {
      timeoutId: null,
      intervalId: null,
      direction,
      startedAt: Date.now(),
    };
    holdRef.current = hold;

    // After a short delay, start repeating (long-press).
    hold.timeoutId = setTimeout(() => {
      hold.intervalId = setInterval(() => {
        applyStep(stepSize(direction, hold.startedAt));
      }, 90);
    }, 380);
  }

  useEffect(() => () => clearHold(), []);

  function bindHold(direction: 1 | -1) {
    return {
      onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => {
        if (event.button !== 0) return;
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        startHold(direction);
      },
      onPointerUp: (event: React.PointerEvent<HTMLButtonElement>) => {
        clearHold();
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
      },
      onPointerCancel: () => clearHold(),
      onContextMenu: (event: React.MouseEvent) => event.preventDefault(),
    };
  }

  const buttonClass =
    "inline-flex size-11 shrink-0 touch-manipulation items-center justify-center rounded-lg border border-border bg-background text-foreground transition-colors hover:bg-surface active:bg-primary-soft active:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40";

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label="Decrease number of persons"
        disabled={value <= min}
        className={buttonClass}
        {...bindHold(-1)}
      >
        <Minus className="size-5" strokeWidth={2} aria-hidden />
      </button>

      <input
        id={id}
        name={name}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={value}
        onChange={(event) => {
          const next = Number(event.target.value);
          setValue(clamp(next));
        }}
        className="min-h-11 w-full min-w-0 rounded-lg border border-border bg-background px-3 text-center text-base font-semibold tabular-nums text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/30"
      />

      <button
        type="button"
        aria-label="Increase number of persons"
        disabled={value >= max}
        className={buttonClass}
        {...bindHold(1)}
      >
        <Plus className="size-5" strokeWidth={2} aria-hidden />
      </button>
    </div>
  );
}
