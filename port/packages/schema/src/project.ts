// Pure parse/serialize for the `.palmier` package. No filesystem IO — callers
// (Tauri Rust command, Node test harness) read/write the directory and hand the
// raw file contents in/out. Mirrors VideoProject.read/write semantics:
//   - project.json (timeline) is required; invalid -> throw
//   - media.json is optional, but present-and-corrupt -> throw
//   - generation-log.json is optional and silently ignored when invalid
//   - chat/*.json are opaque passthrough for now

import { TimelineSchema, MediaManifestSchema } from "./zod";
import type { Timeline, MediaManifest } from "./timeline";

export const PROJECT = {
  fileExtension: "palmier",
  typeIdentifier: "io.palmier.project",
  timelineFilename: "project.json",
  manifestFilename: "media.json",
  generationLogFilename: "generation-log.json",
  thumbnailFilename: "thumbnail.jpg",
  mediaDirectoryName: "media",
  chatDirName: "chat",
  defaultProjectName: "Untitled Project",
} as const;

/** Raw textual contents of a package's JSON files. Thumbnail/media are binary and handled by the IO layer. */
export interface RawProjectPackage {
  timelineJson: string;
  manifestJson?: string | null;
  generationLogJson?: string | null;
  chatSessions?: { name: string; json: string }[];
}

export interface ChatSession {
  name: string;
  data: unknown;
}

export interface ParsedProject {
  timeline: Timeline;
  manifest: MediaManifest | null;
  /** Opaque for now — round-tripped verbatim (matches Swift's tolerant decode). */
  generationLog: unknown | null;
  chatSessions: ChatSession[];
}

export class ProjectParseError extends Error {
  constructor(
    public readonly file: string,
    public readonly cause: unknown,
  ) {
    super(`Failed to parse ${file}: ${cause instanceof Error ? cause.message : String(cause)}`);
    this.name = "ProjectParseError";
  }
}

export function parseProject(raw: RawProjectPackage): ParsedProject {
  let timeline: Timeline;
  try {
    timeline = TimelineSchema.parse(JSON.parse(raw.timelineJson));
  } catch (cause) {
    throw new ProjectParseError(PROJECT.timelineFilename, cause);
  }

  let manifest: MediaManifest | null = null;
  if (raw.manifestJson != null && raw.manifestJson.length > 0) {
    try {
      manifest = MediaManifestSchema.parse(JSON.parse(raw.manifestJson));
    } catch (cause) {
      throw new ProjectParseError(PROJECT.manifestFilename, cause);
    }
  }

  let generationLog: unknown | null = null;
  if (raw.generationLogJson != null && raw.generationLogJson.length > 0) {
    try {
      generationLog = JSON.parse(raw.generationLogJson);
    } catch {
      generationLog = null; // silently ignored, like VideoProject.read
    }
  }

  const chatSessions: ChatSession[] = (raw.chatSessions ?? []).map((s) => ({
    name: s.name,
    data: JSON.parse(s.json),
  }));

  return { timeline, manifest, generationLog, chatSessions };
}

export function serializeProject(project: ParsedProject): RawProjectPackage {
  const raw: RawProjectPackage = {
    timelineJson: JSON.stringify(project.timeline),
  };
  if (project.manifest != null) {
    raw.manifestJson = JSON.stringify(project.manifest);
  }
  if (project.generationLog != null) {
    raw.generationLogJson = JSON.stringify(project.generationLog);
  }
  if (project.chatSessions.length > 0) {
    raw.chatSessions = project.chatSessions.map((s) => ({
      name: s.name,
      json: JSON.stringify(s.data),
    }));
  }
  return raw;
}
