import { useState } from "react";
import { Sidebar, type Route } from "./components/Sidebar";
import { HomeView } from "./views/HomeView";
import { AppearancePanel } from "./views/AppearancePanel";
import { pickAndOpenProject, type OpenedProject } from "./lib/project";

export function App() {
  const [route, setRoute] = useState<Route>("home");
  const [opened, setOpened] = useState<OpenedProject | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleOpen() {
    setBusy(true);
    setError(null);
    try {
      const result = await pickAndOpenProject();
      if (result) setOpened(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="pp-app flex h-full w-full">
      <Sidebar route={route} onNavigate={setRoute} />
      <main className="flex-1 overflow-auto p-8">
        {route === "home" ? (
          <HomeView opened={opened} busy={busy} error={error} onOpen={handleOpen} />
        ) : (
          <AppearancePanel />
        )}
      </main>
    </div>
  );
}
