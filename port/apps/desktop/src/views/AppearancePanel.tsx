import { useTheme, type ThemePreset } from "@palmier/ui";

const presets: { id: ThemePreset; label: string; hint: string }[] = [
  { id: "dark", label: "Dark", hint: "Cinza grafite, opaco" },
  { id: "oled", label: "OLED", hint: "Preto puro" },
  { id: "liquid-glass", label: "Liquid Glass", hint: "Translúcido + blur" },
];

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex items-center justify-between gap-4 py-2">
      <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
        {label}
      </span>
      {children}
    </label>
  );
}

export function AppearancePanel() {
  const t = useTheme();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>
          Aparência
        </h1>
        <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
          Tudo aplica ao vivo, sem recarregar.
        </p>
      </header>

      <section className="pp-surface p-5">
        <div className="mb-3 text-xs uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          Tema
        </div>
        <div className="grid grid-cols-3 gap-3">
          {presets.map((p) => {
            const active = t.preset === p.id;
            return (
              <button
                key={p.id}
                onClick={() => t.setPreset(p.id)}
                className="flex cursor-pointer flex-col items-start gap-1 rounded-lg p-3 text-left transition-colors"
                style={{
                  background: active ? "rgb(var(--c-white) / 0.08)" : "rgb(var(--c-white) / 0.03)",
                  border: `1px solid ${active ? "var(--accent-color)" : "var(--border-subtle)"}`,
                }}
              >
                <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  {p.label}
                </span>
                <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                  {p.hint}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="pp-surface p-5">
        <div className="mb-1 text-xs uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          Ajustes
        </div>

        <Row label="Cor de destaque">
          <input
            type="color"
            value={t.accent}
            onChange={(e) => t.setAccent(e.currentTarget.value)}
            className="h-7 w-12 cursor-pointer rounded border-0 bg-transparent"
          />
        </Row>

        <Row label={`Opacidade das superfícies · ${Math.round(t.surfaceOpacity * 100)}%`}>
          <input
            type="range"
            min={0.2}
            max={1}
            step={0.01}
            value={t.surfaceOpacity}
            onChange={(e) => t.setSurfaceOpacity(Number(e.currentTarget.value))}
            className="w-56 cursor-pointer"
          />
        </Row>

        <Row label={`Blur (liquid glass) · ${t.glassBlur}px`}>
          <input
            type="range"
            min={0}
            max={40}
            step={1}
            value={t.glassBlur}
            onChange={(e) => t.setGlassBlur(Number(e.currentTarget.value))}
            className="w-56 cursor-pointer"
          />
        </Row>

        <Row label="Imagem de fundo (URL)">
          <input
            type="text"
            placeholder="https://… ou vazio"
            defaultValue={t.backgroundImage ?? ""}
            onBlur={(e) => t.setBackgroundImage(e.currentTarget.value.trim() || null)}
            className="w-56 rounded px-2 py-1 text-sm"
            style={{
              background: "rgb(var(--c-white) / 0.06)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-subtle)",
            }}
          />
        </Row>
      </section>

      <div className="pp-raised flex items-center gap-3 p-4">
        <div className="h-10 w-10 rounded-lg" style={{ background: "var(--accent-color)" }} />
        <div>
          <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            Pré-visualização
          </div>
          <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            Este cartão usa os tokens do tema atual.
          </div>
        </div>
      </div>
    </div>
  );
}
