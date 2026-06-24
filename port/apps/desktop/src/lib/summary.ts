import type { ParsedProject, Timeline, ClipType } from "@palmier/schema";

export interface ProjectSummary {
  fps: number;
  resolution: string;
  trackCount: number;
  clipCount: number;
  mediaCount: number;
  totalFrames: number;
  durationLabel: string;
  byType: { type: ClipType; tracks: number; clips: number }[];
}

const TYPES: ClipType[] = ["video", "audio", "image", "text", "lottie"];

function totalFrames(timeline: Timeline): number {
  let max = 0;
  for (const track of timeline.tracks) {
    for (const clip of track.clips) {
      max = Math.max(max, clip.startFrame + clip.durationFrames);
    }
  }
  return max;
}

function frameLabel(frames: number, fps: number): string {
  const totalSeconds = frames / Math.max(fps, 1);
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  const f = Math.round(frames % Math.max(fps, 1));
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}:${String(f).padStart(2, "0")}`;
}

export function summarize(opened: ParsedProject): ProjectSummary {
  const t = opened.timeline;
  const frames = totalFrames(t);
  return {
    fps: t.fps,
    resolution: `${t.width} × ${t.height}`,
    trackCount: t.tracks.length,
    clipCount: t.tracks.reduce((n, tr) => n + tr.clips.length, 0),
    mediaCount: opened.manifest?.entries.length ?? 0,
    totalFrames: frames,
    durationLabel: frameLabel(frames, t.fps),
    byType: TYPES.map((type) => ({
      type,
      tracks: t.tracks.filter((tr) => tr.type === type).length,
      clips: t.tracks.filter((tr) => tr.type === type).reduce((n, tr) => n + tr.clips.length, 0),
    })).filter((row) => row.tracks > 0),
  };
}
