use sqlx::mysql::{MySqlConnectOptions, MySqlPoolOptions};
use sqlx::{MySqlPool, Row};
use std::sync::Mutex;
use tauri::State;

// Holds our active connection pool
struct AppState {
    db_pool: Mutex<Option<MySqlPool>>,
}

#[tauri::command]
async fn connect_to_db(
    state: State<'_, AppState>,
    host: String,
    port: u16,
    user: String,
    pass: String,
) -> Result<Vec<String>, String> {
    
    // 1. Build the base options WITHOUT a password
    let mut options = MySqlConnectOptions::new()
        .host(&host)
        .port(port)
        .username(&user);

    // 2. ONLY attach the password if the string is not empty
    if !pass.trim().is_empty() {
        options = options.password(&pass);
    }

    // Attempt to connect to the MySQL Server
    match MySqlPoolOptions::new()
        .max_connections(5)
        .connect_with(options)
        .await
    {
        Ok(pool) => {
            // If connected, fetch all databases!
            let rows = sqlx::query("SHOW DATABASES;")
                .fetch_all(&pool)
                .await
                .map_err(|e| format!("Failed to fetch databases: {}", e))?;

            let mut databases = Vec::new();
            for row in rows {
                let db_name: String = row.try_get(0).unwrap_or_default();
                databases.push(db_name);
            }

            // Save the connection pool to state so we can use it later
            *state.db_pool.lock().unwrap() = Some(pool);
            
            // Return the list of databases to React
            Ok(databases)
        }
        Err(e) => Err(format!("Connection failed: {}", e)),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(AppState {
            db_pool: Mutex::new(None),
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![connect_to_db])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}