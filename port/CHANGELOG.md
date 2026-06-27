# Changelog — Palmier Pro (port cross-platform)

Reescrita cross-platform (Windows → Linux → demais OS) do Palmier Pro, hoje macOS-only.
Formato baseado em [Keep a Changelog](https://keepachangelog.com/). Versionamento [SemVer](https://semver.org/) pré-1.0:

- **alpha** — fundação e marcos em construção; nada utilizável de ponta a ponta ainda.
- **beta** — editor abre, edita e exporta no Windows.
- **1.0.0** — estável no Windows e Linux.

Cada Marco sobe o *minor* (`0.MARCO.x`); correções sobem o *patch*. Tags git com prefixo `port-`.

## [0.2.0-alpha] — 2026-06-24 — "Editor utilizável (read-only)"

Marcos 2–5 acumulados: a casca virou um editor de verdade (workspace multi-painel), com preview, playback e importação de mídia.

### Added
- **Repaginada visual (SaaS glassmorphism)**: tipografia Inter, ícones Lucide, Framer Motion (transições de rota, entrada em stagger, números com count-up, indicador ativo com `layoutId`), fundo aurora animado (respeita `prefers-reduced-motion`), accent em gradiente + swatches. Liquid Glass é o preset padrão.
- **Timeline read-only**: régua/timecode, trilhas e clipes posicionados por frame, cores por tipo, fades visíveis, marcadores de keyframe, zoom (in/out/fit).
- **`@palmier/engine`** (novo pacote): avaliação pura portada do Swift (amostragem de keyframe, fades, transform/crop/opacidade) — **10/10 testes Vitest** — e compositor Canvas2D.
- **Preview**: painel que compõe o frame real no playhead (vídeo/imagem/texto + transform/crop/opacidade/fade), carregando mídia via comando Rust `read_media` (Blob URL).
- **Playback** frame-driven (RAF): play/pause, atalho Espaço, ⏮ início; o playhead corre em tempo real e o preview anima.
- **Workspace multi-painel**: Media Pool · Preview/Timeline · Inspector, com divisores arrastáveis e tamanhos persistidos (localStorage). Seleção de clipe popula o Inspector (read-only).
- **Home / galeria de projetos**: recentes com thumbnail + nome + resolução + data (registry em app-data), **Novo Projeto** (nome/resolução/fps/pasta), abrir do disco, remover do histórico.
- **Importar mídia** no Media Pool: botão + drag-drop do SO, com toggle **Referenciar / Copiar / Mover** (padrão Referenciar). Persiste no `media.json`.
- **UX**: scrub arrastável (pointer capture) na timeline, atalhos ←/→ (Shift ×10) e Home/End, sem seleção de texto na UI.
- Comandos Rust novos: `read_media`, `read_registry`/`write_registry`, `create_project`, `import_media`, `read_thumbnail`.

### Notes
- Ainda read-only: importar coloca no pool; arrastar pro timeline e editar clipes chega no Marco 4.
- Playback de áudio/vídeo nativo sincronizado fica pro 3b+ (hoje é frame-driven).

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
