use tauri_plugin_sql::{Migration, MigrationKind};

mod gsi;

/// Draft-history schema. Migrations only ever ADD structure going forward —
/// never DROP or rewrite existing user tables — so an app update never
/// destroys previously saved draft history.
fn migrations() -> Vec<Migration> {
  vec![Migration {
    version: 1,
    description: "create_drafts_table",
    sql: "CREATE TABLE IF NOT EXISTS drafts (
        id TEXT PRIMARY KEY,
        created_at TEXT NOT NULL,
        patch TEXT NOT NULL,
        ally_heroes TEXT NOT NULL,
        enemy_heroes TEXT NOT NULL,
        analysis_snapshot TEXT NOT NULL,
        label TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_drafts_created_at ON drafts(created_at DESC);",
    kind: MigrationKind::Up,
  }]
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  let mut builder = tauri::Builder::default()
    .plugin(tauri_plugin_http::init())
    .plugin(tauri_plugin_store::Builder::default().build())
    .plugin(
      tauri_plugin_sql::Builder::default()
        .add_migrations("sqlite:dota-assistant.db", migrations())
        .build(),
    )
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_dialog::init())
    .invoke_handler(tauri::generate_handler![
      gsi::gsi_start,
      gsi::gsi_write_config,
      gsi::gsi_find_cfg_dirs
    ]);

  #[cfg(desktop)]
  {
    builder = builder.plugin(tauri_plugin_global_shortcut::Builder::new().build());
  }

  builder
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
