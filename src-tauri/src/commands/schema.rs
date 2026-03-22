use std::time::{Duration, Instant};

use sqlx::Row;
use tauri::State;

use crate::db::{quote_identifier, rows_to_grid};
use crate::models::{ColumnInfo, QueryResult, ServerInfo, TableDataResult, TableInfo};
use crate::state::AppState;

const MAX_PAGE_SIZE: u32 = 1_000;
const MAX_QUERY_ROWS: usize = 10_000;

// ─── get_tables ───────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn get_tables(
    state: State<'_, AppState>,
    db_name: String,
) -> Result<Vec<String>, String> {
    let pool = state.get_pool()?;
    let quoted = quote_identifier(&db_name)?;

    let rows = sqlx::raw_sql(&format!("SHOW TABLES FROM {quoted}"))
        .fetch_all(&pool)
        .await
        .map_err(|e| format!("Failed to fetch tables from `{db_name}`: {e}"))?;

    Ok(rows
        .iter()
        .filter_map(|r| r.try_get::<String, _>(0).ok())
        .collect())
}

// ─── get_table_data ───────────────────────────────────────────────────────────

#[tauri::command]
pub async fn get_table_data(
    state: State<'_, AppState>,
    db_name: String,
    table_name: String,
    page: u32,
    page_size: u32,
    order_by: Option<String>,
    order_dir: Option<String>,
) -> Result<TableDataResult, String> {
    let pool = state.get_pool()?;
    let db_q = quote_identifier(&db_name)?;
    let tbl_q = quote_identifier(&table_name)?;
    let page_size = page_size.clamp(1, MAX_PAGE_SIZE);

    let col_rows = sqlx::raw_sql(&format!("SHOW COLUMNS FROM {db_q}.{tbl_q}"))
        .fetch_all(&pool)
        .await
        .map_err(|e| format!("Failed to read columns: {e}"))?;

    let columns: Vec<String> = col_rows
        .iter()
        .filter_map(|r| r.try_get::<String, _>(0).ok())
        .collect();

    if columns.is_empty() {
        return Ok(TableDataResult { columns: vec![], rows: vec![], total: 0, page, page_size });
    }

    let count_rows = sqlx::raw_sql(&format!("SELECT COUNT(*) FROM {db_q}.{tbl_q}"))
        .fetch_all(&pool)
        .await
        .map_err(|e| format!("Count query failed: {e}"))?;

    let total: i64 = count_rows
        .first()
        .and_then(|r| r.try_get::<i64, _>(0).ok())
        .unwrap_or(0);

    // CAST all columns to CHAR so every cell arrives as Option<String>
    let cast_exprs: String = columns
        .iter()
        .map(|col| {
            let qcol = quote_identifier(col)
                .unwrap_or_else(|_| format!("`{}`", col.replace('`', "``")));
            format!("CAST({qcol} AS CHAR)")
        })
        .collect::<Vec<_>>()
        .join(", ");

    // Server-side ORDER BY using the original (non-cast) column so numeric/
    // date columns sort correctly rather than lexicographically.
    let order_clause = match &order_by {
        Some(col) if !col.is_empty() => {
            let qcol = quote_identifier(col)
                .map_err(|e| format!("Invalid sort column: {e}"))?;
            let dir = match order_dir.as_deref() {
                Some("DESC") => "DESC",
                _ => "ASC",
            };
            format!(" ORDER BY {qcol} {dir}")
        }
        _ => String::new(),
    };

    let offset = (page as u64) * (page_size as u64);
    let data_sql = format!(
        "SELECT {cast_exprs} FROM {db_q}.{tbl_q}{order_clause} LIMIT {page_size} OFFSET {offset}"
    );

    let rows = sqlx::raw_sql(&data_sql)
        .fetch_all(&pool)
        .await
        .map_err(|e| format!("Data fetch failed: {e}"))?;

    let data: Vec<Vec<String>> = rows
        .iter()
        .map(|row| {
            (0..columns.len())
                .map(|i| {
                    row.try_get::<Option<String>, _>(i)
                        .ok()
                        .flatten()
                        .unwrap_or_else(|| "NULL".to_string())
                })
                .collect()
        })
        .collect();

    Ok(TableDataResult { columns, rows: data, total, page, page_size })
}

// ─── get_table_structure ──────────────────────────────────────────────────────

#[tauri::command]
pub async fn get_table_structure(
    state: State<'_, AppState>,
    db_name: String,
    table_name: String,
) -> Result<Vec<ColumnInfo>, String> {
    let pool = state.get_pool()?;
    let db_q = quote_identifier(&db_name)?;
    let tbl_q = quote_identifier(&table_name)?;

    let rows = sqlx::raw_sql(&format!("SHOW FULL COLUMNS FROM {db_q}.{tbl_q}"))
        .fetch_all(&pool)
        .await
        .map_err(|e| format!("Structure fetch failed: {e}"))?;

    Ok(rows
        .iter()
        .map(|row| {
            let s = |i: usize| {
                row.try_get::<Option<String>, _>(i)
                    .ok()
                    .flatten()
                    .unwrap_or_default()
            };
            let opt = |i: usize| row.try_get::<Option<String>, _>(i).ok().flatten();
            ColumnInfo {
                field: s(0),
                type_name: s(1),
                collation: opt(2),
                nullable: s(3) == "YES",
                key_type: s(4),
                default_val: opt(5),
                extra: s(6),
                comment: s(8),
            }
        })
        .collect())
}

// ─── get_table_ddl ────────────────────────────────────────────────────────────

/// Returns the CREATE TABLE statement for a given table.
/// Uses raw_sql because SHOW CREATE TABLE is not allowed in prepared protocol.
#[tauri::command]
pub async fn get_table_ddl(
    state: State<'_, AppState>,
    db_name: String,
    table_name: String,
) -> Result<String, String> {
    let pool = state.get_pool()?;
    let db_q = quote_identifier(&db_name)?;
    let tbl_q = quote_identifier(&table_name)?;

    let rows = sqlx::raw_sql(&format!("SHOW CREATE TABLE {db_q}.{tbl_q}"))
        .fetch_all(&pool)
        .await
        .map_err(|e| format!("DDL fetch failed: {e}"))?;

    // SHOW CREATE TABLE returns two columns: [Table, Create Table]
    rows.first()
        .and_then(|r| r.try_get::<String, _>(1).ok())
        .ok_or_else(|| "No DDL returned".to_string())
}

// ─── get_table_info ───────────────────────────────────────────────────────────

/// Fetches engine, size and collation from information_schema.TABLES.
/// Uses sqlx::query (prepared protocol) — SELECT is always allowed.
/// All columns are CAST/COALESCED to avoid NULL or type issues.
#[tauri::command]
pub async fn get_table_info(
    state: State<'_, AppState>,
    db_name: String,
    table_name: String,
) -> Result<TableInfo, String> {
    let pool = state.get_pool()?;

    let sql = "\
        SELECT \
            COALESCE(ENGINE, ''), \
            COALESCE(CAST(TABLE_ROWS AS CHAR), '0'), \
            COALESCE(CAST(DATA_LENGTH AS CHAR), '0'), \
            COALESCE(CAST(INDEX_LENGTH AS CHAR), '0'), \
            COALESCE(TABLE_COLLATION, ''), \
            COALESCE(CAST(CREATE_TIME AS CHAR), '') \
        FROM information_schema.TABLES \
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?";

    let row = sqlx::query(sql)
        .bind(&db_name)
        .bind(&table_name)
        .fetch_optional(&pool)
        .await
        .map_err(|e| format!("Table info fetch failed: {e}"))?
        .ok_or_else(|| "Table not found in information_schema".to_string())?;

    let s = |i: usize| row.try_get::<String, _>(i).unwrap_or_default();

    Ok(TableInfo {
        engine: s(0),
        row_estimate: s(1).parse().unwrap_or(0),
        data_size: s(2).parse().unwrap_or(0),
        index_size: s(3).parse().unwrap_or(0),
        collation: s(4),
        create_time: s(5),
    })
}

// ─── get_server_info ──────────────────────────────────────────────────────────

#[tauri::command]
pub async fn get_server_info(state: State<'_, AppState>) -> Result<ServerInfo, String> {
    let pool = state.get_pool()?;

    let sql = "\
        SELECT \
            VERSION(), \
            COALESCE(@@hostname, 'unknown'), \
            CAST(@@max_connections AS CHAR), \
            USER(), \
            CAST(@@character_set_server AS CHAR), \
            CAST(@@collation_server AS CHAR)";

    let row = sqlx::query(sql)
        .fetch_one(&pool)
        .await
        .map_err(|e| format!("Server info fetch failed: {e}"))?;

    let s = |i: usize| row.try_get::<String, _>(i).unwrap_or_default();

    Ok(ServerInfo {
        version: s(0),
        hostname: s(1),
        max_connections: s(2).parse().unwrap_or(0),
        current_user: s(3),
        charset: s(4),
        collation: s(5),
    })
}

// ─── execute_query ────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn execute_query(
    state: State<'_, AppState>,
    db_name: String,
    sql: String,
) -> Result<QueryResult, String> {
    let sql = sql.trim().to_string();
    if sql.is_empty() {
        return Err("Query cannot be empty".to_string());
    }

    let db_name = db_name.trim().to_string();
    quote_identifier(&db_name)?;

    // Reject excessively large queries (1 MB limit)
    if sql.len() > 1_048_576 {
        return Err("Query too large (max 1 MB)".to_string());
    }

    let opts = state.get_connect_opts()?.database(&db_name);

    let exec_pool = sqlx::mysql::MySqlPoolOptions::new()
        .max_connections(1)
        .acquire_timeout(Duration::from_secs(10))
        .connect_with(opts)
        .await
        .map_err(|e| format!("Failed to connect to `{db_name}`: {e}"))?;

    let start = Instant::now();

    // Strip leading comments and whitespace to detect the real statement type
    let stripped = strip_leading_comments(&sql);
    let upper = stripped.to_uppercase();
    let is_read = ["SELECT ", "SELECT\n", "SELECT\t",
                    "SHOW ", "SHOW\n", "SHOW\t",
                    "DESCRIBE ", "DESCRIBE\n", "DESCRIBE\t",
                    "DESC ", "DESC\n", "DESC\t",
                    "EXPLAIN ", "EXPLAIN\n", "EXPLAIN\t",
                    "WITH ", "WITH\n", "WITH\t",
                    "(SELECT"]
        .iter()
        .any(|kw| upper.starts_with(kw));

    let result = if is_read {
        let rows = sqlx::raw_sql(&sql)
            .fetch_all(&exec_pool)
            .await
            .map_err(|e| format!("Query error: {e}"))?;

        let elapsed = start.elapsed().as_millis() as u64;
        let capped = &rows[..rows.len().min(MAX_QUERY_ROWS)];
        let (columns, data) = rows_to_grid(capped);

        Ok(QueryResult { columns, rows: data, rows_affected: 0, query_time_ms: elapsed, is_select: true })
    } else {
        let result = sqlx::raw_sql(&sql)
            .execute(&exec_pool)
            .await
            .map_err(|e| format!("Query error: {e}"))?;

        let elapsed = start.elapsed().as_millis() as u64;

        Ok(QueryResult {
            columns: vec![],
            rows: vec![],
            rows_affected: result.rows_affected(),
            query_time_ms: elapsed,
            is_select: false,
        })
    };

    // Always close the temporary pool to avoid connection leaks
    exec_pool.close().await;

    result
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/// Strips leading SQL comments (block `/* ... */` and line `-- ...`) and
/// whitespace so the real statement keyword can be detected.
fn strip_leading_comments(sql: &str) -> &str {
    let mut s = sql.trim_start();
    loop {
        if s.starts_with("--") {
            // Line comment — skip to end of line
            s = match s.find('\n') {
                Some(pos) => s[pos + 1..].trim_start(),
                None => "",
            };
        } else if s.starts_with("/*") {
            // Block comment — skip to closing */
            s = match s.find("*/") {
                Some(pos) => s[pos + 2..].trim_start(),
                None => "",
            };
        } else {
            break;
        }
    }
    s
}

// ─── ping_db ─────────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn ping_db(state: State<'_, AppState>) -> Result<(), String> {
    let pool = state.get_pool()?;
    sqlx::raw_sql("SELECT 1")
        .execute(&pool)
        .await
        .map_err(|e| format!("Ping failed: {e}"))?;
    Ok(())
}