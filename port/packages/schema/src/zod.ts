// Runtime validation for the Palmier project model. Mirrors src/timeline.ts and
// replicates Swift's missing-key-tolerant decoders via `.default(...)`: any field
// the Swift side falls back on gets the same default here, so old/partial files
// still load. Required fields (those whose Swift decoder throws when absent) stay
// required. See PROJECT_FORMAT.md for the contract.

import { z } from "zod";
import type {
  Timeline as TimelineT,
  Clip as ClipT,
  Track as TrackT,
  TextStyle as TextStyleT,
  MediaManifest as MediaManifestT,
} from "./timeline";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const ClipTypeSchema = z.enum(["video", "audio", "image", "text", "lottie"]);
export const InterpolationSchema = z.enum(["linear", "hold", "smooth"]);
export const TextAlignmentSchema = z.enum(["left", "center", "right"]);

// ---------------------------------------------------------------------------
// Keyframes
// ---------------------------------------------------------------------------

const keyframe = <T extends z.ZodTypeAny>(value: T) =>
  z.object({
    frame: z.number(),
    value,
    interpolationOut: InterpolationSchema.default("smooth"),
  });

const keyframeTrack = <T extends z.ZodTypeAny>(value: T) =>
  z.object({
    keyframes: z.array(keyframe(value)).default([]),
  });

export const AnimPairSchema = z.object({ a: z.number(), b: z.number() });

// ---------------------------------------------------------------------------
// Geometry
// ---------------------------------------------------------------------------

export const TransformSchema = z.object({
  centerX: z.number().default(0.5),
  centerY: z.number().default(0.5),
  width: z.number().default(1),
  height: z.number().default(1),
  rotation: z.number().default(0),
  flipHorizontal: z.boolean().default(false),
  flipVertical: z.boolean().default(false),
});

export const CropSchema = z.object({
  left: z.number().default(0),
  top: z.number().default(0),
  right: z.number().default(0),
  bottom: z.number().default(0),
});

// ---------------------------------------------------------------------------
// Text
// ---------------------------------------------------------------------------

export const RGBASchema = z.object({
  r: z.number().default(1),
  g: z.number().default(1),
  b: z.number().default(1),
  a: z.number().default(1),
});

const TextShadowSchema = z.object({
  enabled: z.boolean().default(true),
  color: RGBASchema.default({ r: 0, g: 0, b: 0, a: 0.6 }),
  offsetX: z.number().default(0),
  offsetY: z.number().default(-2),
  blur: z.number().default(6),
});

const TextFillSchema = z.object({
  enabled: z.boolean().default(false),
  color: RGBASchema.default({ r: 0, g: 0, b: 0, a: 1 }),
});

export const TextStyleSchema = z.object({
  fontName: z.string().default("Helvetica-Bold"),
  fontSize: z.number().default(96),
  fontScale: z.number().default(1),
  color: RGBASchema.default({ r: 1, g: 1, b: 1, a: 1 }),
  alignment: TextAlignmentSchema.default("center"),
  shadow: TextShadowSchema.default({}),
  background: TextFillSchema.default({ enabled: false, color: { r: 0, g: 0, b: 0, a: 0.6 } }),
  border: TextFillSchema.default({ enabled: false, color: { r: 0, g: 0, b: 0, a: 1 } }),
});

// ---------------------------------------------------------------------------
// Effects
// ---------------------------------------------------------------------------

export const EffectParamSchema = z.object({
  value: z.number().optional(),
  string: z.string().optional(),
  track: keyframeTrack(z.number()).optional(),
});

export const EffectSchema = z.object({
  id: z.string().default(() => crypto.randomUUID()),
  type: z.string(),
  enabled: z.boolean().default(true),
  params: z.record(z.string(), EffectParamSchema).default({}),
});

// ---------------------------------------------------------------------------
// Clip
// ---------------------------------------------------------------------------

export const ClipSchema = z.object({
  id: z.string().default(() => crypto.randomUUID()),
  mediaRef: z.string(),
  mediaType: ClipTypeSchema.default("video"),
  sourceClipType: ClipTypeSchema.default("video"),
  startFrame: z.number(),
  durationFrames: z.number(),
  trimStartFrame: z.number().default(0),
  trimEndFrame: z.number().default(0),
  speed: z.number().default(1),
  volume: z.number().default(1),
  fadeInFrames: z.number().default(0),
  fadeOutFrames: z.number().default(0),
  fadeInInterpolation: InterpolationSchema.default("linear"),
  fadeOutInterpolation: InterpolationSchema.default("linear"),
  opacity: z.number().default(1),
  transform: TransformSchema.default({}),
  crop: CropSchema.default({}),
  linkGroupId: z.string().optional(),
  captionGroupId: z.string().optional(),
  textContent: z.string().optional(),
  textStyle: TextStyleSchema.optional(),
  opacityTrack: keyframeTrack(z.number()).optional(),
  positionTrack: keyframeTrack(AnimPairSchema).optional(),
  scaleTrack: keyframeTrack(AnimPairSchema).optional(),
  rotationTrack: keyframeTrack(z.number()).optional(),
  cropTrack: keyframeTrack(CropSchema).optional(),
  volumeTrack: keyframeTrack(z.number()).optional(),
  effects: z.array(EffectSchema).optional(),
});

// ---------------------------------------------------------------------------
// Track & Timeline
// ---------------------------------------------------------------------------

export const TrackSchema = z.object({
  id: z.string().default(() => crypto.randomUUID()),
  type: ClipTypeSchema,
  muted: z.boolean().default(false),
  hidden: z.boolean().default(false),
  syncLocked: z.boolean().default(true),
  clips: z.array(ClipSchema).default([]),
});

export const TimelineSchema = z.object({
  fps: z.number().default(30),
  width: z.number().default(1920),
  height: z.number().default(1080),
  settingsConfigured: z.boolean().default(false),
  tracks: z.array(TrackSchema).default([]),
});

// ---------------------------------------------------------------------------
// Media manifest
// ---------------------------------------------------------------------------

export const MediaSourceSchema = z.union([
  z.object({ external: z.object({ absolutePath: z.string() }) }),
  z.object({ project: z.object({ relativePath: z.string() }) }),
]);

export const GenerationInputSchema = z.object({
  prompt: z.string(),
  model: z.string(),
  duration: z.number(),
  aspectRatio: z.string(),
  resolution: z.string().optional(),
  quality: z.string().optional(),
  imageURLs: z.array(z.string()).optional(),
  numImages: z.number().optional(),
  voice: z.string().optional(),
  lyrics: z.string().optional(),
  styleInstructions: z.string().optional(),
  instrumental: z.boolean().optional(),
  generateAudio: z.boolean().optional(),
  referenceImageURLs: z.array(z.string()).optional(),
  referenceVideoURLs: z.array(z.string()).optional(),
  referenceAudioURLs: z.array(z.string()).optional(),
  imageURLAssetIds: z.array(z.string()).optional(),
  referenceImageAssetIds: z.array(z.string()).optional(),
  referenceVideoAssetIds: z.array(z.string()).optional(),
  referenceAudioAssetIds: z.array(z.string()).optional(),
  createdAt: z.string().optional(),
});

export const MediaManifestEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  type: ClipTypeSchema,
  source: MediaSourceSchema,
  duration: z.number(),
  generationInput: GenerationInputSchema.optional(),
  sourceWidth: z.number().optional(),
  sourceHeight: z.number().optional(),
  sourceFPS: z.number().optional(),
  hasAudio: z.boolean().optional(),
  folderId: z.string().optional(),
  cachedRemoteURL: z.string().optional(),
  cachedRemoteURLExpiresAt: z.string().optional(),
});

export const MediaFolderSchema = z.object({
  id: z.string(),
  name: z.string(),
  parentFolderId: z.string().optional(),
});

export const MediaManifestSchema = z.object({
  version: z.number().default(2),
  entries: z.array(MediaManifestEntrySchema).default([]),
  folders: z.array(MediaFolderSchema).default([]),
});

// ---------------------------------------------------------------------------
// Drift guards — fail compilation if the Zod output diverges from the
// hand-written interfaces in timeline.ts.
// ---------------------------------------------------------------------------

export type AssertExtends<A extends B, B> = A;
export type _GuardTimeline = AssertExtends<z.infer<typeof TimelineSchema>, TimelineT>;
export type _GuardTrack = AssertExtends<z.infer<typeof TrackSchema>, TrackT>;
export type _GuardClip = AssertExtends<z.infer<typeof ClipSchema>, ClipT>;
export type _GuardTextStyle = AssertExtends<z.infer<typeof TextStyleSchema>, TextStyleT>;
export type _GuardManifest = AssertExtends<z.infer<typeof MediaManifestSchema>, MediaManifestT>;
