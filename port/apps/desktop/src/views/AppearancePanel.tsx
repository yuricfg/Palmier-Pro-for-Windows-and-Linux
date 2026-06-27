import { motion } from "framer-motion";
import { Moon, CircleDot, Droplets, type LucideIcon } from "lucide-react";
import { useTheme, accentSwatches, type ThemePreset } from "@palmier/ui";
import { fadeUp, staggerContainer, spring } from "../components/motion";

const presets: { id: ThemePreset; label: string; hint: string; icon: LucideIcon }[] = [
  { id: "dark", label: "Dark", hint: "Grafite, opaco", icon: Moon },
  { id: "oled", label: "OLED", hint: "Preto puro", icon: CircleDot },
  { id: "liquid-glass", label: "Liquid Glass", hint: "Translúcido + blur", icon: Droplets },
];

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
        {label}
      </span>
      {children}
    </div>
  );
}

export function AppearancePanel() {
  const t = useTheme();

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="mx-auto flex h-full max-w-2xl flex-col gap-6 overflow-auto p-8"
    >
      <motion.header variants={fadeUp}>
        <h1 className="pp-gradient-text text-3xl font-bold tracking-tight">Aparência</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-tertiary)" }}>
          Tudo aplica ao vivo, sem recarregar.
        </p>
      </motion.header>

      <motion.section variants={fadeUp} className="pp-glass p-5">
        <div className="mb-4 text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          Tema
        </div>
        <div className="grid grid-cols-3 gap-3">
          {presets.map((p) => {
            const active = t.preset === p.id;
            const Icon = p.icon;
            return (
              <button
                key={p.id}
                onClick={() => t.setPreset(p.id)}
                className="relative flex cursor-pointer flex-col items-start gap-2 rounded-xl p-3.5 text-left"
                style={{ background: "rgb(var(--c-white) / 0.03)" }}
              >
                {active && (
                  <motion.div
                    layoutId="preset-active"
                    className="absolute inset-0 rounded-xl"
                    style={{ border: "1.5px solid var(--accent-color)", boxShadow: "var(--accent-glow)" }}
                    transition={spring}
                  />
                )}
                <Icon size={18} style={{ color: active ? "var(--accent-color)" : "var(--text-tertiary)" }} />
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
      </motion.section>

      <motion.section variants={fadeUp} className="pp-glass p-5">
        <div className="mb-4 text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          Cor de destaque
        </div>
        <div className="mb-4 flex flex-wrap gap-3">
          {accentSwatches.map((sw) => {
            const active = t.accent.toLowerCase() === sw.accent.toLowerCase();
            return (
              <button
                key={sw.name}
                title={sw.name}
                onClick={() => {
                  t.setAccent(sw.accent);
                  t.setAccent2(sw.accent2);
                }}
                className="h-9 w-9 cursor-pointer rounded-full transition-transform hover:scale-110"
                style={{
                  background: `linear-gradient(135deg, ${sw.accent}, ${sw.accent2})`,
                  outline: active ? "2px solid var(--text-primary)" : "none",
                  outlineOffset: "2px",
                }}
              />
            );
          })}
        </div>
        <Row label="Personalizado (início → fim)">
          <div className="flex gap-2">
            <input
              type="color"
              value={t.accent}
              onChange={(e) => t.setAccent(e.currentTarget.value)}
              className="h-7 w-10 cursor-pointer rounded border-0 bg-transparent"
            />
            <input
              type="color"
              value={t.accent2}
              onChange={(e) => t.setAccent2(e.currentTarget.value)}
              className="h-7 w-10 cursor-pointer rounded border-0 bg-transparent"
            />
          </div>
        </Row>
      </motion.section>

      <motion.section variants={fadeUp} className="pp-glass p-5">
        <div className="mb-1 text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          Vidro & fundo
        </div>
        <Row label={`Opacidade das superfícies · ${Math.round(t.surfaceOpacity * 100)}%`}>
          <input
            type="range"
            className="pp-range w-56"
            min={0.2}
            max={1}
            step={0.01}
            value={t.surfaceOpacity}
            onChange={(e) => t.setSurfaceOpacity(Number(e.currentTarget.value))}
          />
        </Row>
        <Row label={`Blur (liquid glass) · ${t.glassBlur}px`}>
          <input
            type="range"
            className="pp-range w-56"
            min={0}
            max={40}
            step={1}
            value={t.glassBlur}
            onChange={(e) => t.setGlassBlur(Number(e.currentTarget.value))}
          />
        </Row>
        <Row label="Imagem de fundo (URL)">
          <input
            type="text"
            placeholder="https://… ou vazio"
            defaultValue={t.backgroundImage ?? ""}
            onBlur={(e) => t.setBackgroundImage(e.currentTarget.value.trim() || null)}
            className="w-56 rounded-lg px-2.5 py-1.5 text-sm outline-none"
            style={{
              background: "rgb(var(--c-white) / 0.06)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-subtle)",
            }}
          />
        </Row>
      </motion.section>
    </motion.div>
  );
}
