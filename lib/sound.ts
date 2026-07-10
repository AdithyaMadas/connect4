// Lightweight, dependency-free sound effects built on the Web Audio API.
// No audio files to fetch/host — every sound is synthesized on the fly.

let ctx: AudioContext | null = null;

/**
 * Browsers block audio until a user gesture occurs on the page. Call this
 * from inside a click handler (button clicks, board clicks, etc.) so the
 * AudioContext is created/resumed while we still have "user activation".
 */
export function unlockAudio(): void {
  if (typeof window === 'undefined') return;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    try {
      ctx = new AC();
    } catch {
      return;
    }
  }
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
}

function tone(freq: number, startOffset: number, duration: number, type: OscillatorType = 'sine', peakGain = 0.15) {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;

  const start = ctx.currentTime + startOffset;
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(peakGain, start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  osc.connect(gain).connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.05);
}

/** Two-note upward chime — plays whenever it becomes this player's turn. */
export function playTurnChime(): void {
  if (!ctx) return;
  tone(659.25, 0, 0.12, 'sine', 0.16); // E5
  tone(880, 0.1, 0.2, 'sine', 0.15); // A5
}

/** Short percussive tap for a piece dropping into the board. */
export function playDropSound(): void {
  if (!ctx) return;
  tone(180, 0, 0.09, 'triangle', 0.14);
  tone(120, 0.02, 0.12, 'triangle', 0.08);
}

/** Big ascending fanfare + flourish for a win. */
export function playWinFanfare(): void {
  if (!ctx) return;
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
  notes.forEach((freq, i) => tone(freq, i * 0.12, 0.32, 'square', 0.14));
  tone(1318.5, 0.55, 0.35, 'sine', 0.12); // E6 sparkle
  tone(1046.5, 0.7, 0.5, 'sine', 0.1); // C6 tail
}

/** Gentle descending tone for a draw — anticlimactic on purpose. */
export function playDrawSound(): void {
  if (!ctx) return;
  tone(330, 0, 0.2, 'sine', 0.1);
  tone(277.18, 0.15, 0.3, 'sine', 0.09);
}
