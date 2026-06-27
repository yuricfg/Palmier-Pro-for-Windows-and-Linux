# Mapa de paridade — Palmier Pro (original macOS → port)

Inventário das funcionalidades do app original (247 arquivos Swift), com status no port.
Legenda: ✅ feito · 🟡 parcial · ⬜ não começado.

## Shell do editor (workspace)
O original é um **workspace multi-painel**, não telas separadas: Media Pool (esquerda) · Preview (centro) · Inspector (direita) · Timeline (base) · painel do Agente. Layout presets (Default/Media/Vertical), title bar custom, tour de onboarding, atividade do projeto.
- ⬜ Layout multi-painel redimensionável · ⬜ presets de layout · ⬜ tour · ⬜ title bar custom
- Fonte: `Editor/` (EditorView, EditorWindowController, TitleBarView, Tour/, ProjectActivityView)

## Home / Projetos
- 🟡 Abrir projeto + resumo (temos). ⬜ registro de projetos recentes, projetos de amostra, thumbnails, overlays de boas-vindas/update.
- Fonte: `Project/` (HomeView, ProjectCard, ProjectRegistry, SampleProjectService, Welcome/UpdateOverlay)

## Timeline (16 arq.)
- ✅ Render read-only (trilhas, clipes, régua, fades, keyframes), ✅ scrub arrastável, ✅ zoom, ✅ playhead.
- ⬜ Edição: selecionar, mover, trim, cortar, ripple/overwrite, snapping, auto-scroll, ferramentas (ToolMode), múltiplas seleções, link de clipes.
- Fonte: `Timeline/`, `Editor/RippleEngine`, `Editor/OverwriteEngine`, `Editor/ToolMode`, `Editor/ViewModel/EditorViewModel+*` (Clipboard, ClipMutations, Ripple, Tracks, Linking, Keyframes…)

## Preview / Compositing (12 + 19 arq.)
- ✅ Compositor Canvas2D de 1 frame (imagem/texto/transform/crop/opacidade/fade) + ✅ playback frame-driven.
- ⬜ Playback de vídeo/áudio nativo sincronizado · ⬜ color scopes (waveform/vectorscope) · ⬜ overlays de transform/crop interativos no preview · ⬜ snapping de canvas.
- Fonte: `Preview/`, `Compositing/` (CustomVideoCompositor, FrameRenderer, ColorScopes, ColorWheels, CompositionBuilder)

## Inspector
- ⬜ **Adjust** (color grading): Levels, Curves, Hue Curves, Color Wheels, Highlights/Shadows, Clarity, Vignette, Grain, ChromaKey, LUT.
- ⬜ **Audio**: volume, fades, keyframes de volume (dB).
- ⬜ **Text**: font picker, estilo (cor, sombra, fundo, borda, alinhamento).
- ⬜ **AI Edit** tab. ⬜ Keyframes lane. ⬜ campos scrubbable, color field.
- Fonte: `Inspector/Tabs/{AdjustTab,AudioTab,TextTab,AIEditTab}`, `Inspector/Components/*`, `Inspector/Keyframes/KeyframesLane`

## Media Pool (media pool!)
- ⬜ **Media tab**: importar arquivos, pastas/organização, thumbnails, waveforms, drag pra timeline.
- ⬜ **Music tab** · ⬜ **Captions tab** · toasts.
- Fonte: `MediaPanel/` (MediaTab, MusicTab, CaptionsTab, MediaPanelView), `Editor/ViewModel/EditorViewModel+MediaLibrary`

## Geração por IA (21 arq.)
- ⬜ Catálogo de modelos (vídeo/imagem/áudio/upscale), estimador de custo, preferências.
- ⬜ Submissões (gerar vídeo/imagem/música/áudio), AI Edit menu, drop zone, compressor de vídeo.
- Fonte: `Generation/` (Catalog/*, Submission/*, Edit/*, GenerationService, GenerationBackend)

## Agente IA / MCP (33 arq.) — o "AI-native"
- ⬜ Painel de chat + sessões, servidor MCP (HTTP), integração Claude.
- ⬜ ~12 grupos de ferramentas: clips, color, effect, captions, texts, timeline, import, generate, audio-sync, search, folders, inspect-timeline.
- Fonte: `Agent/` (Panel/*, MCP/*, Tools/{ToolDefinitions,AgentInstructions,ToolExecutor+*}, ChatSessionStore, Clients/*)

## Color science (11 shaders)
- ⬜ Traduzir kernels `.metal` → WGSL: Levels, GradeCurves, HueCurves, Wheels, HighlightsShadows, Clarity, Vignette, Glow, Grain, ChromaKey, LUTTetra.
- Fonte: `Metal/*.metal`, `Compositing/Kernels/*`, `Compositing/EffectRegistry`

## Áudio / Transcrição / Busca
- ⬜ Waveforms, envelope, sync de áudio (correlação cruzada).
- ⬜ Transcrição (Speech→legendas), cache, busca de transcrição.
- ⬜ Índice de busca do projeto (clips/mídia/transcrições).
- Fonte: `Audio/`, `Transcription/`, `Search/`

## Export
- ⬜ Exportar vídeo (encode via FFmpeg) · ⬜ FCPXML (`XMLExporter`) · ⬜ exportar pacote `.palmier`.
- Fonte: `Export/` (ExportService, XMLExporter, PalmierProjectExporter)

## Conta / Backend / Sistema
- ⬜ Auth (Clerk), Convex, créditos/top-off (billing de geração). ⬜ Settings (account/agent/models/notifications/privacy/storage). ⬜ Telemetria (Sentry), updater (Sparkle→Tauri), notificações. ⬜ Help/feedback/shortcuts.
- Fonte: `Account/`, `Settings/`, `Telemetry/`, `App/`, `Help/`
- Nota: Convex/Clerk/Sentry têm SDK web/JS → portam melhor que o resto.

---

## Status atual do port
✅ Fundação (dados/schema/IO) · ✅ tema · ✅ Home (abrir+resumo, parcial) · ✅ Timeline read-only + scrub + zoom · ✅ Preview (1 frame, img/texto) · ✅ Playback frame-driven.

## Ordem sugerida pra "sentir" o original
1. **Workspace shell** (multi-painel: Media Pool · Preview · Inspector · Timeline) — muda a *cara* pra do original mesmo com painéis ainda magros.
2. **Media Pool** (importar/organizar mídia, drag pra timeline) + **Inspector** básico (transform/text/audio).
3. **Edição na timeline** (selecionar/mover/trim/cortar + ripple/overwrite).
4. **Color** (shaders WGSL + Adjust tab) · **Export** (FFmpeg + FCPXML).
5. **Agente IA/MCP** (chat + ferramentas) — o diferencial AI-native.
6. **Conta/geração/transcrição** conforme necessidade.
