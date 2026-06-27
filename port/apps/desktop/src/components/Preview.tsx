import { useEffect, useRef, useState } from "react";
import { renderFrame, type LayerSource } from "@palmier/engine";
import type { ParsedProject } from "@palmier/schema";
import { loadSources } from "../lib/media";

export function Preview({
  project,
  packageDir,
  frame,
}: {
  project: ParsedProject;
  packageDir: string;
  frame: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [sources, setSources] = useState<Map<string, LayerSource>>(new Map());

  useEffect(() => {
    let alive = true;
    let created: string[] = [];
    loadSources(project, packageDir).then(({ sources, urls }) => {
      created = urls;
      if (alive) setSources(sources);
      else urls.forEach(URL.revokeObjectURL);
    });
    return () => {
      alive = false;
      created.forEach(URL.revokeObjectURL);
    };
  }, [project, packageDir]);

  useEffect(() => {
    const cv = canvasRef.current;
    const ctx = cv?.getContext("2d");
    if (!ctx) return;
    renderFrame(ctx, project.timeline, frame, (ref) => sources.get(ref));
  }, [frame, sources, project]);

  const { width, height } = project.timeline;
  return (
    <div className="pp-glass flex h-full min-h-0 w-full items-center justify-center overflow-hidden p-3">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="max-h-full max-w-full rounded-md"
        style={{ aspectRatio: `${width} / ${height}`, background: "#000" }}
      />
    </div>
  );
}
