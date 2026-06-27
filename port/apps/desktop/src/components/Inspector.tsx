import { useState, type ReactNode } from "react";
import { SlidersHorizontal, Volume2, Type, Sparkles, type LucideIcon } from "lucide-react";
import type { Clip, ParsedProject } from "@palmier/schema";

type Tab = "adjust" | "audio" | "text" | "ai";
const tabs: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: "adjust", label: "Ajustes", icon: SlidersHorizontal },
  { id: "audio", label: "Áudio", icon: Volume2 },
  { id: "text", label: "Texto", icon: Type },
  { id: "ai", label: "IA", icon: Sparkles },
];

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 text-xs">
      <span style={{ color: "var(--text-muted)" }}>{label}</span>
      <span className="tabular-nums" style={{ color: "var(--text-secondary)" }}>
        {children}
      </span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border-b pb-3 pt-1" style={{ borderColor: "var(--border-subtle)" }}>
      <div className="mb-1 text-[10px] font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
        {title}
      </div>
      {children}
    </div>
  );
}

const n = (v: number, d = 2) => Number(v.toFixed(d)).toString();

export function Inspector({
  project,
  clip,
}: {
  project: ParsedProject;
  clip: Clip | undefined;
}) {
  const [tab, setTab] = useState<Tab>("adjust");
  const mediaName = clip ? project.manifest?.entries.find((e) => e.id === clip.mediaRef)?.name : undefined;

  return (
    <div className="pp-glass flex h-full flex-col overflow-hidden">
      <div className="flex items-center gap-1 px-2 py-2" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        {tabs.map((t) => {
          const active = tab === t.id;
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              title={t.label}
              className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition-colors"
              style={{
                background: active ? "rgb(var(--c-white) / 0.08)" : "transparent",
                color: active ? "var(--text-primary)" : "var(--text-tertiary)",
              }}
            >
              <Icon size={14} />
            </button>
          );
        })}
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-3">
        {!clip ? (
          <div className="flex h-full items-center justify-center px-4 text-center text-xs" style={{ color: "var(--text-muted)" }}>
            Selecione um clipe na timeline.
          </div>
        ) : (
          <>
            <Section title="Clipe">
              <Row label="Nome">{clip.mediaType === "text" ? clip.textContent || "Texto" : mediaName ?? clip.mediaRef}</Row>
              <Row label="Tipo">{clip.mediaType}</Row>
              <Row label="Início (frame)">{clip.startFrame}</Row>
              <Row label="Duração (frames)">{clip.durationFrames}</Row>
              <Row label="Velocidade">{n(clip.speed)}×</Row>
            </Section>

            {tab === "adjust" && (
              <>
                <Section title="Transform">
                  <Row label="Posição">{`${n(clip.transform.centerX)}, ${n(clip.transform.centerY)}`}</Row>
                  <Row label="Tamanho">{`${n(clip.transform.width)} × ${n(clip.transform.height)}`}</Row>
                  <Row label="Rotação">{`${n(clip.transform.rotation, 1)}°`}</Row>
                  <Row label="Opacidade">{`${Math.round(clip.opacity * 100)}%`}</Row>
                </Section>
                <Section title={`Efeitos (${clip.effects?.length ?? 0})`}>
                  {clip.effects?.length ? (
                    clip.effects.map((e) => (
                      <Row key={e.id} label={e.type}>{e.enabled ? "on" : "off"}</Row>
                    ))
                  ) : (
                    <div className="py-1 text-xs" style={{ color: "var(--text-muted)" }}>Nenhum efeito.</div>
                  )}
                </Section>
              </>
            )}

            {tab === "audio" && (
              <Section title="Áudio">
                <Row label="Volume">{`${Math.round(clip.volume * 100)}%`}</Row>
                <Row label="Fade in (frames)">{clip.fadeInFrames}</Row>
                <Row label="Fade out (frames)">{clip.fadeOutFrames}</Row>
              </Section>
            )}

            {tab === "text" && (
              clip.mediaType === "text" && clip.textStyle ? (
                <Section title="Texto">
                  <Row label="Conteúdo">{clip.textContent || "—"}</Row>
                  <Row label="Fonte">{clip.textStyle.fontName}</Row>
                  <Row label="Tamanho">{n(clip.textStyle.fontSize, 0)}</Row>
                  <Row label="Alinhamento">{clip.textStyle.alignment}</Row>
                </Section>
              ) : (
                <div className="py-2 text-xs" style={{ color: "var(--text-muted)" }}>Este clipe não é de texto.</div>
              )
            )}

            {tab === "ai" && (
              <div className="py-2 text-xs" style={{ color: "var(--text-muted)" }}>
                Edição por IA chega num marco futuro.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
