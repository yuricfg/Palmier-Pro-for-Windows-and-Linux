import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sidebar, type Route } from "./components/Sidebar";
import { AuroraBackground } from "./components/AuroraBackground";
import { HomeView } from "./views/HomeView";
import { EditorWorkspace } from "./views/EditorWorkspace";
import { AppearancePanel } from "./views/AppearancePanel";
import { openProjectAt, pickAndOpenProject, type OpenedProject } from "./lib/project";
import { createProject, registerOpened } from "./lib/registry";

export interface NewProjectOptions {
  dir: string;
  name: string;
  fps: number;
  width: number;
  height: number;
}

export function App() {
  const [route, setRoute] = useState<Route>("home");
  const [opened, setOpened] = useState<OpenedProject | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openOpened(result: OpenedProject) {
    setOpened(result);
    const t = result.project.timeline;
    await registerOpened({ path: result.path, name: result.name, width: t.width, height: t.height, fps: t.fps });
    setRoute("editor");
  }

  async function run(fn: () => Promise<OpenedProject | null>) {
    setBusy(true);
    setError(null);
    try {
      const result = await fn();
      if (result) await openOpened(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  const handlePick = () => run(() => pickAndOpenProject());
  const handleOpenPath = (path: string) => run(() => openProjectAt(path));
  const handleNewProject = (o: NewProjectOptions) =>
    run(async () => {
      const path = await createProject(o.dir, o.name, o.fps, o.width, o.height);
      return openProjectAt(path);
    });

  return (
    <div className="pp-app relative flex h-full w-full overflow-hidden">
      <AuroraBackground />
      <div className="relative z-10 flex h-full w-full">
        <Sidebar route={route} onNavigate={setRoute} hasProject={!!opened} />
        <main className="relative flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={route}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="h-full"
            >
              {route === "home" && (
                <HomeView
                  busy={busy}
                  error={error}
                  onPick={handlePick}
                  onOpenPath={handleOpenPath}
                  onNewProject={handleNewProject}
                />
              )}
              {route === "editor" && (
                <EditorWorkspace
                  opened={opened}
                  onProjectChange={(p) => setOpened((o) => (o ? { ...o, project: p } : o))}
                />
              )}
              {route === "appearance" && <AppearancePanel />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
