mod commands;
mod db;
mod models;
mod state;

use commands::{
    connect_to_db, delete_profile, disconnect_db, execute_query, get_profiles, get_server_info,
    get_table_data, get_table_ddl, get_table_info, get_table_structure, get_tables, ping_db,
    save_profile,
};
use state::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(AppState::new())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            connect_to_db,
            disconnect_db,
            ping_db,
            get_tables,
            get_table_data,
            get_table_structure,
            get_table_ddl,
            get_table_info,
            get_server_info,
            execute_query,
            get_profiles,
            save_profile,
            delete_profile,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}