// Filesystem IO for the `.palmier` project package (a directory bundle).
// Reads/writes raw JSON file contents; all parsing/validation lives in the
// TypeScript @palmier/schema package. Mirrors VideoProject read/write semantics.

use std::fs;
use std::path::{Path, PathBuf};

use base64::Engine as _;
use serde::{Deserialize, Serialize};

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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            read_project_package,
            write_project_package
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
