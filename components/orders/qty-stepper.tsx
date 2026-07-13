"use client";

import { Minus, Plus } from "lucide-react";
import { useEffect, useRef } from "react";

type QtyStepperProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  min?: number;
  max?: number;
  autoFocus?: boolean;
  "aria-label"?: string;
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

function parseQty(value: string) {
  const trimmed = value.trim();
  if (trimmed === "") return 0;
  const next = Number(trimmed);
  return Number.isFinite(next) ? next : 0;
}

export function QtyStepper({
  id,
  value,
  onChange,
  min = 0,
  max = 100000,
  autoFocus = false,
  "aria-label": ariaLabel = "Quantity",
}: QtyStepperProps) {
  const holdRef = useRef<HoldState | null>(null);
  const valueRef = useRef(value);
  valueRef.current = value;

  function clamp(next: number) {
    if (!Number.isFinite(next)) return min;
    return Math.max(min, Math.min(max, Math.round(next)));
  }

  function applyStep(delta: number) {
    const current = parseQty(valueRef.current);
    const next = clamp(current + delta);
    onChange(next <= 0 ? "" : String(next));
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
      onLostPointerCapture: () => clearHold(),
      onContextMenu: (event: React.MouseEvent) => event.preventDefault(),
    };
  }

  const numeric = parseQty(value);
  const buttonClass =
    "inline-flex size-12 shrink-0 touch-manipulation items-center justify-center rounded-xl border border-border bg-background text-foreground transition-colors hover:bg-surface active:bg-primary-soft active:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40";

  return (
    <div className="flex items-center gap-2" role="group" aria-label={ariaLabel}>
      <button
        type="button"
        aria-label="Decrease quantity"
        disabled={numeric <= min}
        className={buttonClass}
        {...bindHold(-1)}
      >
        <Minus className="size-5" strokeWidth={2.25} aria-hidden />
      </button>

      <input
        id={id}
        type="text"
        inputMode="decimal"
        value={value}
        autoFocus={autoFocus}
        onChange={(event) => onChange(event.target.value)}
        placeholder="0"
        className="min-h-12 w-full min-w-0 rounded-xl border border-border bg-background px-2 text-center text-xl font-semibold tabular-nums text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-ring/30"
      />

      <button
        type="button"
        aria-label="Increase quantity"
        disabled={numeric >= max}
        className={buttonClass}
        {...bindHold(1)}
      >
        <Plus className="size-5" strokeWidth={2.25} aria-hidden />
      </button>
    </div>
  );
}
