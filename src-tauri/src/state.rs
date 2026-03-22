use sqlx::mysql::MySqlConnectOptions;
use sqlx::MySqlPool;
use std::sync::Mutex;

pub struct AppState {
    pub db_pool: Mutex<Option<MySqlPool>>,
    /// Full connect options (including password) stored so execute_query
    /// can create per-call connections with a specific database set.
    /// Password stays in process memory — never written to disk.
    pub connect_opts: Mutex<Option<MySqlConnectOptions>>,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            db_pool: Mutex::new(None),
            connect_opts: Mutex::new(None),
        }
    }

    // ── Pool ─────────────────────────────────────────────────────────────────

    pub fn get_pool(&self) -> Result<MySqlPool, String> {
        self.db_pool
            .lock()
            .map_err(|_| "State lock is poisoned".to_string())?
            .clone()
            .ok_or_else(|| "Not connected to any server".to_string())
    }

    pub fn set_pool(&self, pool: MySqlPool) -> Result<(), String> {
        *self.db_pool.lock().map_err(|_| "State lock is poisoned".to_string())? = Some(pool);
        Ok(())
    }

    pub fn take_pool(&self) -> Result<Option<MySqlPool>, String> {
        Ok(self
            .db_pool
            .lock()
            .map_err(|_| "State lock is poisoned".to_string())?
            .take())
    }

    // ── Connect options ───────────────────────────────────────────────────────

    pub fn set_connect_opts(&self, opts: MySqlConnectOptions) -> Result<(), String> {
        *self.connect_opts.lock().map_err(|_| "State lock is poisoned".to_string())? = Some(opts);
        Ok(())
    }

    /// Clone the stored options so callers can chain `.database()` without
    /// consuming the stored value.
    pub fn get_connect_opts(&self) -> Result<MySqlConnectOptions, String> {
        self.connect_opts
            .lock()
            .map_err(|_| "State lock is poisoned".to_string())?
            .clone()
            .ok_or_else(|| "Not connected to any server".to_string())
    }

    pub fn clear_connect_opts(&self) -> Result<(), String> {
        *self.connect_opts.lock().map_err(|_| "State lock is poisoned".to_string())? = None;
        Ok(())
    }
}