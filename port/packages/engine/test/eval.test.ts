import { describe, it, expect } from "vitest";
import type { Clip } from "@palmier/schema";
import { defaultTransform, defaultCrop } from "@palmier/schema";
import { smoothstep, fadeMultiplier, opacityAt, transformAt, hasTransformAnimation, clipAtFrame } from "../src/eval";

function makeClip(over: Partial<Clip> = {}): Clip {
  return {
    id: "c",
    mediaRef: "m",
    mediaType: "video",
    sourceClipType: "video",
    startFrame: 0,
    durationFrames: 100,
    trimStartFrame: 0,
    trimEndFrame: 0,
    speed: 1,
    volume: 1,
    fadeInFrames: 0,
    fadeOutFrames: 0,
    fadeInInterpolation: "linear",
    fadeOutInterpolation: "linear",
    opacity: 1,
    transform: defaultTransform(),
    crop: defaultCrop(),
    ...over,
  };
}

describe("smoothstep", () => {
  it("matches the Swift curve at endpoints and midpoint", () => {
    expect(smoothstep(0)).toBe(0);
    expect(smoothstep(1)).toBe(1);
    expect(smoothstep(0.5)).toBeCloseTo(0.5);
  });
});

describe("fadeMultiplier (linear ramps)", () => {
  const clip = makeClip({ fadeInFrames: 10, fadeOutFrames: 10, durationFrames: 100 });
  it("ramps in from 0→1 over fadeInFrames", () => {
    expect(fadeMultiplier(clip, 0)).toBe(0);
    expect(fadeMultiplier(clip, 5)).toBeCloseTo(0.5);
    expect(fadeMultiplier(clip, 10)).toBe(1);
  });
  it("ramps out to 0 over fadeOutFrames", () => {
    expect(fadeMultiplier(clip, 95)).toBeCloseTo(0.5);
    expect(fadeMultiplier(clip, 100)).toBe(0);
  });
  it("is 0 outside the clip span", () => {
    expect(fadeMultiplier(clip, -1)).toBe(0);
    expect(fadeMultiplier(clip, 101)).toBe(0);
  });
});

describe("opacityAt", () => {
  it("returns static opacity when there is no fade", () => {
    expect(opacityAt(makeClip({ opacity: 0.5 }), 50)).toBeCloseTo(0.5);
  });
  it("applies the fade envelope to visual clips", () => {
    const clip = makeClip({ fadeInFrames: 10, opacity: 1 });
    expect(opacityAt(clip, 5)).toBeCloseTo(0.5);
  });
  it("ignores fades for audio clips", () => {
    const clip = makeClip({ mediaType: "audio", fadeInFrames: 10, opacity: 1 });
    expect(opacityAt(clip, 5)).toBe(1);
  });
  it("samples an animated opacity track (clip-relative frames)", () => {
    const clip = makeClip({
      startFrame: 30,
      opacityTrack: {
        keyframes: [
          { frame: 0, value: 0, interpolationOut: "linear" },
          { frame: 10, value: 1, interpolationOut: "linear" },
        ],
      },
    });
    expect(opacityAt(clip, 35)).toBeCloseTo(0.5); // abs 35 = rel 5
    expect(opacityAt(clip, 30)).toBe(0);
    expect(opacityAt(clip, 40)).toBe(1);
  });
});

describe("transformAt", () => {
  it("samples a position track and drops flips", () => {
    const clip = makeClip({
      transform: { ...defaultTransform(), flipHorizontal: true },
      positionTrack: {
        keyframes: [
          { frame: 0, value: { a: 0, b: 0 }, interpolationOut: "linear" },
          { frame: 10, value: { a: 0.5, b: 0.5 }, interpolationOut: "linear" },
        ],
      },
    });
    expect(hasTransformAnimation(clip)).toBe(true);
    const t = transformAt(clip, 5); // top-left at (0.25, 0.25), size 1x1 → center 0.75
    expect(t.centerX).toBeCloseTo(0.75);
    expect(t.flipHorizontal).toBe(false);
  });
});

describe("clipAtFrame", () => {
  it("finds the clip covering a frame (end-exclusive)", () => {
    const a = makeClip({ id: "a", startFrame: 0, durationFrames: 50 });
    const b = makeClip({ id: "b", startFrame: 50, durationFrames: 50 });
    expect(clipAtFrame([a, b], 25)?.id).toBe("a");
    expect(clipAtFrame([a, b], 50)?.id).toBe("b");
    expect(clipAtFrame([a, b], 200)).toBeUndefined();
  });
});
