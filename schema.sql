-- Nostradamus D1 Database Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  picture TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  data_source_type TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  is_active INTEGER DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_active ON projects(user_id, is_active);

-- Data source configurations
CREATE TABLE IF NOT EXISTS data_source_configs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id TEXT NOT NULL,
  source_type TEXT NOT NULL, -- 'google_sheets', 'bigquery', 'csv'
  spreadsheet_url TEXT,
  sheet_name TEXT,
  query TEXT,
  project_id_gcp TEXT,
  dataset_id TEXT,
  table_id TEXT,
  load_method TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_datasource_project ON data_source_configs(project_id);

-- OAuth tokens (encrypted)
CREATE TABLE IF NOT EXISTS oauth_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  provider TEXT NOT NULL, -- 'google'
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tokens_user ON oauth_tokens(user_id, provider);

-- Forecast configurations
CREATE TABLE IF NOT EXISTS forecast_configs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id TEXT NOT NULL,
  mode TEXT DEFAULT 'volatility', -- 'single', 'correlated', 'volatility'
  seasonal_weight REAL DEFAULT 0.5,
  run_rate_weight REAL DEFAULT 0.5,
  smoothing_alpha REAL DEFAULT 0.3,
  recent_window_days INTEGER DEFAULT 28,
  correlation_strength REAL DEFAULT 0.85,
  volatility_factor REAL DEFAULT 0.7,
  forecast_days INTEGER DEFAULT 14,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_forecast_config_project ON forecast_configs(project_id);

-- Forecast results (historical)
CREATE TABLE IF NOT EXISTS forecast_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id TEXT NOT NULL,
  category TEXT NOT NULL,
  forecast_date TEXT NOT NULL, -- Date being forecasted
  clicks_forecast REAL,
  revenue_forecast REAL,
  generated_at TEXT DEFAULT (datetime('now')),
  mode TEXT, -- Which forecast mode was used
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_results_project ON forecast_results(project_id);
CREATE INDEX IF NOT EXISTS idx_results_date ON forecast_results(project_id, forecast_date);
CREATE INDEX IF NOT EXISTS idx_results_category ON forecast_results(project_id, category);

-- Scheduler configurations
CREATE TABLE IF NOT EXISTS scheduler_configs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  cron_expression TEXT DEFAULT '0 */6 * * *',
  output_to_sheets INTEGER DEFAULT 1,
  output_sheet_name TEXT DEFAULT 'Forecast_Results',
  output_to_csv INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_scheduler_project ON scheduler_configs(project_id);
CREATE INDEX IF NOT EXISTS idx_scheduler_active ON scheduler_configs(is_active);

-- Adjustments
CREATE TABLE IF NOT EXISTS adjustments (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  category TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  clicks_adjustment_pct REAL NOT NULL,
  reason TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_adjustments_project ON adjustments(project_id);
CREATE INDEX IF NOT EXISTS idx_adjustments_dates ON adjustments(project_id, start_date, end_date);

-- Activity log
CREATE TABLE IF NOT EXISTS activity_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id TEXT,
  user_id TEXT,
  activity_type TEXT NOT NULL, -- 'data_load', 'forecast', 'export', 'config_change'
  message TEXT NOT NULL,
  details TEXT, -- JSON
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_activity_project ON activity_log(project_id);
CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_date ON activity_log(created_at);
