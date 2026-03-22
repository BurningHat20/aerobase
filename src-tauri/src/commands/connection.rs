use sqlx::mysql::{MySqlConnectOptions, MySqlPoolOptions, MySqlSslMode};
use sqlx::Row;
use std::time::Duration;
use tauri::State;

use crate::state::AppState;

#[tauri::command]
pub async fn connect_to_db(
    state: State<'_, AppState>,
    host: String,
    port: u16,
    user: String,
    pass: String,
) -> Result<Vec<String>, String> {
    let host = host.trim().to_string();
    let user = user.trim().to_string();

    if host.is_empty() { return Err("Host cannot be empty".to_string()); }
    if user.is_empty() { return Err("Username cannot be empty".to_string()); }
    if port == 0 { return Err("Port must be between 1 and 65535".to_string()); }

    let mut options = MySqlConnectOptions::new()
        .host(&host)
        .port(port)
        .username(&user)
        .ssl_mode(MySqlSslMode::Preferred);

    if !pass.is_empty() {
        options = options.password(&pass);
    }

    let pool = MySqlPoolOptions::new()
        .max_connections(10)
        .min_connections(1)
        .acquire_timeout(Duration::from_secs(10))
        .idle_timeout(Duration::from_secs(300))
        .connect_with(options.clone()) // clone so we can also store options
        .await
        .map_err(|e| sanitize_connection_error(&e.to_string(), &host, port))?;

    let rows = sqlx::query("SHOW DATABASES")
        .fetch_all(&pool)
        .await
        .map_err(|e| format!("Connected but failed to list databases: {e}"))?;

    let databases: Vec<String> = rows
        .iter()
        .filter_map(|row| row.try_get::<String, _>(0).ok())
        .collect();

    // Store both the pool and the connect options
    state.set_pool(pool)?;
    state.set_connect_opts(options)?;

    Ok(databases)
}

#[tauri::command]
pub async fn disconnect_db(state: State<'_, AppState>) -> Result<(), String> {
    let maybe_pool = state.take_pool()?;
    if let Some(pool) = maybe_pool {
        pool.close().await;
    }
    state.clear_connect_opts()?;
    Ok(())
}

fn sanitize_connection_error(msg: &str, host: &str, port: u16) -> String {
    if msg.contains("Access denied") {
        "Access denied — check your username and password.".to_string()
    } else if msg.contains("Connection refused") || msg.contains("os error 111") {
        format!("Cannot reach server at {host}:{port}. Is MySQL running?")
    } else if msg.contains("timed out") || msg.contains("timeout") {
        format!("Connection to {host}:{port} timed out after 10 seconds.")
    } else if msg.contains("No such host") || msg.contains("failed to lookup") {
        format!("Host `{host}` could not be resolved. Check the address.")
    } else {
        let first = msg.split('\n').next().unwrap_or(msg);
        format!("Connection failed: {first}")
    }
}