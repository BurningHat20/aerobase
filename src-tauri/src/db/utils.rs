use sqlx::mysql::MySqlRow;
use sqlx::{Column, Row};

// ─── Identifier safety ────────────────────────────────────────────────────────

/// Backtick-quotes a MySQL identifier and escapes internal backticks.
/// Prevents SQL injection on identifier paths where parameterization is unavailable.
pub fn quote_identifier(name: &str) -> Result<String, String> {
    if name.is_empty() {
        return Err("Identifier cannot be empty".to_string());
    }
    if name.len() > 64 {
        return Err(format!(
            "Identifier `{name}` exceeds MySQL's 64-character limit"
        ));
    }
    if name.contains('\0') {
        return Err("Identifier contains an illegal NUL byte".to_string());
    }
    Ok(format!("`{}`", name.replace('`', "``")))
}

// ─── Dynamic row conversion ───────────────────────────────────────────────────

/// Converts a single MySQL cell to a String by trying types in priority order.
///
/// MySQL binary protocol uses native types per column, so we can't always use
/// `try_get::<String>`. We cascade through the most common Rust types and fall
/// back to a BLOB description. A NULL at any level returns "NULL".
pub fn cell_to_string(row: &MySqlRow, idx: usize) -> String {
    // Text types: VARCHAR, CHAR, TEXT, ENUM, DATE, DATETIME, TIME, JSON, DECIMAL
    if let Ok(Some(v)) = row.try_get::<Option<String>, _>(idx) {
        return v;
    }
    // Signed integers: TINYINT, SMALLINT, MEDIUMINT, INT, BIGINT
    if let Ok(Some(v)) = row.try_get::<Option<i64>, _>(idx) {
        return v.to_string();
    }
    // Unsigned integers
    if let Ok(Some(v)) = row.try_get::<Option<u64>, _>(idx) {
        return v.to_string();
    }
    // Floats: FLOAT, DOUBLE
    if let Ok(Some(v)) = row.try_get::<Option<f64>, _>(idx) {
        return format!("{v}");
    }
    // Boolean (TINYINT(1))
    if let Ok(Some(v)) = row.try_get::<Option<bool>, _>(idx) {
        return if v { "1".to_string() } else { "0".to_string() };
    }
    // Binary / BLOB — try UTF-8 first (handles JSON-as-blob, etc.)
    if let Ok(Some(v)) = row.try_get::<Option<Vec<u8>>, _>(idx) {
        return std::str::from_utf8(&v)
            .map(|s| s.to_string())
            .unwrap_or_else(|_| format!("[BLOB {} B]", v.len()));
    }
    // All Ok(None) branches fall here → column is NULL
    "NULL".to_string()
}

/// Converts a slice of MySqlRows into (column_names, string_grid).
/// Used for arbitrary SELECT results in the SQL editor.
pub fn rows_to_grid(rows: &[MySqlRow]) -> (Vec<String>, Vec<Vec<String>>) {
    if rows.is_empty() {
        return (vec![], vec![]);
    }
    let columns: Vec<String> = rows[0]
        .columns()
        .iter()
        .map(|c| c.name().to_string())
        .collect();
    let data = rows
        .iter()
        .map(|row| (0..columns.len()).map(|i| cell_to_string(row, i)).collect())
        .collect();
    (columns, data)
}

// ─── Tests ────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn basic() { assert_eq!(quote_identifier("my_db").unwrap(), "`my_db`"); }
    #[test]
    fn escapes_backtick() { assert_eq!(quote_identifier("a`b").unwrap(), "`a``b`"); }
    #[test]
    fn rejects_empty() { assert!(quote_identifier("").is_err()); }
    #[test]
    fn rejects_nul() { assert!(quote_identifier("a\0b").is_err()); }
    #[test]
    fn rejects_long() { assert!(quote_identifier(&"x".repeat(65)).is_err()); }
}