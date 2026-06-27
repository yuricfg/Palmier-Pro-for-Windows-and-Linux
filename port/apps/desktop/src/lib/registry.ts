import { invoke } from "@tauri-apps/api/core";

export interface RegistryEntry {
  path: string;
  name: string;
  last_opened: string;
  width: number;
  height: number;
  fps: number;
}

export const readRegistry = () => invoke<RegistryEntry[]>("read_registry");
export const writeRegistry = (entries: RegistryEntry[]) => invoke<void>("write_registry", { entries });
export const readThumbnail = (path: string) => invoke<string | null>("read_thumbnail", { path });
export const createProject = (dir: string, name: string, fps: number, width: number, height: number) =>
  invoke<string>("create_project", { dir, name, fps, width, height });

/** Move a project to the top of the recent list (dedup by path), capped at 24. */
export async function registerOpened(entry: Omit<RegistryEntry, "last_opened">): Promise<void> {
  try {
    const list = await readRegistry();
    const next: RegistryEntry[] = [
      { ...entry, last_opened: new Date().toISOString() },
      ...list.filter((e) => e.path !== entry.path),
    ].slice(0, 24);
    await writeRegistry(next);
  } catch {
    /* registry is best-effort */
  }
}

export async function removeFromRegistry(path: string): Promise<void> {
  try {
    const list = await readRegistry();
    await writeRegistry(list.filter((e) => e.path !== path));
  } catch {
    /* ignore */
  }
}
