// Palmier Pro — project data model, ported 1:1 from Sources/PalmierPro/Models/*.swift
// and Sources/PalmierPro/Project/VideoProject.swift.
//
// Hand-written, documented interfaces. The runtime validator in `zod.ts` mirrors
// these and is type-checked against them (see the assignability guards there).
// Defaults below match the Swift defaults exactly — Swift uses missing-key-tolerant
// decoders, so every optional field must fall back to the documented default.

// ============================================================================
// Enums
// ============================================================================

export type ClipType = "video" | "audio" | "image" | "text" | "lottie";

export type Interpolation = "linear" | "hold" | "smooth";

export type TextAlignment = "left" | "center" | "right";

// ============================================================================
// Keyframes
// ============================================================================

/** interpolationOut defaults to "smooth" when absent. */
export interface Keyframe<V> {
  frame: number; // clip-relative offset (NOT absolute timeline frame)
  value: V;
  interpolationOut: Interpolation;
}

export interface KeyframeTrack<V> {
  keyframes: Keyframe<V>[]; // kept sorted by frame ascending
}

/** Two-component keyframe value: position (x=a, y=b) and scale (w=a, h=b). */
export interface AnimPair {
  a: number;
  b: number;
}

// ============================================================================
// Geometry
// ============================================================================

/**
 * Normalized canvas-space placement. 0…1 spans the frame.
 * Legacy projects may carry `x`/`y` (top-left) instead of `centerX`/`centerY`;
 * migrate with: centerX = x + width - 0.5, centerY = y + height - 0.5.
 */
export interface Transform {
  centerX: number; // default 0.5
  centerY: number; // default 0.5
  width: number; // default 1
  height: number; // default 1
  rotation: number; // degrees, clockwise positive; default 0
  flipHorizontal: boolean; // default false
  flipVertical: boolean; // default false
}

/** Edge insets in normalized (0–1) source coords. All default 0 (identity). */
export interface Crop {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

// ============================================================================
// Text
// ============================================================================

export interface RGBA {
  r: number; // default 1
  g: number; // default 1
  b: number; // default 1
  a: number; // default 1
}

export interface TextShadow {
  enabled: boolean; // default true
  color: RGBA; // default {0,0,0,0.6}
  offsetX: number; // default 0
  offsetY: number; // default -2
  blur: number; // default 6
}

export interface TextFill {
  enabled: boolean; // default false
  color: RGBA;
}

export interface TextStyle {
  fontName: string; // default "Helvetica-Bold"
  fontSize: number; // default 96
  fontScale: number; // default 1.0
  color: RGBA; // default white
  alignment: TextAlignment; // default "center"
  shadow: TextShadow;
  background: TextFill; // default disabled, {0,0,0,0.6}
  border: TextFill; // default disabled, {0,0,0,1}
}

// ============================================================================
// Effects
// ============================================================================

/** One effect parameter: a number, a string blob (e.g. encoded curves), or a keyframed number. */
export interface EffectParam {
  value?: number;
  string?: string;
  track?: KeyframeTrack<number>;
}

/** One entry in a clip's ordered effect stack. `type` is the registry key, e.g. "color.hueCurves". */
export interface Effect {
  id: string; // UUID
  type: string;
  enabled: boolean; // default true
  params: Record<string, EffectParam>;
}

// Color-grading payloads encoded into EffectParam.string (see GradeCurve.swift / HueCurves.swift).
export interface CurvePoint {
  x: number;
  y: number;
}
export interface GradeCurve {
  master: CurvePoint[];
  red: CurvePoint[];
  green: CurvePoint[];
  blue: CurvePoint[];
}
export interface HueCurves {
  hueVsHue: CurvePoint[];
  hueVsSat: CurvePoint[];
  hueVsLum: CurvePoint[];
}

// ============================================================================
// Clip
// ============================================================================

export interface Clip {
  id: string; // UUID
  mediaRef: string; // -> MediaManifestEntry.id
  mediaType: ClipType; // default "video"
  sourceClipType: ClipType; // original type for derived clips; default "video"
  startFrame: number;
  durationFrames: number;
  trimStartFrame: number; // default 0
  trimEndFrame: number; // default 0
  speed: number; // default 1.0
  volume: number; // linear gain; default 1.0
  fadeInFrames: number; // default 0
  fadeOutFrames: number; // default 0
  fadeInInterpolation: Interpolation; // default "linear"
  fadeOutInterpolation: Interpolation; // default "linear"
  opacity: number; // default 1.0
  transform: Transform;
  crop: Crop;
  linkGroupId?: string;
  captionGroupId?: string;

  // Text clips only
  textContent?: string;
  textStyle?: TextStyle;

  // Per-property animation; absent when the property is not animated.
  // Keyframe.frame is clip-relative (0 == clip start).
  opacityTrack?: KeyframeTrack<number>;
  positionTrack?: KeyframeTrack<AnimPair>; // a=x, b=y (normalized top-left)
  scaleTrack?: KeyframeTrack<AnimPair>; // a=width, b=height
  rotationTrack?: KeyframeTrack<number>; // degrees
  cropTrack?: KeyframeTrack<Crop>;
  volumeTrack?: KeyframeTrack<number>; // dB envelope, NOT linear (see VolumeScale)

  effects?: Effect[];
}

// ============================================================================
// Track & Timeline
// ============================================================================

export interface Track {
  id: string; // UUID
  type: ClipType;
  muted: boolean; // default false
  hidden: boolean; // default false
  syncLocked: boolean; // default true
  clips: Clip[];
  // NOTE: Track.displayHeight in Swift is display-only and NOT serialized.
}

export interface Timeline {
  fps: number; // default 30
  width: number; // default 1920
  height: number; // default 1080
  settingsConfigured: boolean; // default false
  tracks: Track[];
}

// ============================================================================
// Media manifest (media.json)
// ============================================================================

/**
 * Swift encodes this enum-with-associated-values as a single-key object:
 *   external -> { "external": { "absolutePath": "/abs/path" } }
 *   project  -> { "project":  { "relativePath": "media/clip.mp4" } }
 */
export type MediaSource =
  | { external: { absolutePath: string } }
  | { project: { relativePath: string } };

export interface GenerationInput {
  prompt: string;
  model: string;
  duration: number;
  aspectRatio: string;
  resolution?: string;
  quality?: string;
  imageURLs?: string[];
  numImages?: number; // image-only
  voice?: string; // audio-only
  lyrics?: string;
  styleInstructions?: string;
  instrumental?: boolean;
  generateAudio?: boolean; // video-only
  referenceImageURLs?: string[];
  referenceVideoURLs?: string[];
  referenceAudioURLs?: string[];
  imageURLAssetIds?: string[];
  referenceImageAssetIds?: string[];
  referenceVideoAssetIds?: string[];
  referenceAudioAssetIds?: string[];
  createdAt?: string; // ISO-8601 / epoch per JSONEncoder.dateEncodingStrategy
}

export interface MediaManifestEntry {
  id: string;
  name: string;
  type: ClipType;
  source: MediaSource;
  duration: number; // seconds
  generationInput?: GenerationInput;
  sourceWidth?: number;
  sourceHeight?: number;
  sourceFPS?: number;
  hasAudio?: boolean;
  folderId?: string;
  cachedRemoteURL?: string;
  cachedRemoteURLExpiresAt?: string;
}

export interface MediaFolder {
  id: string;
  name: string;
  parentFolderId?: string;
}

export interface MediaManifest {
  version: number; // current 2
  entries: MediaManifestEntry[];
  folders: MediaFolder[];
}

// ============================================================================
// Defaults — apply when a key is absent (Swift uses tolerant decoders).
// ============================================================================

export const defaultTransform = (): Transform => ({
  centerX: 0.5,
  centerY: 0.5,
  width: 1,
  height: 1,
  rotation: 0,
  flipHorizontal: false,
  flipVertical: false,
});

export const defaultCrop = (): Crop => ({ left: 0, top: 0, right: 0, bottom: 0 });

export const defaultTimeline = (): Timeline => ({
  fps: 30,
  width: 1920,
  height: 1080,
  settingsConfigured: false,
  tracks: [],
});
