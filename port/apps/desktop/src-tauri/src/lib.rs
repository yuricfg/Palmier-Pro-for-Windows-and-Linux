// Filesystem IO for the `.palmier` project package (a directory bundle).
// Reads/writes raw JSON file contents; all parsing/validation lives in the
// TypeScript @palmier/schema package. Mirrors VideoProject read/write semantics.

use std::fs;
use std::path::{Path, PathBuf};

use base64::Engine as _;
use serde::{Deserialize, Serialize};
use tauri::Manager;

const TIMELINE_FILE: &str = "project.json";
const MANIFEST_FILE: &str = "media.json";
const GENERATION_LOG_FILE: &str = "generation-log.json";
const THUMBNAIL_FILE: &str = "thumbnail.jpg";
const CHAT_DIR: &str = "chat";

#[derive(Serialize)]
struct ChatFile {
    name: String,
    json: String,
}

#[derive(Serialize)]
struct RawProjectPackage {
    path: String,
    name: String,
    timeline_json: String,
    manifest_json: Option<String>,
    generation_log_json: Option<String>,
    thumbnail_base64: Option<String>,
    chat_sessions: Vec<ChatFile>,
}

#[derive(Deserialize)]
struct WritePayload {
    timeline_json: String,
    manifest_json: Option<String>,
    generation_log_json: Option<String>,
    chat_sessions: Option<Vec<ChatFileIn>>,
}

#[derive(Deserialize)]
struct ChatFileIn {
    name: String,
    json: String,
}

fn read_optional(dir: &Path, name: &str) -> Option<String> {
    fs::read_to_string(dir.join(name)).ok()
}

fn project_name(dir: &Path) -> String {
    dir.file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("Untitled Project")
        .to_string()
}

#[tauri::command]
fn read_project_package(path: String) -> Result<RawProjectPackage, String> {
    let dir = PathBuf::from(&path);
    if !dir.is_dir() {
        return Err(format!("Not a project package directory: {path}"));
    }

    let timeline_json = fs::read_to_string(dir.join(TIMELINE_FILE))
        .map_err(|e| format!("Missing or unreadable {TIMELINE_FILE}: {e}"))?;

    let thumbnail_base64 = fs::read(dir.join(THUMBNAIL_FILE))
        .ok()
        .map(|bytes| base64::engine::general_purpose::STANDARD.encode(bytes));

    let mut chat_sessions = Vec::new();
    if let Ok(entries) = fs::read_dir(dir.join(CHAT_DIR)) {
        for entry in entries.flatten() {
            let p = entry.path();
            if p.extension().and_then(|e| e.to_str()) == Some("json") {
                if let Ok(json) = fs::read_to_string(&p) {
                    let name = p
                        .file_name()
                        .and_then(|n| n.to_str())
                        .unwrap_or_default()
                        .to_string();
                    chat_sessions.push(ChatFile { name, json });
                }
            }
        }
    }

    Ok(RawProjectPackage {
        name: project_name(&dir),
        path,
        timeline_json,
        manifest_json: read_optional(&dir, MANIFEST_FILE),
        generation_log_json: read_optional(&dir, GENERATION_LOG_FILE),
        thumbnail_base64,
        chat_sessions,
    })
}

#[tauri::command]
fn write_project_package(path: String, payload: WritePayload) -> Result<(), String> {
    let dir = PathBuf::from(&path);
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;

    fs::write(dir.join(TIMELINE_FILE), payload.timeline_json).map_err(|e| e.to_string())?;

    if let Some(manifest) = payload.manifest_json {
        fs::write(dir.join(MANIFEST_FILE), manifest).map_err(|e| e.to_string())?;
    }
    if let Some(log) = payload.generation_log_json {
        fs::write(dir.join(GENERATION_LOG_FILE), log).map_err(|e| e.to_string())?;
    }
    if let Some(sessions) = payload.chat_sessions {
        let chat_dir = dir.join(CHAT_DIR);
        fs::create_dir_all(&chat_dir).map_err(|e| e.to_string())?;
        for s in sessions {
            fs::write(chat_dir.join(s.name), s.json).map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

#[tauri::command]
fn read_media(path: String) -> Result<Vec<u8>, String> {
    std::fs::read(&path).map_err(|e| format!("read_media {path}: {e}"))
}

// ---- Recent-projects registry ----

#[derive(Serialize, Deserialize, Clone)]
struct RegistryEntry {
    path: String,
    name: String,
    #[serde(default)]
    last_opened: String,
    #[serde(default)]
    width: u32,
    #[serde(default)]
    height: u32,
    #[serde(default)]
    fps: u32,
}

fn registry_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.join("project-registry.json"))
}

#[tauri::command]
fn read_registry(app: tauri::AppHandle) -> Result<Vec<RegistryEntry>, String> {
    let p = registry_path(&app)?;
    match fs::read_to_string(&p) {
        Ok(s) => serde_json::from_str(&s).map_err(|e| e.to_string()),
        Err(_) => Ok(vec![]),
    }
}

#[tauri::command]
fn write_registry(app: tauri::AppHandle, entries: Vec<RegistryEntry>) -> Result<(), String> {
    let p = registry_path(&app)?;
    let s = serde_json::to_string_pretty(&entries).map_err(|e| e.to_string())?;
    fs::write(p, s).map_err(|e| e.to_string())
}

#[tauri::command]
fn read_thumbnail(path: String) -> Option<String> {
    fs::read(PathBuf::from(path).join(THUMBNAIL_FILE))
        .ok()
        .map(|b| base64::engine::general_purpose::STANDARD.encode(b))
}

// ---- New project ----

#[tauri::command]
fn create_project(dir: String, name: String, fps: u32, width: u32, height: u32) -> Result<String, String> {
    let pkg = PathBuf::from(&dir).join(format!("{name}.palmier"));
    if pkg.exists() {
        return Err(format!("Já existe um projeto chamado {name} aqui."));
    }
    fs::create_dir_all(pkg.join("media")).map_err(|e| e.to_string())?;
    let timeline = serde_json::json!({
        "fps": fps, "width": width, "height": height, "settingsConfigured": true, "tracks": []
    });
    fs::write(pkg.join(TIMELINE_FILE), serde_json::to_string_pretty(&timeline).unwrap()).map_err(|e| e.to_string())?;
    let media = serde_json::json!({ "version": 2, "entries": [], "folders": [] });
    fs::write(pkg.join(MANIFEST_FILE), serde_json::to_string_pretty(&media).unwrap()).map_err(|e| e.to_string())?;
    Ok(pkg.to_string_lossy().to_string())
}

// ---- Import media (reference / copy / move) ----

#[derive(Serialize)]
struct ImportedMedia {
    source_kind: String, // "external" | "project"
    value: String,       // absolute path (external) or "media/<file>" (project)
    name: String,
    ext: String,
}

#[tauri::command]
fn import_media(project_dir: String, src: String, mode: String) -> Result<ImportedMedia, String> {
    let src_path = PathBuf::from(&src);
    let name = src_path.file_name().and_then(|s| s.to_str()).unwrap_or("media").to_string();
    let ext = src_path.extension().and_then(|s| s.to_str()).unwrap_or("").to_lowercase();

    if mode == "reference" {
        return Ok(ImportedMedia { source_kind: "external".into(), value: src, name, ext });
    }
    if mode != "copy" && mode != "move" {
        return Err(format!("modo de import desconhecido: {mode}"));
    }

    let media_dir = PathBuf::from(&project_dir).join("media");
    fs::create_dir_all(&media_dir).map_err(|e| e.to_string())?;
    let mut dest = media_dir.join(&name);
    if dest.exists() {
        let millis = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_millis())
            .unwrap_or(0);
        dest = media_dir.join(format!("{millis}-{name}"));
    }
    fs::copy(&src_path, &dest).map_err(|e| e.to_string())?;
    if mode == "move" {
        let _ = fs::remove_file(&src_path);
    }
    let file = dest.file_name().unwrap().to_string_lossy().to_string();
    Ok(ImportedMedia { source_kind: "project".into(), value: format!("media/{file}"), name, ext })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            read_project_package,
            write_project_package,
            read_media,
            read_registry,
            write_registry,
            read_thumbnail,
            create_project,
            import_media
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
