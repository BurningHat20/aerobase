use std::fs;
use tauri::Manager;

use crate::models::ConnectionProfile;

// ── Helpers ───────────────────────────────────────────────────────────────────

fn profiles_path(app: &tauri::AppHandle) -> Result<std::path::PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Cannot resolve app data dir: {e}"))?;
    fs::create_dir_all(&dir).map_err(|e| format!("Cannot create app data dir: {e}"))?;
    Ok(dir.join("profiles.json"))
}

fn read_profiles(app: &tauri::AppHandle) -> Result<Vec<ConnectionProfile>, String> {
    let path = profiles_path(app)?;
    if !path.exists() {
        return Ok(vec![]);
    }
    let raw = fs::read_to_string(&path).map_err(|e| format!("Cannot read profiles: {e}"))?;
    serde_json::from_str(&raw).map_err(|e| format!("Corrupt profiles file: {e}"))
}

fn write_profiles(app: &tauri::AppHandle, profiles: &[ConnectionProfile]) -> Result<(), String> {
    let path = profiles_path(app)?;
    let json =
        serde_json::to_string_pretty(profiles).map_err(|e| format!("Serialise error: {e}"))?;
    fs::write(&path, json).map_err(|e| format!("Cannot write profiles: {e}"))
}

// ── Commands ──────────────────────────────────────────────────────────────────

/// Returns all saved connection profiles (no passwords stored).
#[tauri::command]
pub async fn get_profiles(app: tauri::AppHandle) -> Result<Vec<ConnectionProfile>, String> {
    read_profiles(&app)
}

/// Upsert a profile by id.
/// If a profile with the same id already exists it is replaced; otherwise appended.
#[tauri::command]
pub async fn save_profile(
    app: tauri::AppHandle,
    profile: ConnectionProfile,
) -> Result<(), String> {
    let mut profiles = read_profiles(&app)?;
    if let Some(existing) = profiles.iter_mut().find(|p| p.id == profile.id) {
        *existing = profile;
    } else {
        profiles.push(profile);
    }
    write_profiles(&app, &profiles)
}

/// Delete a profile by id.
#[tauri::command]
pub async fn delete_profile(app: tauri::AppHandle, id: String) -> Result<(), String> {
    let mut profiles = read_profiles(&app)?;
    profiles.retain(|p| p.id != id);
    write_profiles(&app, &profiles)
}