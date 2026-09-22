//! Dota 2 Game State Integration (GSI) support.
//!
//! GSI is Valve's own, officially documented mechanism for a game client to
//! POST live match state (draft picks/bans, hero, game clock, etc.) to a
//! local HTTP endpoint that the player configures via a plain-text .cfg
//! file in their own Dota 2 install. This is NOT process/memory access and
//! carries none of the anti-cheat risk that reading the game's memory would
//! — it is the same sanctioned mechanism used by many existing overlay
//! tools and OBS. This app never touches the game process directly.
//!
//! The server here only listens on 127.0.0.1 and forwards each payload,
//! unparsed, to the frontend as a Tauri event — all interpretation (hero
//! name mapping, draft-state extraction) happens in TypeScript so it can be
//! tested and iterated on without a Rust rebuild.

use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

use tauri::{AppHandle, Emitter};

static GSI_SERVER_STARTED: AtomicBool = AtomicBool::new(false);

/// Starts the local GSI listener on `port`, if it isn't already running.
/// Idempotent — safe to call every app launch.
#[tauri::command]
pub fn gsi_start(app: AppHandle, port: u16) -> Result<(), String> {
  if GSI_SERVER_STARTED.swap(true, Ordering::SeqCst) {
    return Ok(()); // already running
  }

  let server = tiny_http::Server::http(("127.0.0.1", port))
    .map_err(|e| format!("Could not bind 127.0.0.1:{port} — {e}"))?;
  let server = Arc::new(server);

  std::thread::spawn(move || {
    for mut request in server.incoming_requests() {
      let mut body = String::new();
      if request.as_reader().read_to_string(&mut body).is_ok() {
        if let Ok(json) = serde_json::from_str::<serde_json::Value>(&body) {
          let _ = app.emit("gsi-update", json);
        }
      }
      let _ = request.respond(tiny_http::Response::from_string("ok"));
    }
  });

  Ok(())
}

/// Writes the GSI config file Dota 2 needs into the given cfg directory,
/// pointing it at our local listener. Overwrites any previous config this
/// app wrote (same filename), never touches other GSI configs.
#[tauri::command]
pub fn gsi_write_config(cfg_dir: String, port: u16) -> Result<String, String> {
  let dir = PathBuf::from(&cfg_dir);
  if !dir.is_dir() {
    return Err(format!("Not a folder: {cfg_dir}"));
  }
  let file_path = dir.join("gamestate_integration_dota_draft_assistant.cfg");
  let contents = format!(
    r#""Dota Draft Assistant GSI"
{{
    "uri"           "http://127.0.0.1:{port}/"
    "timeout"       "5.0"
    "buffer"        "0.1"
    "throttle"      "0.1"
    "heartbeat"     "30.0"
    "data"
    {{
        "provider"      "1"
        "map"           "1"
        "player"        "1"
        "hero"          "1"
        "abilities"     "0"
        "items"         "0"
        "draft"         "1"
        "wearables"     "0"
    }}
    "auth"
    {{
    }}
}}
"#
  );
  std::fs::write(&file_path, contents).map_err(|e| format!("Could not write config: {e}"))?;
  Ok(file_path.to_string_lossy().to_string())
}

/// Best-effort search for the player's Dota 2 `game/dota/cfg` folder across
/// common Steam library locations on this OS. Returns only folders that
/// actually exist — never guesses one into existence.
#[tauri::command]
pub fn gsi_find_cfg_dirs() -> Vec<String> {
  let mut candidates: Vec<PathBuf> = Vec::new();

  #[cfg(target_os = "windows")]
  {
    for drive in ["C", "D", "E", "F"] {
      candidates.push(PathBuf::from(format!(
        "{drive}:\\Program Files (x86)\\Steam\\steamapps\\common\\dota 2 beta\\game\\dota\\cfg"
      )));
      candidates.push(PathBuf::from(format!(
        "{drive}:\\SteamLibrary\\steamapps\\common\\dota 2 beta\\game\\dota\\cfg"
      )));
      candidates.push(PathBuf::from(format!(
        "{drive}:\\Games\\Steam\\steamapps\\common\\dota 2 beta\\game\\dota\\cfg"
      )));
    }
  }

  #[cfg(target_os = "linux")]
  {
    if let Ok(home) = std::env::var("HOME") {
      candidates.push(PathBuf::from(format!(
        "{home}/.steam/steam/steamapps/common/dota 2 beta/game/dota/cfg"
      )));
      candidates.push(PathBuf::from(format!(
        "{home}/.local/share/Steam/steamapps/common/dota 2 beta/game/dota/cfg"
      )));
    }
  }

  #[cfg(target_os = "macos")]
  {
    if let Ok(home) = std::env::var("HOME") {
      candidates.push(PathBuf::from(format!(
        "{home}/Library/Application Support/Steam/steamapps/common/dota 2 beta/game/dota/cfg"
      )));
    }
  }

  candidates
    .into_iter()
    .filter(|p| p.is_dir())
    .map(|p| p.to_string_lossy().to_string())
    .collect()
}
