export interface ConnectionInfo {
  host: string;
  port: string;
  user: string;
}

export interface ConnectionProfile {
  id: string;
  name: string;
  host: string;
  port: number;
  user: string;
}

export interface ColumnInfo {
  field: string;
  type_name: string;
  collation: string | null;
  nullable: boolean;
  key_type: string;
  default_val: string | null;
  extra: string;
  comment: string;
}

export interface TableDataResult {
  columns: string[];
  rows: string[][];
  total: number;
  page: number;
  page_size: number;
}

export interface TableInfo {
  engine: string;
  row_estimate: number;
  data_size: number;
  index_size: number;
  collation: string;
  create_time: string;
}

export interface ServerInfo {
  version: string;
  hostname: string;
  max_connections: number;
  current_user: string;
  charset: string;
  collation: string;
}

export interface QueryResult {
  columns: string[];
  rows: string[][];
  rows_affected: number;
  query_time_ms: number;
  is_select: boolean;
}

export interface OpenTab {
  id: string;
  type: "table" | "query";
  db: string;
  table?: string;
  label: string;
}

export interface StatementResult {
  index: number;
  sql: string;
  result: QueryResult | null;
  error: string;
}

export type SortDir = "ASC" | "DESC";
export type Theme = "light" | "dark";
