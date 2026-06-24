import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { parseProject, type ParsedProject, type RawProjectPackage } from "@palmier/schema";

/** Shape returned by the Rust `read_project_package` command (snake_case). */
interface RustRawPackage {
  path: string;
  name: string;
  timeline_json: string;
  manifest_json: string | null;
  generation_log_json: string | null;
  thumbnail_base64: string | null;
  chat_sessions: { name: string; json: string }[];
}

export interface OpenedProject {
  path: string;
  name: string;
  thumbnailDataUrl: string | null;
  project: ParsedProject;
}

export async function openProjectAt(path: string): Promise<OpenedProject> {
  const raw = await invoke<RustRawPackage>("read_project_package", { path });
  const schemaRaw: RawProjectPackage = {
    timelineJson: raw.timeline_json,
    manifestJson: raw.manifest_json,
    generationLogJson: raw.generation_log_json,
    chatSessions: raw.chat_sessions,
  };
  return {
    path: raw.path,
    name: raw.name,
    thumbnailDataUrl: raw.thumbnail_base64 ? `data:image/jpeg;base64,${raw.thumbnail_base64}` : null,
    project: parseProject(schemaRaw),
  };
}

/** Opens the directory picker and loads the chosen `.palmier` package. Returns null if cancelled. */
export async function pickAndOpenProject(): Promise<OpenedProject | null> {
  const selected = await open({ directory: true, title: "Abrir projeto .palmier" });
  if (!selected || Array.isArray(selected)) return null;
  return openProjectAt(selected);
}
