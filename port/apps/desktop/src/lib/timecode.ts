/** Frame index → "mm:ss:ff" timecode at the given fps. */
export function framesToTimecode(frames: number, fps: number): string {
  const f = Math.max(0, Math.round(frames));
  const safeFps = Math.max(1, Math.round(fps));
  const totalSeconds = Math.floor(f / safeFps);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  const fr = f % safeFps;
  return `${pad(m)}:${pad(s)}:${pad(fr)}`;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Seconds-per-tick that keeps ruler labels ~`targetPx` apart at the current scale. */
export function chooseTickSeconds(pxPerFrame: number, fps: number, targetPx = 80): number {
  const pxPerSecond = pxPerFrame * Math.max(1, fps);
  const steps = [1, 2, 5, 10, 15, 30, 60, 120, 300, 600];
  for (const step of steps) {
    if (step * pxPerSecond >= targetPx) return step;
  }
  return steps[steps.length - 1]!;
}
