// Lightweight sound effects using the Web Audio API — no audio files needed.
// Each event uses a distinct waveform/shape (not just a different pitch of
// the same tone) so they're actually distinguishable by ear.

const STORAGE_KEY = "duolingo-clone-sound-enabled";

let audioCtx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  return audioCtx;
}

export function isSoundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === null ? true : stored === "true";
}

export function setSoundEnabled(enabled: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, String(enabled));
}

/** A single fixed-pitch note. */
function playTone(
  frequency: number,
  startTime: number,
  duration: number,
  ctx: AudioContext,
  type: OscillatorType = "sine",
  volume: number = 0.15
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(volume, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration);
}

/** A pitch that slides from one frequency to another — for sweeps/glides. */
function playGlide(
  startFreq: number,
  endFreq: number,
  startTime: number,
  duration: number,
  ctx: AudioContext,
  type: OscillatorType = "sine",
  volume: number = 0.15
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(startFreq, startTime);
  osc.frequency.exponentialRampToValueAtTime(endFreq, startTime + duration);
  gain.gain.setValueAtTime(volume, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration);
}

/** Multiple notes played simultaneously — for a "chord" hit. */
function playChord(
  frequencies: number[],
  startTime: number,
  duration: number,
  ctx: AudioContext,
  type: OscillatorType = "triangle",
  volume: number = 0.1
) {
  frequencies.forEach((freq) => playTone(freq, startTime, duration, ctx, type, volume));
}

// --- Correct answer: bright, short two-note bell (like a "ding!") ---
export function playCorrect() {
  if (!isSoundEnabled()) return;
  const ctx = getContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  playTone(880, now, 0.1, ctx, "triangle", 0.15); // A5
  playTone(1318.5, now + 0.08, 0.18, ctx, "triangle", 0.15); // E6
}

// --- Wrong answer: low buzzy descending "womp" ---
export function playIncorrect() {
  if (!isSoundEnabled()) return;
  const ctx = getContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  playGlide(220, 110, now, 0.3, ctx, "sawtooth", 0.09);
}

// --- Lesson complete: triumphant ascending run into a held major chord ---
export function playLessonComplete() {
  if (!isSoundEnabled()) return;
  const ctx = getContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  [523.25, 659.25, 783.99].forEach((freq, i) => {
    playTone(freq, now + i * 0.1, 0.15, ctx, "triangle", 0.13);
  });
  playChord([1046.5, 1318.5, 1567.98], now + 0.32, 0.5, ctx, "triangle", 0.11);
}

// --- Hearts refilled: sparkly rising sweep ---
export function playHeartsRefilled() {
  if (!isSoundEnabled()) return;
  const ctx = getContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  playGlide(300, 900, now, 0.25, ctx, "sine", 0.12);
  playTone(1200, now + 0.22, 0.15, ctx, "sine", 0.1);
}

// --- Achievement unlocked: fuller fanfare, distinct from lesson-complete ---
export function playAchievementUnlocked() {
  if (!isSoundEnabled()) return;
  const ctx = getContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  [440, 554.37, 659.25].forEach((freq, i) => {
    playTone(freq, now + i * 0.09, 0.14, ctx, "square", 0.06);
  });
  playChord([880, 1108.73, 1318.5], now + 0.28, 0.6, ctx, "triangle", 0.12);
}

// --- Skill unlocked: a mechanical "pop" + bright shimmer ---
export function playSkillUnlocked() {
  if (!isSoundEnabled()) return;
  const ctx = getContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  playGlide(150, 500, now, 0.08, ctx, "square", 0.1); // pop
  playTone(1500, now + 0.09, 0.15, ctx, "sine", 0.08); // shimmer
}

// --- Streak saved: quick flickering flame-like motif ---
export function playStreakSaved() {
  if (!isSoundEnabled()) return;
  const ctx = getContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  playTone(600, now, 0.08, ctx, "triangle", 0.1);
  playTone(750, now + 0.06, 0.08, ctx, "triangle", 0.1);
  playTone(950, now + 0.12, 0.15, ctx, "triangle", 0.11);
}
