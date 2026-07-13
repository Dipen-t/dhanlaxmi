"use client";

import { useCallback, useRef, useState } from "react";

export const INDEX_LETTERS = [
  ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""),
  "#",
] as const;

export function letterFor(name: string) {
  const letter = name.trim().charAt(0).toUpperCase();
  return letter >= "A" && letter <= "Z" ? letter : "#";
}

type AlphabetScrubberProps = {
  availableLetters: Set<string>;
  /** Prefix used in section element ids, e.g. `materials` → `materials-section-A`. */
  sectionIdPrefix: string;
};

export function AlphabetScrubber({
  availableLetters,
  sectionIdPrefix,
}: AlphabetScrubberProps) {
  const railRef = useRef<HTMLDivElement>(null);
  const lastLetterRef = useRef<string | null>(null);
  const [activeLetter, setActiveLetter] = useState<string | null>(null);
  const [scrubbing, setScrubbing] = useState(false);

  const jumpTo = useCallback(
    (letter: string) => {
      if (!availableLetters.has(letter)) return;

      const section = document.getElementById(
        `${sectionIdPrefix}-section-${letter}`,
      );
      if (!section) return;

      section.scrollIntoView({ behavior: "auto", block: "start" });

      if (lastLetterRef.current !== letter) {
        lastLetterRef.current = letter;
        if (typeof navigator !== "undefined" && "vibrate" in navigator) {
          navigator.vibrate(8);
        }
      }

      setActiveLetter(letter);
    },
    [availableLetters, sectionIdPrefix],
  );

  const letterFromClientY = useCallback((clientY: number) => {
    const rail = railRef.current;
    if (!rail) return null;

    const rect = rail.getBoundingClientRect();
    if (rect.height <= 0) return null;

    const ratio = (clientY - rect.top) / rect.height;
    const clamped = Math.max(0, Math.min(0.999, ratio));
    const index = Math.floor(clamped * INDEX_LETTERS.length);
    return INDEX_LETTERS[index] ?? null;
  }, []);

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setScrubbing(true);

    const letter = letterFromClientY(event.clientY);
    if (letter) jumpTo(letter);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;

    const letter = letterFromClientY(event.clientY);
    if (letter) jumpTo(letter);
  }

  function endScrub(event: React.PointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setScrubbing(false);
    window.setTimeout(() => {
      setActiveLetter(null);
      lastLetterRef.current = null;
    }, 350);
  }

  return (
    <>
      {scrubbing && activeLetter ? (
        <div
          aria-hidden
          className="pointer-events-none fixed top-1/2 left-1/2 z-40 flex size-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl bg-primary text-4xl font-semibold text-primary-foreground shadow-lg"
        >
          {activeLetter}
        </div>
      ) : null}

      <nav
        aria-label="Jump to letter"
        className="fixed top-1/2 right-[max(0.25rem,env(safe-area-inset-right))] z-30 flex -translate-y-1/2 flex-col items-center pb-20"
      >
        <div
          ref={railRef}
          role="listbox"
          aria-label="Alphabet"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endScrub}
          onPointerCancel={endScrub}
          className="flex max-h-[min(70dvh,36rem)] touch-none flex-col justify-between rounded-full border border-border/80 bg-background/90 px-1 py-2 shadow-sm backdrop-blur-md select-none"
        >
          {INDEX_LETTERS.map((letter) => {
            const enabled = availableLetters.has(letter);
            const isActive = activeLetter === letter;

            return (
              <button
                key={letter}
                type="button"
                role="option"
                aria-selected={isActive}
                aria-disabled={!enabled}
                tabIndex={enabled ? 0 : -1}
                disabled={!enabled}
                onClick={() => jumpTo(letter)}
                className={`flex h-4 w-6 items-center justify-center rounded-sm text-xs font-semibold leading-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-7 ${
                  !enabled
                    ? "text-border"
                    : isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted active:bg-primary-soft active:text-primary"
                }`}
              >
                {letter}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
