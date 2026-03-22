use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ConnectionProfile {
    pub id: String,
    pub name: String,
    pub host: String,
    pub port: u16,
    pub user: String,
}

#[derive(Debug, Serialize, Clone)]
pub struct TableDataResult {
    pub columns: Vec<String>,
    pub rows: Vec<Vec<String>>,
    pub total: i64,
    pub page: u32,
    pub page_size: u32,
}

#[derive(Debug, Serialize, Clone)]
pub struct ColumnInfo {
    pub field: String,
    pub type_name: String,
    pub collation: Option<String>,
    pub nullable: bool,
    pub key_type: String,
    pub default_val: Option<String>,
    pub extra: String,
    pub comment: String,
}

#[derive(Debug, Serialize, Clone)]
pub struct QueryResult {
    pub columns: Vec<String>,
    pub rows: Vec<Vec<String>>,
    pub rows_affected: u64,
    pub query_time_ms: u64,
    pub is_select: bool,
}

/// Metadata from information_schema.TABLES for the table header bar.
#[derive(Debug, Serialize, Clone)]
pub struct TableInfo {
    pub engine: String,
    /// Approximate row count (exact for MyISAM, estimate for InnoDB).
    pub row_estimate: i64,
    /// Raw data size in bytes.
    pub data_size: i64,
    /// Raw index size in bytes.
    pub index_size: i64,
    pub collation: String,
    pub create_time: String,
}

/// Basic server metadata shown in the server info panel.
#[derive(Debug, Serialize, Clone)]
pub struct ServerInfo {
    pub version: String,
    pub hostname: String,
    pub max_connections: i64,
    pub current_user: String,
    pub charset: String,
    pub collation: String,
}