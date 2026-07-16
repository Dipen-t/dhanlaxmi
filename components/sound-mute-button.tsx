"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useEffect, useState } from "react";

import {
  CLICK_SOUND_MUTE_KEY,
  hydrateClickSoundMute,
  isClickSoundMuted,
  playClickSound,
  setClickSoundMuted,
} from "@/lib/click-sound";

/** Global click-sound mute — persisted in localStorage. */
export function SoundMuteButton() {
  const [muted, setMuted] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMuted(hydrateClickSoundMute());
    setReady(true);

    function onStorage(event: StorageEvent) {
      if (event.key !== CLICK_SOUND_MUTE_KEY) return;
      setMuted(hydrateClickSoundMute());
    }

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  function toggle(event: React.MouseEvent<HTMLButtonElement>) {
    // Stop the document click-sound listener for this same tap.
    event.stopPropagation();
    event.nativeEvent.stopImmediatePropagation();

    const next = !isClickSoundMuted();
    setClickSoundMuted(next);
    setMuted(next);

    if (!next) {
      // Confirm unmute with one soft click.
      playClickSound();
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      data-no-click-sound=""
      aria-pressed={muted}
      aria-label={muted ? "Unmute click sounds" : "Mute click sounds"}
      title={muted ? "Sound off" : "Sound on"}
      className="inline-flex size-11 shrink-0 touch-manipulation items-center justify-center rounded-xl border border-border text-muted transition-colors hover:bg-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:size-12"
    >
      {ready && muted ? (
        <VolumeX className="size-5" strokeWidth={1.75} aria-hidden />
      ) : (
        <Volume2 className="size-5" strokeWidth={1.75} aria-hidden />
      )}
    </button>
  );
}
