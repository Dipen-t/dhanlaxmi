/**
 * UI click sound — Web Audio GainNode for real volume on iPad Safari
 * (HTMLAudioElement.volume is ignored on iOS).
 *
 * Mute is stored on `window` + localStorage so it survives Turbopack/HMR
 * module duplication (in-module `let` alone is unreliable across chunks).
 *
 * Bump CLICK_CACHE_BUST when replacing public/sounds/click.mp3.
 */

export const CLICK_CACHE_BUST = "20260713c";
export const CLICK_SRC = `/sounds/click.mp3?v=${CLICK_CACHE_BUST}`;
export const CLICK_SOUND_MUTE_KEY = "dhanlaxmi-click-sound-muted";

const MUTE_WINDOW_KEY = "__dhanlaxmiClickMuted";

/** Half loudness via Web Audio gain (works on iPad). */
const CLICK_GAIN = 0.5;
/** Slightly faster for a snappy tap. */
const CLICK_PLAYBACK_RATE = 1.4;
/** Cap length (~90ms). */
const CLICK_MAX_SEC = 0.09;

type MuteWindow = Window & {
  [MUTE_WINDOW_KEY]?: boolean;
  __dhanlaxmiClickCtx?: AudioContext;
  __dhanlaxmiClickBuffer?: AudioBuffer | null;
  __dhanlaxmiClickBufferPromise?: Promise<AudioBuffer | null>;
};

function muteWindow(): MuteWindow | null {
  if (typeof window === "undefined") return null;
  return window as MuteWindow;
}

/** Read muted flag from localStorage (safe on SSR). */
export function readClickSoundMuted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(CLICK_SOUND_MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

/** Live mute check — window flag first, then localStorage. */
export function isClickSoundMuted() {
  const w = muteWindow();
  if (w && typeof w[MUTE_WINDOW_KEY] === "boolean") {
    return w[MUTE_WINDOW_KEY] === true;
  }
  return readClickSoundMuted();
}

/** Sync mute from localStorage into the window flag. */
export function hydrateClickSoundMute() {
  const value = readClickSoundMuted();
  const w = muteWindow();
  if (w) {
    w[MUTE_WINDOW_KEY] = value;
  }
  return value;
}

export function setClickSoundMuted(next: boolean) {
  const w = muteWindow();
  if (w) {
    w[MUTE_WINDOW_KEY] = next;
  }
  try {
    localStorage.setItem(CLICK_SOUND_MUTE_KEY, next ? "1" : "0");
  } catch {
    // private mode / quota — window flag still works this session
  }
  return next;
}

function getAudioContext(): AudioContext | null {
  const w = muteWindow();
  if (!w) return null;

  if (!w.__dhanlaxmiClickCtx) {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return null;
    try {
      w.__dhanlaxmiClickCtx = new Ctx();
    } catch {
      return null;
    }
  }
  return w.__dhanlaxmiClickCtx;
}

async function loadBuffer(ctx: AudioContext): Promise<AudioBuffer | null> {
  const w = muteWindow();
  if (!w) return null;

  if (w.__dhanlaxmiClickBuffer) {
    return w.__dhanlaxmiClickBuffer;
  }

  if (!w.__dhanlaxmiClickBufferPromise) {
    w.__dhanlaxmiClickBufferPromise = (async () => {
      try {
        const response = await fetch(CLICK_SRC, { cache: "force-cache" });
        if (!response.ok) return null;
        const data = await response.arrayBuffer();
        const buffer = await ctx.decodeAudioData(data.slice(0));
        w.__dhanlaxmiClickBuffer = buffer;
        return buffer;
      } catch {
        w.__dhanlaxmiClickBuffer = null;
        return null;
      }
    })();
  }

  return w.__dhanlaxmiClickBufferPromise;
}

/** Warm decode on first paint so the first tap is immediate. */
export function preloadClickSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    void loadBuffer(ctx);
  } catch {
    // ignore
  }
}

/** Kept for the hidden <audio> unlock path on stubborn iOS builds. */
export function bindHtmlAudioElement(el: HTMLAudioElement | null) {
  if (!el) return;
  try {
    el.setAttribute("playsinline", "true");
    el.preload = "auto";
    // iOS ignores volume; still set for desktop Safari/Chrome.
    el.volume = CLICK_GAIN;
    if (el.getAttribute("src") !== CLICK_SRC) {
      el.src = CLICK_SRC;
    }
    el.load();
  } catch {
    // ignore
  }
}

/** Call from a user gesture. */
export function playClickSound() {
  try {
    if (isClickSoundMuted()) return;

    const ctx = getAudioContext();
    if (!ctx) return;

    const start = () => {
      void (async () => {
        try {
          if (isClickSoundMuted()) return;

          if (ctx.state === "suspended") {
            await ctx.resume();
          }

          const buffer = await loadBuffer(ctx);
          if (!buffer || isClickSoundMuted()) return;

          const gain = ctx.createGain();
          gain.gain.value = CLICK_GAIN;
          gain.connect(ctx.destination);

          const source = ctx.createBufferSource();
          source.buffer = buffer;
          source.playbackRate.value = CLICK_PLAYBACK_RATE;
          source.connect(gain);

          const now = ctx.currentTime;
          source.start(now);
          source.stop(now + CLICK_MAX_SEC);
        } catch {
          // ignore
        }
      })();
    };

    // Resume must stay tied to the gesture when possible.
    if (ctx.state === "suspended") {
      void ctx.resume().then(start).catch(() => {
        // ignore
      });
      return;
    }

    start();
  } catch {
    // ignore
  }
}
