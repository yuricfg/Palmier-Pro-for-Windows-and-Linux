# Formato do projeto `.palmier`

Extraído de `Sources/PalmierPro/Project/VideoProject.swift` e `Sources/PalmierPro/Utilities/Constants.swift` (`enum Project`).

Um projeto é um **pacote** (diretório) com extensão `.palmier` (UTI `io.palmier.project`, conforma a `package`). No macOS aparece como arquivo único; em qualquer outro SO é só uma pasta.

## Layout do pacote

```
MeuProjeto.palmier/
├── project.json          # Timeline (obrigatório) — decodifica em Timeline
├── media.json            # MediaManifest (opcional) — entradas + pastas de mídia
├── generation-log.json   # GenerationLog (opcional) — histórico de geração por IA
├── thumbnail.jpg         # Miniatura (opcional) — 1º frame de vídeo, ~640px lado maior, JPEG q=0.7
├── chat/                 # Sessões do agente (opcional) — <uuid>.json por sessão
│   └── <session-uuid>.json
└── media/                # Mídia importada copiada pra dentro do projeto (opcional)
    └── ...
```

Constantes (de `enum Project`):

| Constante | Valor |
|---|---|
| `fileExtension` | `palmier` |
| `typeIdentifier` | `io.palmier.project` |
| `timelineFilename` | `project.json` |
| `manifestFilename` | `media.json` |
| `generationLogFilename` | `generation-log.json` |
| `thumbnailFilename` | `thumbnail.jpg` |
| `mediaDirectoryName` | `media` |
| `registryFilename` | `project-registry.json` (índice global, fora do pacote) |
| `defaultProjectName` | `Untitled Project` |
| diretório de armazenamento | `~/Documents/Palmier Pro` |

## Regras de leitura/escrita

- **Leitura**: `project.json` é obrigatório; se faltar ou não decodificar → erro. `media.json` corrompido → erro. `generation-log.json` inválido é ignorado silenciosamente (`try?`).
- **Escrita**: atômica por arquivo. Em "Save As", `media/` e `thumbnail.jpg` são copiados do projeto de origem quando não foram regenerados.
- **Tolerância a versão**: todos os decoders Swift toleram chaves ausentes e aplicam defaults (ver `timeline.ts`). Isso é o contrato de compatibilidade — o port **precisa** replicar os mesmos defaults pra abrir projetos antigos.

## Referência de mídia

`Clip.mediaRef` aponta para `MediaManifestEntry.id`. A entrada tem um `MediaSource`:
- `external` → caminho absoluto na máquina (não portável entre máquinas/SOs).
- `project` → caminho relativo dentro de `media/` (portável; preferir no port).

`MediaResolver` no app original resolve `mediaRef` → URL de arquivo. No port, resolver `project` relativo a `<pacote>/media/` e `external` pelo caminho absoluto (com fallback de relink quando o arquivo sumir — ver `missingMediaRefs`).

## Sistema de coordenadas (importante pro render)

- **Espaço de canvas normalizado**: `Transform.centerX/centerY/width/height` em 0…1 relativo ao frame. `width=1,height=1,center=0.5,0.5` = preenche o canvas.
- **Frames, não segundos**: tudo na timeline é em frames inteiros; converte com `Timeline.fps`. `startFrame`, `durationFrames`, `trimStartFrame/EndFrame`.
- **Keyframes são clip-relativos**: `Keyframe.frame` é offset a partir do início do clip (0 = início). A API pública do Swift converte pra frame absoluto (`startFrame + offset`); o JSON guarda o offset.
- **`volumeTrack` é em dB**, os demais valores são lineares/normalizados. `volume` (estático) é ganho linear.
- **Envelope de fade**: `fadeInFrames/fadeOutFrames` com interpolação `linear` ou `smooth` (smoothstep). Multiplica a opacidade (visual) e o volume (áudio).

## Amostragem de keyframe (algoritmo, de `Keyframe.swift`)

```
sample(frame):
  se vazio        -> fallback
  se 1 kf         -> kf[0].value
  se frame <= primeiro -> primeiro.value   (clamp)
  se frame >= último   -> último.value     (clamp)
  acha par [a,b] em volta; t = (frame - a.frame)/(b.frame - a.frame)
  interpolationOut de A decide:
    hold   -> a.value
    linear -> lerp(a,b,t)
    smooth -> lerp(a,b, smoothstep(t))   onde smoothstep(t)=t*t*(3-2t)
```

Para `AnimPair` interpola componente a componente; para `Crop` interpola cada inset. Para hue curves a avaliação é **cíclica** (envolve a costura 0/1).
