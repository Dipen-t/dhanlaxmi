"use client";

import { useEffect, useRef } from "react";

import {
  bindHtmlAudioElement,
  CLICK_SRC,
  hydrateClickSoundMute,
  isClickSoundMuted,
  playClickSound,
  preloadClickSound,
} from "@/lib/click-sound";

const CLICKABLE_SELECTOR = [
  "a[href]",
  "button:not(:disabled)",
  '[role="button"]:not([aria-disabled="true"])',
  'input[type="button"]:not(:disabled)',
  'input[type="submit"]:not(:disabled)',
  'input[type="reset"]:not(:disabled)',
  'input[type="checkbox"]:not(:disabled)',
  'input[type="radio"]:not(:disabled)',
  "select:not(:disabled)",
  "summary",
  "label",
].join(",");

function eventElement(target: EventTarget | null): Element | null {
  if (target instanceof Element) return target;
  if (target instanceof Node) return target.parentElement;
  return null;
}

function isClickableTarget(target: EventTarget | null) {
  try {
    const el = eventElement(target)?.closest(CLICKABLE_SELECTOR);
    if (!el) return false;
    if (el.hasAttribute("disabled") || el.getAttribute("aria-disabled") === "true") {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/** Global tap feedback — bubble-phase only so it cannot block navigation. */
export function ClickSoundProvider() {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    hydrateClickSoundMute();
    bindHtmlAudioElement(audioRef.current);
    preloadClickSound();

    let lastPlayAt = 0;

    function onClick(event: MouseEvent) {
      try {
        if (isClickSoundMuted()) return;

        const el = eventElement(event.target);
        if (el?.closest("[data-no-click-sound]")) return;
        if (!isClickableTarget(event.target)) return;

        const now = performance.now();
        if (now - lastPlayAt < 40) return;
        lastPlayAt = now;

        playClickSound();
      } catch {
        // never break the page
      }
    }

    // Capture-phase also checks mute early so late bubble handlers can't race.
    document.addEventListener("click", onClick, { passive: true, capture: true });

    return () => {
      document.removeEventListener("click", onClick, true);
      bindHtmlAudioElement(null);
    };
  }, []);

  return (
    <audio
      ref={audioRef}
      src={CLICK_SRC}
      preload="auto"
      playsInline
      aria-hidden
      tabIndex={-1}
      className="sr-only"
    />
  );
}
