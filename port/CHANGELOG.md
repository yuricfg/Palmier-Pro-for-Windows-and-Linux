# Changelog — Palmier Pro (port cross-platform)

Reescrita cross-platform (Windows → Linux → demais OS) do Palmier Pro, hoje macOS-only.
Formato baseado em [Keep a Changelog](https://keepachangelog.com/). Versionamento [SemVer](https://semver.org/) pré-1.0:

- **alpha** — fundação e marcos em construção; nada utilizável de ponta a ponta ainda.
- **beta** — editor abre, edita e exporta no Windows.
- **1.0.0** — estável no Windows e Linux.

Cada Marco sobe o *minor* (`0.MARCO.x`); correções sobem o *patch*. Tags git com prefixo `port-`.

## [0.1.0-alpha] — 2026-06-24 — "Fundação"

Marco 1: núcleo de dados + casca temática, rodando nativo no Windows (Tauri 2 + React 19 + TypeScript + Vite + Tailwind v4 + Zustand, monorepo pnpm em `port/`).

### Added
- **`@palmier/schema`** — modelo de dados portado 1:1 do Swift (`Sources/PalmierPro/Models/*`, `Project/VideoProject.swift`): `Timeline`, `Track`, `Clip`, `Transform`, `Crop`, `Keyframe`/`KeyframeTrack`, `Effect`, `TextStyle`, `MediaManifest`.
  - Validador Zod replicando os decoders tolerantes do Swift (defaults para chaves ausentes + chaves legadas).
  - Loader/saver puro do pacote `.palmier` (`parseProject`/`serializeProject`), IO desacoplado.
  - 8/8 testes Vitest: fidelidade de valores, round-trip estável e tolerância de defaults.
- **`@palmier/ui`** — design tokens portados de `UI/AppTheme.swift`; sistema de tema por CSS variables com presets **Dark / OLED / Liquid Glass** e knobs em runtime (accent, opacidade de superfície, blur, imagem de fundo) via store Zustand.
- **`@palmier/desktop`** — app Tauri 2:
  - Comandos Rust `read_project_package` / `write_project_package` para o pacote `.palmier` (diretório).
  - Shell React: sidebar, tela **Início** que abre um `.palmier` e mostra resumo (fps, resolução, duração, trilhas, clipes, mídia, breakdown por tipo) e painel **Aparência** com troca de tema ao vivo.
- Documentação do port: `README.md` (mapa de portabilidade), `PROJECT_FORMAT.md` (spec do pacote `.palmier`).

### Verified
- `pnpm --filter @palmier/schema test` — 8/8 verdes.
- `pnpm -r typecheck` — verde.
- Build do frontend (Vite) e `cargo check` do Rust — OK.
- `tauri dev` abre a janela no Windows; abrir `sample.palmier` exibe o resumo correto; troca de tema aplica ao vivo.
