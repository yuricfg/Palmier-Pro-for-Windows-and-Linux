import { invoke } from "@tauri-apps/api/core";
import type { ClipType, MediaManifestEntry, MediaSource } from "@palmier/schema";

export type ImportMode = "reference" | "copy" | "move";

interface ImportedMedia {
  source_kind: "external" | "project";
  value: string;
  name: string;
  ext: string;
}

/** Mirrors Swift ClipType(fileExtension:). Returns null for unsupported types. */
export function clipTypeFromExt(ext: string): ClipType | null {
  switch (ext) {
    case "mov":
    case "mp4":
    case "m4v":
      return "video";
    case "mp3":
    case "wav":
    case "aac":
    case "m4a":
    case "aiff":
    case "aif":
    case "aifc":
    case "flac":
      return "audio";
    case "png":
    case "jpg":
    case "jpeg":
    case "tiff":
    case "heic":
    case "webp":
      return "image";
    case "json":
    case "lottie":
      return "lottie";
    default:
      return null;
  }
}

const defaultDuration = (t: ClipType): number => (t === "image" ? 5 : t === "text" ? 3 : 0);

/** Imports OS files into the project per `mode`, returning new manifest entries. */
export async function importFiles(packageDir: string, paths: string[], mode: ImportMode): Promise<MediaManifestEntry[]> {
  const entries: MediaManifestEntry[] = [];
  for (const src of paths) {
    const r = await invoke<ImportedMedia>("import_media", { projectDir: packageDir, src, mode });
    const type = clipTypeFromExt(r.ext);
    if (!type) continue;
    const source: MediaSource =
      r.source_kind === "external" ? { external: { absolutePath: r.value } } : { project: { relativePath: r.value } };
    entries.push({ id: crypto.randomUUID(), name: r.name, type, source, duration: defaultDuration(type) });
  }
  return entries;
}
