/**
 * Admin Panel HTML
 * Auto-generated from Flask templates
 * Generated: 2025-10-24T22:09:57.992Z
 */

export const adminHTML = () => {
  const adminJs = `/**
 * Admin Configuration Interface
 */

// Switch between tabs
function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Remove active from all buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected tab
    document.getElementById(\`\${tabName}-tab\`).classList.add('active');

    // Highlight active button
    event.target.classList.add('active');
}

// Show status message
function showStatus(message, isError = false) {
    const statusEl = document.getElementById('statusMessage');
    statusEl.textContent = message;
    statusEl.className = \`status-message \${isError ? 'status-error' : 'status-success'}\`;
    statusEl.style.display = 'block';

    // Auto-hide after 5 seconds
    setTimeout(() => {
        statusEl.style.display = 'none';
    }, 5000);
}

// ============================================================================
// ADJUSTMENTS MANAGEMENT
// ============================================================================

// Load adjustments from server
async function loadAdjustments() {
    try {
        const response = await fetch('/api/adjustments/list');
        const data = await response.json();

        if (data.success) {
            displayAdjustments(data.adjustments);
            showStatus(\`Loaded \${data.count} adjustments\`);
        } else {
            showStatus(data.error, true);
        }
    } catch (error) {
        showStatus(\`Error loading adjustments: \${error.message}\`, true);
    }
}

// Display adjustments in table
function displayAdjustments(adjustments) {
    const tbody = document.getElementById('adjustmentsTableBody');

    if (adjustments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #999;">No adjustments found</td></tr>';
        return;
    }

    tbody.innerHTML = adjustments.map(adj => \`
        <tr>
            <td>\${adj.category}</td>
            <td>\${adj.start_date}</td>
            <td>\${adj.end_date}</td>
            <td style="color: \${adj.clicks_adjustment_pct >= 0 ? '#27ae60' : '#e74c3c'}">
                \${adj.clicks_adjustment_pct > 0 ? '+' : ''}\${adj.clicks_adjustment_pct}%
            </td>
            <td>\${adj.reason}</td>
            <td>
                <button onclick="deleteAdjustment('\${adj.id}')" class="btn btn-danger" style="padding: 6px 12px; font-size: 12px;">
                    Delete
                </button>
            </td>
        </tr>
    \`).join('');
}

// Add new adjustment
document.getElementById('addAdjustmentForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const adjustment = {
        category: document.getElementById('adj-category').value,
        start_date: document.getElementById('adj-start-date').value,
        end_date: document.getElementById('adj-end-date').value,
        clicks_adjustment_pct: parseFloat(document.getElementById('adj-clicks-pct').value),
        reason: document.getElementById('adj-reason').value
    };

    try {
        const response = await fetch('/api/adjustments/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(adjustment)
        });

        const data = await response.json();

        if (data.success) {
            showStatus('Adjustment added successfully');
            document.getElementById('addAdjustmentForm').reset();
            loadAdjustments(); // Reload list
        } else {
            showStatus(data.error, true);
        }
    } catch (error) {
        showStatus(\`Error adding adjustment: \${error.message}\`, true);
    }
});

// Delete adjustment
async function deleteAdjustment(adjId) {
    if (!confirm('Are you sure you want to delete this adjustment?')) {
        return;
    }

    try {
        const response = await fetch(\`/api/adjustments/delete/\${adjId}\`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
            showStatus('Adjustment deleted successfully');
            loadAdjustments(); // Reload list
        } else {
            showStatus(data.error, true);
        }
    } catch (error) {
        showStatus(\`Error deleting adjustment: \${error.message}\`, true);
    }
}

// ============================================================================
// FORECAST CONFIGURATION
// ============================================================================

// Load forecast configuration
async function loadForecastConfig() {
    try {
        const response = await fetch('/api/config/forecast');
        const data = await response.json();

        if (data.success && data.config.forecast_parameters) {
            const params = data.config.forecast_parameters;

            document.getElementById('fc-seasonal-weight').value = params.seasonal_weight || 0.5;
            document.getElementById('fc-run-rate-weight').value = params.run_rate_weight || 0.5;
            document.getElementById('fc-smoothing-alpha').value = params.smoothing_alpha || 0.3;
            document.getElementById('fc-recent-window').value = params.recent_window_days || 28;
            document.getElementById('fc-correlation').value = params.correlation_strength || 0.85;
            document.getElementById('fc-volatility').value = params.volatility_factor || 0.7;
            document.getElementById('fc-forecast-days').value = params.forecast_days || 14;

            showStatus('Forecast configuration loaded');
        } else {
            showStatus(data.error || 'Configuration not found', true);
        }
    } catch (error) {
        showStatus(\`Error loading configuration: \${error.message}\`, true);
    }
}

// Save forecast configuration
document.getElementById('forecastConfigForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const config = {
        forecast_parameters: {
            seasonal_weight: parseFloat(document.getElementById('fc-seasonal-weight').value),
            run_rate_weight: parseFloat(document.getElementById('fc-run-rate-weight').value),
            smoothing_alpha: parseFloat(document.getElementById('fc-smoothing-alpha').value),
            recent_window_days: parseInt(document.getElementById('fc-recent-window').value),
            correlation_strength: parseFloat(document.getElementById('fc-correlation').value),
            volatility_factor: parseFloat(document.getElementById('fc-volatility').value),
            forecast_days: parseInt(document.getElementById('fc-forecast-days').value)
        },
        adjustments_file: 'adjustments.json',
        database_config: 'database_config.json',
        output_config: 'output_config.json'
    };

    try {
        const response = await fetch('/api/config/forecast', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config)
        });

        const data = await response.json();

        if (data.success) {
            showStatus('Forecast configuration saved successfully');
        } else {
            showStatus(data.error, true);
        }
    } catch (error) {
        showStatus(\`Error saving configuration: \${error.message}\`, true);
    }
});

// ============================================================================
// DATABASE CONFIGURATION
// ============================================================================

// Load database configuration
async function loadDatabaseConfig() {
    try {
        const response = await fetch('/api/config/database');
        const data = await response.json();

        if (data.success && data.config) {
            const config = data.config;

            document.getElementById('db-type').value = config.database_type || 'csv';

            if (config.connection) {
                document.getElementById('db-host').value = config.connection.host || '';
                document.getElementById('db-port').value = config.connection.port || '';
                document.getElementById('db-database').value = config.connection.database || '';
                document.getElementById('db-user').value = config.connection.user || '';
                // Don't populate password for security
            }

            if (config.input && config.input.query) {
                document.getElementById('db-query').value = config.input.query;
            }

            toggleDatabaseFields();
            showStatus('Database configuration loaded');
        } else {
            showStatus(data.error || 'Configuration not found', true);
        }
    } catch (error) {
        showStatus(\`Error loading database config: \${error.message}\`, true);
    }
}

// Toggle database connection fields based on type
function toggleDatabaseFields() {
    const dbType = document.getElementById('db-type').value;
    const gsFields = document.getElementById('googleSheetsFields');
    const bqFields = document.getElementById('bigQueryFields');
    const dbFields = document.getElementById('dbConnectionFields');

    // Hide all first
    if (gsFields) gsFields.style.display = 'none';
    if (bqFields) bqFields.style.display = 'none';
    if (dbFields) dbFields.style.display = 'none';

    // Show relevant fields
    if (dbType === 'google_sheets' && gsFields) {
        gsFields.style.display = 'block';
    } else if (dbType === 'bigquery' && bqFields) {
        bqFields.style.display = 'block';
    } else if (dbType && dbType !== 'csv' && dbType !== 'google_sheets' && dbType !== 'bigquery' && dbFields) {
        dbFields.style.display = 'block';
    }
}

// Listen for database type changes
const dbTypeSelect = document.getElementById('db-type');
if (dbTypeSelect) {
    dbTypeSelect.addEventListener('change', toggleDatabaseFields);
}

// Save database configuration
document.getElementById('databaseConfigForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const dbType = document.getElementById('db-type').value;

    if (!dbType) {
        showStatus('Please select a data source type', true);
        return;
    }

    const config = {
        source_type: dbType
    };

    // Google Sheets configuration
    if (dbType === 'google_sheets') {
        const url = document.getElementById('gs-spreadsheet-url').value;
        if (!url) {
            showStatus('Please enter a spreadsheet URL', true);
            return;
        }
        config.spreadsheet_url = url;
        config.sheet_name = document.getElementById('gs-sheet-name').value || null;
    }
    // BigQuery configuration
    else if (dbType === 'bigquery') {
        const method = document.getElementById('bq-load-method').value;
        config.load_method = method;

        if (method === 'query') {
            const query = document.getElementById('bq-query').value;
            if (!query) {
                showStatus('Please enter a SQL query', true);
                return;
            }
            config.query = query;
        } else {
            const projectId = document.getElementById('bq-project-id').value;
            const datasetId = document.getElementById('bq-dataset-id').value;
            const tableId = document.getElementById('bq-table-id').value;
            if (!projectId || !datasetId || !tableId) {
                showStatus('Please fill in all table reference fields', true);
                return;
            }
            config.project_id = projectId;
            config.dataset_id = datasetId;
            config.table_id = tableId;
        }
    }
    // Traditional database configuration
    else if (dbType !== 'csv') {
        const password = document.getElementById('db-password').value;

        config.connection = {
            host: document.getElementById('db-host').value,
            port: parseInt(document.getElementById('db-port').value),
            database: document.getElementById('db-database').value,
            user: document.getElementById('db-user').value,
            password: password || '********' // Use mask if empty
        };

        config.input = {
            table_name: 'organic_search_data',
            query: document.getElementById('db-query').value
        };

        config.output = {
            table_name: 'forecast_results',
            mode: 'append',
            create_table_if_not_exists: true
        };
    } else {
        config.csv_path = 'data/inputs/input_data.csv';
    }

    try {
        const response = await fetch('/api/config/data-source', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config)
        });

        const data = await response.json();

        if (data.success) {
            showStatus('Data source configuration saved successfully! You can now load this source from the dashboard.');
        } else {
            showStatus(data.error, true);
        }
    } catch (error) {
        showStatus(\`Error saving configuration: \${error.message}\`, true);
    }
});

// Test database connection
async function testDatabaseConnection() {
    try {
        showStatus('Testing database connection...');

        const response = await fetch('/api/config/test-database', {
            method: 'POST'
        });

        const data = await response.json();

        if (data.success) {
            showStatus(\`Connection successful! Found \${data.records} records.\`);
        } else {
            showStatus(\`Connection failed: \${data.error}\`, true);
        }
    } catch (error) {
        showStatus(\`Error testing connection: \${error.message}\`, true);
    }
}

// ============================================================================
// OUTPUT CONFIGURATION
// ============================================================================

// Load output configuration
async function loadOutputConfig() {
    try {
        const response = await fetch('/api/config/output');
        const data = await response.json();

        if (data.success && data.config) {
            const config = data.config;

            if (config.outputs) {
                // CSV settings
                if (config.outputs.csv) {
                    document.getElementById('out-csv-enabled').checked = config.outputs.csv.enabled || false;
                    document.getElementById('out-csv-path').value = config.outputs.csv.path || '';
                }

                // Excel settings
                if (config.outputs.excel) {
                    document.getElementById('out-excel-enabled').checked = config.outputs.excel.enabled || false;
                    document.getElementById('out-excel-path').value = config.outputs.excel.path || '';
                }

                // Database settings
                if (config.outputs.database) {
                    document.getElementById('out-db-enabled').checked = config.outputs.database.enabled || false;
                }
            }

            // Retention settings
            if (config.retention) {
                document.getElementById('out-retention-days').value = config.retention.keep_days || 90;
            }

            showStatus('Output configuration loaded');
        } else {
            showStatus(data.error || 'Configuration not found', true);
        }
    } catch (error) {
        showStatus(\`Error loading output config: \${error.message}\`, true);
    }
}

// Save output configuration
document.getElementById('outputConfigForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const config = {
        outputs: {
            csv: {
                enabled: document.getElementById('out-csv-enabled').checked,
                path: document.getElementById('out-csv-path').value,
                include_metadata: true
            },
            excel: {
                enabled: document.getElementById('out-excel-enabled').checked,
                path: document.getElementById('out-excel-path').value,
                include_charts: true
            },
            database: {
                enabled: document.getElementById('out-db-enabled').checked,
                use_connector: true
            }
        },
        retention: {
            keep_days: parseInt(document.getElementById('out-retention-days').value),
            archive_path: 'data/archive/'
        }
    };

    try {
        const response = await fetch('/api/config/output', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config)
        });

        const data = await response.json();

        if (data.success) {
            showStatus('Output configuration saved successfully');
        } else {
            showStatus(data.error, true);
        }
    } catch (error) {
        showStatus(\`Error saving output config: \${error.message}\`, true);
    }
});

// ============================================================================
// INITIALIZATION
// ============================================================================

// Load adjustments on page load
document.addEventListener('DOMContentLoaded', () => {
    loadAdjustments();
    toggleDatabaseFields();
});
`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nostradamus - Configuration</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    
    <style>
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        }

        .admin-container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }

        .admin-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            padding-bottom: 15px;
            border-bottom: 2px solid #e0e0e0;
        }

        .admin-header h1 {
            margin: 0;
            color: #f8b133;
        }

        .back-link {
            padding: 10px 20px;
            background: #2a2a2a;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            transition: background 0.3s;
            border: 1px solid #f8b133;
        }

        .back-link:hover {
            background: #3a3a3a;
            border-color: #ffc04d;
        }

        .admin-section {
            background: #1a1a1a;
            border-radius: 8px;
            padding: 25px;
            margin-bottom: 25px;
            box-shadow: 0 2px 4px rgba(248, 177, 51, 0.1);
            border: 1px solid #2a2a2a;
        }

        .admin-section h2 {
            margin-top: 0;
            color: #f8b133;
            border-bottom: 2px solid #f8b133;
            padding-bottom: 10px;
        }

        .form-group {
            margin-bottom: 20px;
        }

        .form-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: 500;
            color: #ffffff;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
            width: 100%;
            padding: 10px;
            border: 1px solid #2a2a2a;
            border-radius: 4px;
            font-size: 14px;
            box-sizing: border-box;
            background: #0a0a0a;
            color: #ffffff;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
            outline: none;
            border-color: #f8b133;
        }

        .form-row {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
        }

        .btn {
            padding: 12px 24px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.3s;
        }

        .btn-primary {
            background: #f8b133;
            color: #000000;
            font-weight: 700;
        }

        .btn-primary:hover {
            background: #ffc04d;
        }

        .btn-success {
            background: #4ade80;
            color: #000000;
            font-weight: 700;
        }

        .btn-success:hover {
            background: #5de88f;
        }

        .btn-danger {
            background: #f87171;
            color: #000000;
            font-weight: 700;
        }

        .btn-danger:hover {
            background: #fa8585;
        }

        .btn-secondary {
            background: #2a2a2a;
            color: #ffffff;
            border: 1px solid #f8b133;
        }

        .btn-secondary:hover {
            background: #3a3a3a;
            border-color: #ffc04d;
        }

        .adjustments-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }

        .adjustments-table th,
        .adjustments-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #2a2a2a;
            color: #ffffff;
        }

        .adjustments-table th {
            background: #0a0a0a;
            font-weight: 600;
            color: #f8b133;
        }

        .adjustments-table tr:hover {
            background: #2a2a2a;
        }

        .status-message {
            padding: 12px 20px;
            border-radius: 4px;
            margin-bottom: 20px;
            display: none;
        }

        .status-success {
            background: #1a2e1a;
            color: #4ade80;
            border: 1px solid #4ade80;
        }

        .status-error {
            background: #2e1a1a;
            color: #f87171;
            border: 1px solid #f87171;
        }

        .config-preview {
            background: #0a0a0a;
            padding: 15px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 12px;
            max-height: 300px;
            overflow-y: auto;
            white-space: pre-wrap;
            color: #ffffff;
            border: 1px solid #2a2a2a;
        }

        .tab-container {
            margin-bottom: 20px;
        }

        .tab-buttons {
            display: flex;
            gap: 5px;
            border-bottom: 2px solid #2a2a2a;
            margin-bottom: 20px;
        }

        .tab-button {
            padding: 12px 24px;
            background: #2a2a2a;
            border: none;
            border-bottom: 3px solid transparent;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            color: #ffffff;
            transition: all 0.3s;
        }

        .tab-button.active {
            background: #1a1a1a;
            color: #f8b133;
            border-bottom-color: #f8b133;
        }

        .tab-button:hover {
            background: #1a1a1a;
            color: #f8b133;
        }

        .tab-content {
            display: none;
        }

        .tab-content.active {
            display: block;
        }
    </style>
</head>
<body>
    <div class="admin-container">
        <div class="admin-header">
            <h1>Nostradamus Configuration</h1>
            <a href="/" class="back-link">← Back to Dashboard</a>
        </div>

        <div id="statusMessage" class="status-message"></div>

        <!-- Tabs -->
        <div class="tab-container">
            <div class="tab-buttons">
                <button class="tab-button active" onclick="switchTab('database')">Data Source Connections</button>
                <button class="tab-button" onclick="switchTab('adjustments')">Manual Adjustments</button>
                <button class="tab-button" onclick="switchTab('forecast')">Forecast Parameters</button>
                <button class="tab-button" onclick="switchTab('output')">Output Settings</button>
            </div>

            <!-- Database Connection Tab (now first) -->
            <div id="database-tab" class="tab-content active">
                <div class="admin-section">
                    <h2>Data Source Connections</h2>
                    <p style="color: #aaaaaa; margin-bottom: 25px;">
                        Configure how Nostradamus connects to your data sources. Choose from Google Sheets, BigQuery, or traditional databases.
                    </p>

                    <form id="databaseConfigForm">
                        <div class="form-group">
                            <label for="db-type">Data Source Type</label>
                            <select id="db-type">
                                <option value="">Select a data source...</option>
                                <option value="google_sheets">Google Sheets</option>
                                <option value="bigquery">Google BigQuery</option>
                                <option value="csv">CSV Files (Upload)</option>
                                <option value="postgresql">PostgreSQL</option>
                                <option value="mysql">MySQL</option>
                                <option value="sqlserver">SQL Server</option>
                            </select>
                        </div>

                        <!-- Google Sheets Fields -->
                        <div id="googleSheetsFields" style="display: none;">
                            <div class="form-group">
                                <label for="gs-spreadsheet-url">Spreadsheet URL</label>
                                <input type="text" id="gs-spreadsheet-url" class="input" placeholder="https://docs.google.com/spreadsheets/d/...">
                                <p style="color: #aaaaaa; font-size: 0.9em; margin-top: 5px;">
                                    Paste the full URL of your Google Sheet
                                </p>
                            </div>
                            <div class="form-group">
                                <label for="gs-sheet-name">Sheet Name (optional)</label>
                                <input type="text" id="gs-sheet-name" class="input" placeholder="Sheet1">
                                <p style="color: #aaaaaa; font-size: 0.9em; margin-top: 5px;">
                                    Leave blank to use the first sheet
                                </p>
                            </div>
                            <div style="background: #0a0a0a; border: 1px solid #f8b133; border-radius: 6px; padding: 15px; margin-top: 15px;">
                                <p style="color: #f8b133; margin: 0; font-size: 0.9em;">
                                    <strong>Note:</strong> You must be logged in with your Google account. Make sure you're authenticated before testing the connection.
                                </p>
                            </div>
                        </div>

                        <!-- BigQuery Fields -->
                        <div id="bigQueryFields" style="display: none;">
                            <div class="form-group">
                                <label for="bq-load-method">Load Method</label>
                                <select id="bq-load-method" class="input" onchange="toggleBQMethod()">
                                    <option value="query">SQL Query</option>
                                    <option value="table">Table Reference</option>
                                </select>
                            </div>
                            <div id="bqQueryFields">
                                <div class="form-group">
                                    <label for="bq-query">SQL Query</label>
                                    <textarea id="bq-query" class="input" rows="6" placeholder="SELECT date, category, clicks, revenue FROM \`project.dataset.table\`" style="font-family: 'Courier New', monospace;"></textarea>
                                    <p style="color: #aaaaaa; font-size: 0.9em; margin-top: 5px;">
                                        Must return columns: date, category, clicks, revenue
                                    </p>
                                </div>
                            </div>
                            <div id="bqTableFields" style="display: none;">
                                <div class="form-group">
                                    <label for="bq-project-id">Project ID</label>
                                    <input type="text" id="bq-project-id" class="input" placeholder="my-project-id">
                                </div>
                                <div class="form-group">
                                    <label for="bq-dataset-id">Dataset ID</label>
                                    <input type="text" id="bq-dataset-id" class="input" placeholder="my_dataset">
                                </div>
                                <div class="form-group">
                                    <label for="bq-table-id">Table ID</label>
                                    <input type="text" id="bq-table-id" class="input" placeholder="my_table">
                                </div>
                            </div>
                        </div>

                        <!-- Traditional Database Fields -->
                        <div id="dbConnectionFields" style="display: none;">
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="db-host">Host</label>
                                    <input type="text" id="db-host" placeholder="localhost">
                                </div>
                                <div class="form-group">
                                    <label for="db-port">Port</label>
                                    <input type="number" id="db-port" placeholder="5432">
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="db-database">Database Name</label>
                                    <input type="text" id="db-database" placeholder="forecast_db">
                                </div>
                                <div class="form-group">
                                    <label for="db-user">Username</label>
                                    <input type="text" id="db-user" placeholder="forecast_user">
                                </div>
                            </div>
                            <div class="form-group">
                                <label for="db-password">Password</label>
                                <input type="password" id="db-password" placeholder="Leave blank to keep existing">
                            </div>
                            <div class="form-group">
                                <label for="db-query">Input Query</label>
                                <textarea id="db-query" rows="3" placeholder="SELECT date, category, clicks, revenue FROM organic_search_data WHERE date >= CURRENT_DATE - INTERVAL '365 days'"></textarea>
                            </div>
                        </div>

                        <div style="margin-top: 20px;">
                            <button type="button" onclick="testConnection()" class="btn btn-primary">Test Connection</button>
                            <button type="submit" class="btn btn-success">Save Configuration</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Manual Adjustments Tab -->
            <div id="adjustments-tab" class="tab-content">
                <div class="admin-section">
                    <h2>Add Manual Adjustment</h2>
                    <form id="addAdjustmentForm">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="adj-category">Category</label>
                                <input type="text" id="adj-category" placeholder="e.g., Electronics or ALL" required>
                            </div>
                            <div class="form-group">
                                <label for="adj-clicks-pct">Clicks Adjustment (%)</label>
                                <input type="number" id="adj-clicks-pct" step="0.1" placeholder="e.g., 15.0 or -10.0" required>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="adj-start-date">Start Date</label>
                                <input type="date" id="adj-start-date" required>
                            </div>
                            <div class="form-group">
                                <label for="adj-end-date">End Date</label>
                                <input type="date" id="adj-end-date" required>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="adj-reason">Reason</label>
                            <textarea id="adj-reason" rows="2" placeholder="e.g., Black Friday promotion"></textarea>
                        </div>
                        <button type="submit" class="btn btn-success">Add Adjustment</button>
                    </form>
                </div>

                <div class="admin-section">
                    <h2>Active Adjustments</h2>
                    <button onclick="loadAdjustments()" class="btn btn-secondary">Refresh List</button>
                    <table class="adjustments-table" id="adjustmentsTable">
                        <thead>
                            <tr>
                                <th>Category</th>
                                <th>Start Date</th>
                                <th>End Date</th>
                                <th>Adjustment %</th>
                                <th>Reason</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="adjustmentsTableBody">
                            <tr>
                                <td colspan="6" style="text-align: center; color: #999;">No adjustments loaded. Click "Refresh List" to load.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Forecast Parameters Tab -->
            <div id="forecast-tab" class="tab-content">
                <div class="admin-section">
                    <h2>Forecast Model Parameters</h2>
                    <form id="forecastConfigForm">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="fc-seasonal-weight">Seasonal Weight (0-1)</label>
                                <input type="number" id="fc-seasonal-weight" step="0.1" min="0" max="1" value="0.5">
                            </div>
                            <div class="form-group">
                                <label for="fc-run-rate-weight">Run Rate Weight (0-1)</label>
                                <input type="number" id="fc-run-rate-weight" step="0.1" min="0" max="1" value="0.5">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="fc-smoothing-alpha">Smoothing Alpha (0-1)</label>
                                <input type="number" id="fc-smoothing-alpha" step="0.05" min="0" max="1" value="0.3">
                            </div>
                            <div class="form-group">
                                <label for="fc-recent-window">Recent Window (days)</label>
                                <input type="number" id="fc-recent-window" min="7" max="90" value="28">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="fc-correlation">Correlation Strength (0-1)</label>
                                <input type="number" id="fc-correlation" step="0.05" min="0" max="1" value="0.85">
                            </div>
                            <div class="form-group">
                                <label for="fc-volatility">Volatility Factor (0-1)</label>
                                <input type="number" id="fc-volatility" step="0.1" min="0" max="1" value="0.7">
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="fc-forecast-days">Forecast Days</label>
                            <input type="number" id="fc-forecast-days" min="1" max="90" value="14">
                        </div>
                        <button type="button" onclick="loadForecastConfig()" class="btn btn-secondary">Load Current Config</button>
                        <button type="submit" class="btn btn-success">Save Configuration</button>
                    </form>
                </div>
            </div>


            <!-- Output Settings Tab -->
            <div id="output-tab" class="tab-content">
                <div class="admin-section">
                    <h2>Output Destinations</h2>
                    <form id="outputConfigForm">
                        <h3>CSV Output</h3>
                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="out-csv-enabled" checked>
                                Enable CSV Output
                            </label>
                        </div>
                        <div class="form-group">
                            <label for="out-csv-path">CSV Output Path</label>
                            <input type="text" id="out-csv-path" value="data/outputs/forecast_{timestamp}.csv">
                        </div>

                        <h3>Excel Output</h3>
                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="out-excel-enabled">
                                Enable Excel Output
                            </label>
                        </div>
                        <div class="form-group">
                            <label for="out-excel-path">Excel Output Path</label>
                            <input type="text" id="out-excel-path" value="data/outputs/forecast_{timestamp}.xlsx">
                        </div>

                        <h3>Database Output</h3>
                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="out-db-enabled">
                                Enable Database Output
                            </label>
                        </div>

                        <h3>Retention Settings</h3>
                        <div class="form-group">
                            <label for="out-retention-days">Keep Forecasts (days)</label>
                            <input type="number" id="out-retention-days" min="1" max="365" value="90">
                        </div>

                        <button type="button" onclick="loadOutputConfig()" class="btn btn-secondary">Load Current Config</button>
                        <button type="submit" class="btn btn-success">Save Configuration</button>
                    </form>
                </div>
            </div>
        </div>
    </div>

    <script>${adminJs}</script>
    <script>
        // Toggle BigQuery method
        function toggleBQMethod() {
            const method = document.getElementById('bq-load-method').value;
            const queryFields = document.getElementById('bqQueryFields');
            const tableFields = document.getElementById('bqTableFields');

            if (method === 'query') {
                queryFields.style.display = 'block';
                tableFields.style.display = 'none';
            } else {
                queryFields.style.display = 'none';
                tableFields.style.display = 'block';
            }
        }

        // Test connection
        async function testConnection() {
            const dbType = document.getElementById('db-type').value;

            if (!dbType) {
                alert('Please select a data source type first');
                return;
            }

            if (dbType === 'google_sheets') {
                const url = document.getElementById('gs-spreadsheet-url').value;
                const sheetName = document.getElementById('gs-sheet-name').value;

                if (!url) {
                    alert('Please enter a spreadsheet URL');
                    return;
                }

                // Show loading state
                const btn = event.target;
                const originalText = btn.textContent;
                btn.textContent = 'Testing...';
                btn.disabled = true;

                try {
                    const response = await fetch('/api/load-google-sheets', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            spreadsheet_url: url,
                            sheet_name: sheetName || null
                        })
                    });

                    const result = await response.json();

                    if (result.success) {
                        const summary = result.summary;
                        alert(\`✅ Connection Successful!\n\n\` +
                              \`Total Records: ${summary.total_records}\n\` +
                              \`Date Range: ${summary.date_range.start} to ${summary.date_range.end}\n\` +
                              \`Categories: ${summary.categories.length}\n\` +
                              \`Categories: ${summary.categories.join(', ')}\`);
                    } else {
                        alert(\`❌ Connection Failed\n\n${result.error}\`);
                    }
                } catch (error) {
                    alert(\`❌ Connection Error\n\n${error.message}\`);
                } finally {
                    btn.textContent = originalText;
                    btn.disabled = false;
                }
            } else if (dbType === 'bigquery') {
                const method = document.getElementById('bq-load-method').value;

                if (method === 'query') {
                    const query = document.getElementById('bq-query').value;
                    if (!query) {
                        alert('Please enter a SQL query');
                        return;
                    }
                } else {
                    const projectId = document.getElementById('bq-project-id').value;
                    const datasetId = document.getElementById('bq-dataset-id').value;
                    const tableId = document.getElementById('bq-table-id').value;
                    if (!projectId || !datasetId || !tableId) {
                        alert('Please fill in all table reference fields');
                        return;
                    }
                }

                const btn = event.target;
                const originalText = btn.textContent;
                btn.textContent = 'Testing...';
                btn.disabled = true;

                try {
                    const payload = method === 'query'
                        ? { query: document.getElementById('bq-query').value }
                        : {
                            project_id: document.getElementById('bq-project-id').value,
                            dataset_id: document.getElementById('bq-dataset-id').value,
                            table_id: document.getElementById('bq-table-id').value
                        };

                    const response = await fetch('/api/load-bigquery', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(payload)
                    });

                    const result = await response.json();

                    if (result.success) {
                        const summary = result.summary;
                        alert(\`✅ Connection Successful!\n\n\` +
                              \`Total Records: ${summary.total_records}\n\` +
                              \`Date Range: ${summary.date_range.start} to ${summary.date_range.end}\n\` +
                              \`Categories: ${summary.categories.length}\n\` +
                              \`Categories: ${summary.categories.join(', ')}\`);
                    } else {
                        alert(\`❌ Connection Failed\n\n${result.error}\`);
                    }
                } catch (error) {
                    alert(\`❌ Connection Error\n\n${error.message}\`);
                } finally {
                    btn.textContent = originalText;
                    btn.disabled = false;
                }
            } else if (dbType === 'csv') {
                alert('CSV files are uploaded directly from the dashboard');
            } else {
                alert('Traditional database connection testing will be implemented');
            }
        }
    </script>
</body>
</html>
`;
};
