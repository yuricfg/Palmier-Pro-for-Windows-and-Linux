import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { describe, it, expect } from "vitest";
import {
  parseProject,
  serializeProject,
  type RawProjectPackage,
} from "../src/project";

const here = dirname(fileURLToPath(import.meta.url));
const fixtureDir = join(here, "fixtures", "sample.palmier");

function readFixture(): RawProjectPackage {
  return {
    timelineJson: readFileSync(join(fixtureDir, "project.json"), "utf8"),
    manifestJson: readFileSync(join(fixtureDir, "media.json"), "utf8"),
  };
}

describe("parseProject — fidelity to known values", () => {
  const project = parseProject(readFixture());

  it("reads timeline settings", () => {
    expect(project.timeline.fps).toBe(24);
    expect(project.timeline.width).toBe(1920);
    expect(project.timeline.height).toBe(1080);
    expect(project.timeline.settingsConfigured).toBe(true);
    expect(project.timeline.tracks).toHaveLength(3);
  });

  it("reads clip placement, fades and effects", () => {
    const clip = project.timeline.tracks[0]!.clips[0]!;
    expect(clip.id).toBe("clip-1");
    expect(clip.startFrame).toBe(0);
    expect(clip.durationFrames).toBe(120);
    expect(clip.trimStartFrame).toBe(5);
    expect(clip.fadeInFrames).toBe(12);
    expect(clip.fadeInInterpolation).toBe("smooth");
    expect(clip.fadeOutInterpolation).toBe("linear");
    expect(clip.effects?.[0]?.type).toBe("color.levels");
    expect(clip.effects?.[0]?.params.blacks?.value).toBeCloseTo(0.1);
    expect(clip.effects?.[0]?.params.whites?.value).toBeCloseTo(-0.05);
  });

  it("reads keyframe tracks (clip-relative frames)", () => {
    const clip = project.timeline.tracks[0]!.clips[0]!;
    expect(clip.opacityTrack?.keyframes).toHaveLength(2);
    expect(clip.opacityTrack?.keyframes[1]).toMatchObject({
      frame: 12,
      value: 1,
      interpolationOut: "linear",
    });
    expect(clip.positionTrack?.keyframes[0]?.value).toEqual({ a: 0, b: 0 });
  });

  it("reads text clip style", () => {
    const text = project.timeline.tracks[1]!.clips[0]!;
    expect(text.textContent).toBe("Hello");
    expect(text.textStyle?.fontName).toBe("Helvetica-Bold");
    expect(text.textStyle?.shadow.offsetY).toBe(-2);
  });

  it("reads media manifest with both source kinds", () => {
    expect(project.manifest?.version).toBe(2);
    expect(project.manifest?.entries).toHaveLength(2);
    expect(project.manifest?.entries[0]?.source).toEqual({
      project: { relativePath: "media/clip.mp4" },
    });
    expect(project.manifest?.entries[1]?.source).toEqual({
      external: { absolutePath: "/Users/x/music.mp3" },
    });
    expect(project.manifest?.folders[0]?.name).toBe("B-roll");
  });
});

describe("round-trip stability", () => {
  it("parse → serialize → parse yields an identical object", () => {
    const a = parseProject(readFixture());
    const b = parseProject(serializeProject(a));
    expect(b).toEqual(a);
  });
});

describe("tolerant defaults (matches Swift's missing-key decoders)", () => {
  it("fills documented defaults for absent keys", () => {
    const minimal: RawProjectPackage = {
      timelineJson: JSON.stringify({
        tracks: [
          { type: "video", clips: [{ mediaRef: "x", startFrame: 0, durationFrames: 10 }] },
        ],
      }),
    };
    const { timeline } = parseProject(minimal);
    expect(timeline.fps).toBe(30);
    expect(timeline.width).toBe(1920);
    expect(timeline.settingsConfigured).toBe(false);

    const track = timeline.tracks[0]!;
    expect(track.muted).toBe(false);
    expect(track.syncLocked).toBe(true);

    const clip = track.clips[0]!;
    expect(clip.mediaType).toBe("video");
    expect(clip.opacity).toBe(1);
    expect(clip.speed).toBe(1);
    expect(clip.transform).toEqual({
      centerX: 0.5,
      centerY: 0.5,
      width: 1,
      height: 1,
      rotation: 0,
      flipHorizontal: false,
      flipVertical: false,
    });
    expect(clip.crop).toEqual({ left: 0, top: 0, right: 0, bottom: 0 });
  });

  it("throws ProjectParseError on missing required clip fields", () => {
    const bad: RawProjectPackage = {
      timelineJson: JSON.stringify({ tracks: [{ type: "video", clips: [{}] }] }),
    };
    expect(() => parseProject(bad)).toThrowError(/project\.json/);
  });
});
