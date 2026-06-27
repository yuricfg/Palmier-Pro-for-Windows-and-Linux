import { invoke } from "@tauri-apps/api/core";
import type { ClipType, MediaSource, ParsedProject } from "@palmier/schema";
import type { LayerSource } from "@palmier/engine";

function resolvePath(packageDir: string, source: MediaSource): string {
  if ("project" in source) {
    const sep = packageDir.includes("\\") ? "\\" : "/";
    const rel = source.project.relativePath.replace(/[\\/]+/g, sep);
    return `${packageDir}${sep}${rel}`;
  }
  return source.external.absolutePath;
}

function mimeFor(type: ClipType, name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (type === "video") return ext === "webm" ? "video/webm" : "video/mp4";
  if (type === "audio") return ext === "wav" ? "audio/wav" : "audio/mpeg";
  const map: Record<string, string> = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    webp: "image/webp",
    gif: "image/gif",
  };
  return map[ext] ?? "image/png";
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function loadVideo(url: string): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const v = document.createElement("video");
    v.muted = true;
    v.preload = "auto";
    v.onloadeddata = () => resolve(v);
    v.onerror = reject;
    v.src = url;
  });
}

export interface LoadedSources {
  sources: Map<string, LayerSource>;
  urls: string[];
}

/** Loads every non-text clip's media into <img>/<video> elements, keyed by mediaRef. */
export async function loadSources(project: ParsedProject, packageDir: string): Promise<LoadedSources> {
  const byId = new Map((project.manifest?.entries ?? []).map((e) => [e.id, e]));
  const refs = new Set<string>();
  for (const t of project.timeline.tracks) {
    for (const c of t.clips) if (c.mediaType !== "text") refs.add(c.mediaRef);
  }

  const sources = new Map<string, LayerSource>();
  const urls: string[] = [];
  for (const ref of refs) {
    const entry = byId.get(ref);
    if (!entry) continue;
    try {
      const bytes = await invoke<number[]>("read_media", { path: resolvePath(packageDir, entry.source) });
      const url = URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type: mimeFor(entry.type, entry.name) }));
      urls.push(url);
      sources.set(ref, entry.type === "video" ? await loadVideo(url) : await loadImage(url));
    } catch (e) {
      console.warn("media load failed:", ref, e);
    }
  }
  return { sources, urls };
}
