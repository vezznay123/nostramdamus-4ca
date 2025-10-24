/**
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
    document.getElementById(`${tabName}-tab`).classList.add('active');

    // Highlight active button
    event.target.classList.add('active');
}

// Show status message
function showStatus(message, isError = false) {
    const statusEl = document.getElementById('statusMessage');
    statusEl.textContent = message;
    statusEl.className = `status-message ${isError ? 'status-error' : 'status-success'}`;
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
            showStatus(`Loaded ${data.count} adjustments`);
        } else {
            showStatus(data.error, true);
        }
    } catch (error) {
        showStatus(`Error loading adjustments: ${error.message}`, true);
    }
}

// Display adjustments in table
function displayAdjustments(adjustments) {
    const tbody = document.getElementById('adjustmentsTableBody');

    if (adjustments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #999;">No adjustments found</td></tr>';
        return;
    }

    tbody.innerHTML = adjustments.map(adj => `
        <tr>
            <td>${adj.category}</td>
            <td>${adj.start_date}</td>
            <td>${adj.end_date}</td>
            <td style="color: ${adj.clicks_adjustment_pct >= 0 ? '#27ae60' : '#e74c3c'}">
                ${adj.clicks_adjustment_pct > 0 ? '+' : ''}${adj.clicks_adjustment_pct}%
            </td>
            <td>${adj.reason}</td>
            <td>
                <button onclick="deleteAdjustment('${adj.id}')" class="btn btn-danger" style="padding: 6px 12px; font-size: 12px;">
                    Delete
                </button>
            </td>
        </tr>
    `).join('');
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
        showStatus(`Error adding adjustment: ${error.message}`, true);
    }
});

// Delete adjustment
async function deleteAdjustment(adjId) {
    if (!confirm('Are you sure you want to delete this adjustment?')) {
        return;
    }

    try {
        const response = await fetch(`/api/adjustments/delete/${adjId}`, {
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
        showStatus(`Error deleting adjustment: ${error.message}`, true);
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
        showStatus(`Error loading configuration: ${error.message}`, true);
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
        showStatus(`Error saving configuration: ${error.message}`, true);
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
        showStatus(`Error loading database config: ${error.message}`, true);
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
        showStatus(`Error saving configuration: ${error.message}`, true);
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
            showStatus(`Connection successful! Found ${data.records} records.`);
        } else {
            showStatus(`Connection failed: ${data.error}`, true);
        }
    } catch (error) {
        showStatus(`Error testing connection: ${error.message}`, true);
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
        showStatus(`Error loading output config: ${error.message}`, true);
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
        showStatus(`Error saving output config: ${error.message}`, true);
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
