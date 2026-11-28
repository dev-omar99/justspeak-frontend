/**
 * Short "call ended" tone, generated with the Web Audio API (no audio file,
 * so no licence to track). Two falling notes, about 0.4 s, quiet.
 * Never throws: a browser that blocks audio just stays silent.
 */
export const CALL_END_NOTES: ReadonlyArray<{ freq: number; start: number; length: number }> = [
  { freq: 520, start: 0, length: 0.18 },
  { freq: 390, start: 0.2, length: 0.2 },
];

export function playCallEndTone(): void {
  try {
    const Ctx =
      typeof window !== "undefined"
        ? window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
        : undefined;
    if (!Ctx) return;
    const ctx = new Ctx();
    const now = ctx.currentTime;
    for (const note of CALL_END_NOTES) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = note.freq;
      gain.gain.setValueAtTime(0.0001, now + note.start);
      gain.gain.exponentialRampToValueAtTime(0.18, now + note.start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + note.start + note.length);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + note.start);
      osc.stop(now + note.start + note.length + 0.02);
    }
    window.setTimeout(() => void ctx.close().catch(() => undefined), 700);
  } catch {
    /* audio is optional */
  }
}
