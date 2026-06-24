# Port cross-platform do Palmier Pro

Esforço de reescrever o Palmier Pro (hoje macOS-only: Swift + SwiftUI + AppKit + AVFoundation + CoreImage + Metal) para rodar nativo no Windows (e de quebra Linux/macOS) numa stack web-nativa.

> O código Swift original **não compila fora do macOS**: ~80% toca frameworks exclusivos da Apple. Isto aqui não é um build — é uma reescrita da camada de plataforma reaproveitando o miolo arquitetural.

## Stack alvo

- **Shell**: Tauri (Rust) ou Electron — empacota Win/Mac/Linux de um código só.
- **UI**: web (React/Svelte) — temável (tema, opacidade, background, liquid glass). É o que será construído do zero.
- **Engine de vídeo**: FFmpeg (decode/encode) + WebGPU/WGSL (compositing e color em tempo real).
- **Agente/IA**: integração MCP/Claude — porta quase direto do design original.

## Mapa de portabilidade

### 🟢 Reaproveitável (design/algoritmo portam)
| Origem (Swift) | Destino | Estado |
|---|---|---|
| `Models/*` (Timeline, Clip, Track, Effect, Keyframe, Transform, Crop, TextStyle, MediaManifest) | `port/schema/timeline.ts` | ✅ extraído |
| Formato do pacote `.palmier` | `port/PROJECT_FORMAT.md` | ✅ extraído |
| Amostragem de keyframe / fades / smoothstep | `timeline.ts` + spec | ✅ documentado |
| Shaders `.metal` (Levels, Wheels, Curves, LUT, Vignette, Glow, Grain, ChromaKey, Clarity, HighlightsShadows, HueCurves) | WGSL/GLSL | ⬜ a traduzir (matemática 1:1) |
| Color science (`GradeCurve`, `HueCurves`) | TS + shader | ⬜ |
| `Agent/` — ToolDefinitions, AgentInstructions, protocolo MCP | TS | ⬜ |
| `Export/XMLExporter` (FCPXML) | TS | ⬜ |
| Sync de áudio (correlação cruzada, `Audio/AudioSyncCorrelator`) | TS/Rust + FFT | ⬜ |

### 🔴 Reescrita do zero (não porta)
- Toda a UI: `Editor/`, `Timeline/`, `Inspector/`, `MediaPanel/`, `Preview/`, `Toolbar/`, `UI/` (SwiftUI/AppKit).
- Engine de playback/compositing: `Compositing/`, `Preview/` (AVFoundation/CoreImage/Metal).
- Pipeline de export de vídeo: `Export/ExportService` (AVAssetExportSession → FFmpeg).

## Conteúdo desta pasta

- `PROJECT_FORMAT.md` — spec do pacote `.palmier` (layout, regras, coordenadas, keyframes).
- `schema/timeline.ts` — modelo de dados em TypeScript, fiel ao Swift, com defaults e chaves legadas.

## Próximos passos sugeridos (em ordem de alavancagem)

1. **Validação do schema** — Zod a partir de `timeline.ts` + um loader que aplica os defaults tolerantes (abrir `.palmier` real do app original como teste de fidelidade).
2. **Tradução de um shader** (ex: `Levels.metal` → WGSL) como prova de conceito do color engine.
3. **Camada de agente/MCP** — portar `ToolDefinitions` + `AgentInstructions`.
4. **Esqueleto do app** (Tauri/Electron) + sistema de temas.
