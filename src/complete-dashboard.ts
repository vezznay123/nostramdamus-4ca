/**
 * Complete Nostradamus Dashboard
 * Auto-generated from Flask templates
 * Generated: 2025-10-24T21:42:12.181Z
 */

export const completeDashboardHTML = (userEmail: string, userName: string, userPicture: string) => {
  const cssContent = `/* Global Styles */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    background: #000000;
    color: #ffffff;
    line-height: 1.6;
    padding: 20px;
    min-height: 100vh;
    font-weight: 400;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}

.container {
    max-width: 1400px;
    margin: 0 auto;
    background: #1a1a1a;
    border-radius: 12px;
    box-shadow: 0 20px 60px rgba(248, 177, 51, 0.2);
    overflow: hidden;
    border: 1px solid #2a2a2a;
}

/* Header */
header {
    background: #000000;
    border-bottom: 2px solid #f8b133;
    color: white;
    padding: 30px;
    text-align: center;
}

header h1 {
    font-size: 2.5em;
    margin-bottom: 10px;
    font-weight: 700;
    color: #f8b133;
}

.subtitle {
    font-size: 1.1em;
    opacity: 0.95;
    color: #ffffff;
}

/* Card Sections */
.card {
    padding: 30px;
    border-bottom: 1px solid #2a2a2a;
    background: #1a1a1a;
}

.card:last-child {
    border-bottom: none;
}

.card h2 {
    color: #f8b133;
    margin-bottom: 20px;
    font-size: 1.8em;
    font-weight: 600;
}

/* Buttons */
.button-group {
    display: flex;
    gap: 15px;
    margin: 20px 0;
    flex-wrap: wrap;
}

.btn {
    padding: 12px 24px;
    border: none;
    border-radius: 8px;
    font-size: 1em;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    text-decoration: none;
    display: inline-block;
}

.btn-primary {
    background: #f8b133;
    color: #000000;
    font-weight: 700;
}

.btn-primary:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 5px 20px rgba(248, 177, 51, 0.5);
    background: #ffc04d;
}

.btn-secondary {
    background: #2a2a2a;
    color: #ffffff;
    border: 1px solid #f8b133;
}

.btn-secondary:hover:not(:disabled) {
    background: #3a3a3a;
    border-color: #ffc04d;
}

.btn-large {
    padding: 15px 40px;
    font-size: 1.1em;
}

.btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

/* Form Controls */
.controls-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 25px;
    margin: 25px 0;
}

.control-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.control-group label {
    font-weight: 600;
    color: #ffffff;
    font-size: 0.95em;
}

.input {
    padding: 10px 15px;
    border: 2px solid #2a2a2a;
    border-radius: 6px;
    font-size: 1em;
    transition: border-color 0.3s ease;
    background: #0a0a0a;
    color: #ffffff;
}

.input:focus {
    outline: none;
    border-color: #f8b133;
}

.slider {
    width: 100%;
    height: 8px;
    border-radius: 5px;
    background: #2a2a2a;
    outline: none;
    -webkit-appearance: none;
}

.slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #f8b133;
    cursor: pointer;
    transition: all 0.3s ease;
}

.slider::-webkit-slider-thumb:hover {
    transform: scale(1.2);
    background: #ffc04d;
}

.slider::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #f8b133;
    cursor: pointer;
    border: none;
}

.help-text {
    font-size: 0.85em;
    color: #aaaaaa;
    margin-top: 4px;
}

/* Data Summary */
.data-summary {
    background: #0a0a0a;
    padding: 20px;
    border-radius: 8px;
    margin-top: 20px;
    display: none;
    border: 1px solid #2a2a2a;
}

.data-summary.visible {
    display: block;
}

.summary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
    margin-top: 15px;
}

.summary-item {
    background: #1a1a1a;
    padding: 15px;
    border-radius: 6px;
    border-left: 4px solid #f8b133;
}

.summary-item h4 {
    color: #f8b133;
    font-size: 0.9em;
    margin-bottom: 8px;
    text-transform: uppercase;
    font-weight: 600;
}

.summary-item p {
    font-size: 1.3em;
    font-weight: 700;
    color: #ffffff;
}

/* Tabs */
.tabs {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
    flex-wrap: wrap;
}

.tab {
    padding: 10px 20px;
    background: #2a2a2a;
    border: 1px solid #3a3a3a;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.3s ease;
    color: #ffffff;
}

.tab:hover {
    background: #3a3a3a;
    border-color: #f8b133;
}

.tab.active {
    background: #f8b133;
    color: #000000;
    border-color: #f8b133;
}

/* Charts */
.chart-container {
    min-height: 400px;
    margin: 20px 0;
    background: #0a0a0a;
    border-radius: 8px;
    padding: 15px;
    border: 1px solid #2a2a2a;
    overflow: hidden;
    width: 100%;
    max-width: 100%;
}

.chart-container > div {
    width: 100% !important;
    max-width: 100% !important;
}

/* Loading Spinner */
.spinner-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.spinner {
    border: 4px solid #2a2a2a;
    border-top: 4px solid #f8b133;
    border-radius: 50%;
    width: 60px;
    height: 60px;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.spinner-overlay p {
    color: white;
    margin-top: 20px;
    font-size: 1.2em;
    font-weight: 600;
}

/* File Upload */
.file-upload {
    position: relative;
}

/* Responsive Design */
@media (max-width: 768px) {
    body {
        padding: 10px;
    }

    header h1 {
        font-size: 1.8em;
    }

    .card {
        padding: 20px;
    }

    .controls-grid {
        grid-template-columns: 1fr;
    }

    .button-group {
        flex-direction: column;
    }

    .btn {
        width: 100%;
    }
}

/* Correlation Metrics */
.correlation-metrics {
    background: #0a0a0a;
    border: 2px solid #f8b133;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 20px;
}

.correlation-metrics h3 {
    color: #f8b133;
    margin-bottom: 15px;
    font-size: 1.2em;
}

.metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
}

.metric-box {
    background: #1a1a1a;
    padding: 15px;
    border-radius: 6px;
    border-left: 4px solid #f8b133;
}

.metric-box .metric-label {
    font-size: 0.85em;
    color: #aaaaaa;
    margin-bottom: 5px;
}

.metric-box .metric-value {
    font-size: 1.5em;
    font-weight: 700;
    color: #ffffff;
}

.metric-box.good {
    border-left-color: #4ade80;
}

.metric-box.warning {
    border-left-color: #fbbf24;
}

.metric-box.info {
    border-left-color: #60a5fa;
}

/* Alert Messages */
.alert {
    padding: 15px 20px;
    border-radius: 6px;
    margin: 15px 0;
    font-weight: 500;
    border: 1px solid;
}

.alert-success {
    background: #1a2e1a;
    color: #4ade80;
    border-color: #4ade80;
    border-left: 4px solid #4ade80;
}

.alert-error {
    background: #2e1a1a;
    color: #f87171;
    border-color: #f87171;
    border-left: 4px solid #f87171;
}

.alert-info {
    background: #1a1a2e;
    color: #60a5fa;
    border-color: #60a5fa;
    border-left: 4px solid #60a5fa;
}
`;
  const appJs = `// Global state
let currentData = null;
let currentForecasts = null;
let currentHistorical = null;
let activeCategory = null;
let activityLog = [];

// DOM elements
const loadSampleBtn = document.getElementById('loadSampleBtn');
const fileInput = document.getElementById('fileInput');
const loadGoogleSheetsBtn = document.getElementById('loadGoogleSheetsBtn');
const googleSheetsModal = document.getElementById('googleSheetsModal');
const closeSheetsModalBtn = document.getElementById('closeSheetsModalBtn');
const loadSheetsDataBtn = document.getElementById('loadSheetsDataBtn');
const generateForecastBtn = document.getElementById('generateForecastBtn');
const exportBtn = document.getElementById('exportBtn');
const scheduleForecastBtn = document.getElementById('scheduleForecastBtn');
const calibrateModelBtn = document.getElementById('calibrateModelBtn');
const dataSummary = document.getElementById('dataSummary');
const categoryTabs = document.getElementById('categoryTabs');
const loadingSpinner = document.getElementById('loadingSpinner');
const activityLogList = document.getElementById('activityLogList');
const clearLogBtn = document.getElementById('clearLogBtn');

// BigQuery elements
const loadBigQueryBtn = document.getElementById('loadBigQueryBtn');
const bigQueryModal = document.getElementById('bigQueryModal');
const closeBigQueryModalBtn = document.getElementById('closeBigQueryModalBtn');
const loadBigQueryDataBtn = document.getElementById('loadBigQueryDataBtn');
const bqLoadMethod = document.getElementById('bqLoadMethod');

// Configured source elements
const loadConfiguredSourceBtn = document.getElementById('loadConfiguredSourceBtn');
const configuredSourceSection = document.getElementById('configuredSourceSection');
const configuredSourceLabel = document.getElementById('configuredSourceLabel');

// Slider elements
const sliders = {
    seasonalWeight: document.getElementById('seasonalWeight'),
    runRateWeight: document.getElementById('runRateWeight'),
    smoothingAlpha: document.getElementById('smoothingAlpha'),
    recentWindow: document.getElementById('recentWindow')
};

// Value display elements
const valueDisplays = {
    seasonalWeight: document.getElementById('seasonalWeightValue'),
    runRateWeight: document.getElementById('runRateWeightValue'),
    smoothingAlpha: document.getElementById('smoothingAlphaValue'),
    recentWindow: document.getElementById('recentWindowValue')
};

// Activity log functions
function addActivityLogEntry(type, message, details = {}) {
    const timestamp = new Date().toLocaleString();
    const entry = {
        type,
        message,
        timestamp,
        details
    };

    activityLog.unshift(entry); // Add to beginning of array

    // Keep only last 50 entries
    if (activityLog.length > 50) {
        activityLog = activityLog.slice(0, 50);
    }

    // Save to localStorage
    localStorage.setItem('nostradamus_activity_log', JSON.stringify(activityLog));

    renderActivityLog();
}

function renderActivityLog() {
    if (activityLog.length === 0) {
        activityLogList.innerHTML = \`
            <div style="text-align: center; color: #666; padding: 20px; font-style: italic;">
                No activity yet
            </div>
        \`;
        return;
    }

    activityLogList.innerHTML = activityLog.map(entry => {
        const icon = entry.type === 'data' ? '📊' : entry.type === 'forecast' ? '🔮' : entry.type === 'export' ? '💾' : '📌';
        const typeColor = entry.type === 'data' ? '#60a5fa' : entry.type === 'forecast' ? '#f8b133' : entry.type === 'export' ? '#4ade80' : '#aaaaaa';

        return \`
            <div style="background: #0a0a0a; border: 1px solid #2a2a2a; border-radius: 8px; padding: 15px; border-left: 3px solid \${typeColor};">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <span style="font-size: 1.2em;">\${icon}</span>
                        <span style="color: \${typeColor}; font-weight: 500;">\${entry.message}</span>
                    </div>
                    <span style="color: #666; font-size: 0.85em; white-space: nowrap;">\${entry.timestamp}</span>
                </div>
                \${Object.keys(entry.details).length > 0 ? \`
                    <div style="margin-left: 32px; font-size: 0.9em; color: #aaaaaa;">
                        \${Object.entries(entry.details).map(([key, value]) =>
                            \`<div>\${key}: <span style="color: #ffffff;">\${value}</span></div>\`
                        ).join('')}
                    </div>
                \` : ''}
            </div>
        \`;
    }).join('');
}

function clearActivityLog() {
    activityLog = [];
    localStorage.removeItem('nostradamus_activity_log');
    renderActivityLog();
}

function loadActivityLog() {
    const stored = localStorage.getItem('nostradamus_activity_log');
    if (stored) {
        try {
            activityLog = JSON.parse(stored);
            renderActivityLog();
        } catch (e) {
            console.error('Error loading activity log:', e);
        }
    }
}

// Initialize event listeners
function initEventListeners() {
    // Data source modal
    const changeDataSourceBtn = document.getElementById('changeDataSourceBtn');
    if (changeDataSourceBtn) {
        changeDataSourceBtn.addEventListener('click', () => {
            document.getElementById('dataSourceModal').style.display = 'flex';
        });
    }

    const closeDataSourceModalBtn = document.getElementById('closeDataSourceModalBtn');
    if (closeDataSourceModalBtn) {
        closeDataSourceModalBtn.addEventListener('click', () => {
            document.getElementById('dataSourceModal').style.display = 'none';
        });
    }

    const loadCSVBtn = document.getElementById('loadCSVBtn');
    if (loadCSVBtn) {
        loadCSVBtn.addEventListener('click', () => {
            fileInput.click();
        });
    }

    loadSampleBtn.addEventListener('click', () => {
        loadSampleData();
        document.getElementById('dataSourceModal').style.display = 'none';
    });
    fileInput.addEventListener('change', handleFileUpload);
    loadGoogleSheetsBtn.addEventListener('click', () => {
        document.getElementById('dataSourceModal').style.display = 'none';
        googleSheetsModal.style.display = 'flex';
    });
    closeSheetsModalBtn.addEventListener('click', () => {
        googleSheetsModal.style.display = 'none';
    });
    loadSheetsDataBtn.addEventListener('click', loadGoogleSheetsData);
    generateForecastBtn.addEventListener('click', generateForecast);
    exportBtn.addEventListener('click', exportForecast);
    clearLogBtn.addEventListener('click', clearActivityLog);

    if (loadBigQueryBtn) {
        loadBigQueryBtn.addEventListener('click', () => {
            document.getElementById('dataSourceModal').style.display = 'none';
            bigQueryModal.style.display = 'flex';
        });
    }

    if (closeBigQueryModalBtn) {
        closeBigQueryModalBtn.addEventListener('click', () => {
            bigQueryModal.style.display = 'none';
        });
    }

    if (loadBigQueryDataBtn) {
        loadBigQueryDataBtn.addEventListener('click', loadBigQueryData);
    }

    // Load configured source button
    if (loadConfiguredSourceBtn) {
        loadConfiguredSourceBtn.addEventListener('click', loadConfiguredSource);
    }

    // Scheduler config button
    const saveSchedulerConfigBtn = document.getElementById('saveSchedulerConfigBtn');
    if (saveSchedulerConfigBtn) {
        saveSchedulerConfigBtn.addEventListener('click', saveSchedulerConfig);
    }

    // Push to data source button
    const pushToSourceBtn = document.getElementById('pushToSourceBtn');
    if (pushToSourceBtn) {
        pushToSourceBtn.addEventListener('click', pushToDataSource);
    }

    // Auto-calibration button
    const autoCalibrationBtn = document.getElementById('autoCalibrationBtn');
    if (autoCalibrationBtn) {
        autoCalibrationBtn.addEventListener('click', runAutoCalibration);
    }

    if (bqLoadMethod) {
        bqLoadMethod.addEventListener('change', (e) => {
            const querySection = document.getElementById('bqQuerySection');
            const tableSection = document.getElementById('bqTableSection');
            if (e.target.value === 'query') {
                querySection.style.display = 'block';
                tableSection.style.display = 'none';
            } else {
                querySection.style.display = 'none';
                tableSection.style.display = 'block';
            }
        });
    }

    if (scheduleForecastBtn) {
        scheduleForecastBtn.addEventListener('click', () => {
            document.getElementById('schedulingSection').style.display = 'block';
            document.getElementById('schedulingSection').scrollIntoView({ behavior: 'smooth' });
        });
    }

    if (calibrateModelBtn) {
        calibrateModelBtn.addEventListener('click', () => {
            // Populate category dropdown
            if (currentData) {
                const categories = [...new Set(currentData.categories)];
                const select = document.getElementById('calibrationCategory');
                select.innerHTML = categories.map(cat =>
                    \`<option value="\${cat}">\${cat}</option>\`
                ).join('');
            }
            document.getElementById('calibrationSection').style.display = 'block';
            document.getElementById('calibrationSection').scrollIntoView({ behavior: 'smooth' });
        });
    }

    // Google Apps Script button
    const generateAppsScriptBtn = document.getElementById('generateAppsScriptBtn');
    if (generateAppsScriptBtn) {
        generateAppsScriptBtn.addEventListener('click', generateAppsScript);
    }

    // Apps Script modal buttons
    const closeAppsScriptModalBtn = document.getElementById('closeAppsScriptModalBtn');
    if (closeAppsScriptModalBtn) {
        closeAppsScriptModalBtn.addEventListener('click', () => {
            document.getElementById('appsScriptModal').style.display = 'none';
        });
    }

    const copyScriptBtn = document.getElementById('copyScriptBtn');
    if (copyScriptBtn) {
        copyScriptBtn.addEventListener('click', copyScriptToClipboard);
    }

    // Update slider value displays
    Object.keys(sliders).forEach(key => {
        sliders[key].addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            if (key === 'recentWindow') {
                valueDisplays[key].textContent = value;
            } else {
                valueDisplays[key].textContent = value.toFixed(2);
            }
        });
    });

    // Load activity log from localStorage
    loadActivityLog();

    // Check for saved data source configuration
    checkForSavedConfig();

    // Auto-load configured source if available and no data loaded yet
    autoLoadConfiguredSource();
}

// Auto-load configured source on page load if available
async function autoLoadConfiguredSource() {
    try {
        // Check if we already have data loaded
        if (currentData) {
            return;
        }

        // Check if saved configuration exists
        const response = await fetch('/api/config/data-source');
        const data = await response.json();

        if (data.success && data.config) {
            // Config exists - auto-load it
            console.log('Auto-loading configured data source...');
            await loadConfiguredSource();
        } else {
            // No config - show modal if no previous data source
            if (!localStorage.getItem('last_data_source')) {
                document.getElementById('dataSourceModal').style.display = 'flex';
            }
        }
    } catch (error) {
        // No saved config - show modal if no previous data source
        if (!localStorage.getItem('last_data_source')) {
            document.getElementById('dataSourceModal').style.display = 'flex';
        }
    }
}

// Show/hide loading spinner
function showLoading(show = true) {
    loadingSpinner.style.display = show ? 'flex' : 'none';
}

// Show alert message
function showAlert(message, type = 'info') {
    const existingAlert = document.querySelector('.alert');
    if (existingAlert) {
        existingAlert.remove();
    }

    const alert = document.createElement('div');
    alert.className = \`alert alert-\${type}\`;
    alert.textContent = message;

    const firstCard = document.querySelector('.card');
    firstCard.insertAdjacentElement('beforebegin', alert);

    setTimeout(() => alert.remove(), 5000);
}

// Load sample data
async function loadSampleData() {
    showLoading();
    try {
        const response = await fetch('/api/load-sample-data', {
            method: 'POST'
        });

        const data = await response.json();

        if (data.success) {
            currentData = data.summary;
            displayDataSummary(data.summary);
            generateForecastBtn.disabled = false;
            scheduleForecastBtn.disabled = false;
            calibrateModelBtn.disabled = false;
            showAlert('Sample data loaded successfully!', 'success');
            addActivityLogEntry('data', 'Sample data loaded', {
                'Records': data.summary.total_records.toLocaleString(),
                'Categories': data.summary.categories.length
            });
        } else {
            showAlert(data.error, 'error');
        }
    } catch (error) {
        showAlert('Error loading sample data: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Handle file upload
async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    showLoading();
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('/api/upload-data', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            currentData = data.summary;
            displayDataSummary(data.summary);
            generateForecastBtn.disabled = false;
            scheduleForecastBtn.disabled = false;
            calibrateModelBtn.disabled = false;
            showAlert('Data uploaded successfully!', 'success');
            addActivityLogEntry('data', 'CSV data uploaded', {
                'Records': data.summary.total_records.toLocaleString(),
                'Categories': data.summary.categories.length,
                'File': file.name
            });
        } else {
            showAlert(data.error, 'error');
        }
    } catch (error) {
        showAlert('Error uploading file: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Load Google Sheets data
async function loadGoogleSheetsData() {
    const sheetsUrl = document.getElementById('sheetsUrl').value.trim();
    const sheetsName = document.getElementById('sheetsName').value.trim();

    if (!sheetsUrl) {
        showAlert('Please enter a spreadsheet URL', 'error');
        return;
    }

    showLoading();
    googleSheetsModal.style.display = 'none';

    try {
        const response = await fetch('/api/load-google-sheets', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                spreadsheet_url: sheetsUrl,
                sheet_name: sheetsName || null
            })
        });

        const data = await response.json();

        if (data.success) {
            currentData = data.summary;
            displayDataSummary(data.summary);
            generateForecastBtn.disabled = false;
            scheduleForecastBtn.disabled = false;
            calibrateModelBtn.disabled = false;
            showAlert('Google Sheets data loaded successfully!', 'success');
            addActivityLogEntry('data', 'Google Sheets data loaded', {
                'Records': data.summary.total_records.toLocaleString(),
                'Categories': data.summary.categories.length,
                'Source': 'Google Sheets'
            });

            // Store data source info for scheduler
            storeDataSourceInfo('google_sheets', {
                url: sheetsUrl,
                sheetName: sheetsName
            });

            // Clear the form
            document.getElementById('sheetsUrl').value = '';
            document.getElementById('sheetsName').value = '';
        } else {
            showAlert(data.error, 'error');
        }
    } catch (error) {
        showAlert('Error loading Google Sheets data: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Load BigQuery data
async function loadBigQueryData() {
    const loadMethod = document.getElementById('bqLoadMethod').value;

    let payload = {};

    if (loadMethod === 'query') {
        const query = document.getElementById('bqQuery').value.trim();
        if (!query) {
            showAlert('Please enter a SQL query', 'error');
            return;
        }
        payload.query = query;
    } else {
        const projectId = document.getElementById('bqProjectId').value.trim();
        const datasetId = document.getElementById('bqDatasetId').value.trim();
        const tableId = document.getElementById('bqTableId').value.trim();

        if (!projectId || !datasetId || !tableId) {
            showAlert('Please provide project ID, dataset ID, and table ID', 'error');
            return;
        }

        payload.project_id = projectId;
        payload.dataset_id = datasetId;
        payload.table_id = tableId;
    }

    showLoading();
    bigQueryModal.style.display = 'none';

    try {
        const response = await fetch('/api/load-bigquery', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (data.success) {
            currentData = data.summary;
            displayDataSummary(data.summary);
            generateForecastBtn.disabled = false;
            scheduleForecastBtn.disabled = false;
            calibrateModelBtn.disabled = false;
            showAlert('BigQuery data loaded successfully!', 'success');
            addActivityLogEntry('data', 'BigQuery data loaded', {
                'Records': data.summary.total_records.toLocaleString(),
                'Categories': data.summary.categories.length,
                'Source': 'BigQuery'
            });

            // Clear the form
            document.getElementById('bqQuery').value = '';
            document.getElementById('bqProjectId').value = '';
            document.getElementById('bqDatasetId').value = '';
            document.getElementById('bqTableId').value = '';
        } else {
            showAlert(data.error, 'error');
        }
    } catch (error) {
        showAlert('Error loading BigQuery data: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Check for saved data source configuration
async function checkForSavedConfig() {
    try {
        const response = await fetch('/api/config/data-source');
        const data = await response.json();

        if (data.success && data.config) {
            const config = data.config;
            const sourceType = config.source_type;

            // Update label based on source type
            let label = 'Load Configured Source';
            if (sourceType === 'google_sheets') {
                label = '⚙️ Load from Google Sheets (Configured)';
            } else if (sourceType === 'bigquery') {
                label = '⚙️ Load from BigQuery (Configured)';
            } else if (sourceType === 'csv') {
                label = '⚙️ Load from CSV (Configured)';
            }

            configuredSourceLabel.innerHTML = \`<span>\${label}</span>\`;

            // Show the configured source section
            configuredSourceSection.style.display = 'block';

            // Update "Or choose another source" label visibility
            const otherSourcesLabel = document.getElementById('otherSourcesLabel');
            if (otherSourcesLabel) {
                otherSourcesLabel.style.display = 'block';
            }
        }
    } catch (error) {
        // No saved config or error - hide the button
        configuredSourceSection.style.display = 'none';
        const otherSourcesLabel = document.getElementById('otherSourcesLabel');
        if (otherSourcesLabel) {
            otherSourcesLabel.style.display = 'none';
        }
    }
}

// Load data from configured source
async function loadConfiguredSource() {
    try {
        const response = await fetch('/api/config/data-source');
        const data = await response.json();

        if (!data.success || !data.config) {
            showAlert('No saved configuration found', 'error');
            return;
        }

        const config = data.config;
        const sourceType = config.source_type;

        // Close the data source modal
        document.getElementById('dataSourceModal').style.display = 'none';

        // Load based on source type
        if (sourceType === 'google_sheets') {
            await loadFromConfigGoogleSheets(config);
        } else if (sourceType === 'bigquery') {
            await loadFromConfigBigQuery(config);
        } else if (sourceType === 'csv') {
            showAlert('CSV loading from configuration not yet implemented', 'info');
        } else {
            showAlert('Unknown source type: ' + sourceType, 'error');
        }
    } catch (error) {
        showAlert('Error loading configured source: ' + error.message, 'error');
    }
}

// Load Google Sheets using saved configuration
async function loadFromConfigGoogleSheets(config) {
    showLoading();

    try {
        const payload = {
            spreadsheet_url: config.spreadsheet_url,
            sheet_name: config.sheet_name || null
        };

        const response = await fetch('/api/load-google-sheets', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (data.success) {
            currentData = data.summary;

            // Store data source info in localStorage
            localStorage.setItem('last_data_source', 'google_sheets');
            localStorage.setItem('last_sheets_url', config.spreadsheet_url);

            displayDataSummary(data.summary);
            generateForecastBtn.disabled = false;
            scheduleForecastBtn.disabled = false;
            calibrateModelBtn.disabled = false;
            showAlert('Google Sheets data loaded successfully!', 'success');
            addActivityLogEntry('data', 'Google Sheets data loaded (from config)', {
                'Records': data.summary.total_records.toLocaleString(),
                'Categories': data.summary.categories.length,
                'Source': 'Google Sheets (Configured)'
            });
        } else {
            showAlert(data.error, 'error');
        }
    } catch (error) {
        showAlert('Error loading Google Sheets: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Load BigQuery using saved configuration
async function loadFromConfigBigQuery(config) {
    showLoading();

    try {
        let payload = {};
        const loadMethod = config.load_method || 'query';

        if (loadMethod === 'query') {
            payload.query = config.query;
        } else {
            payload.project_id = config.project_id;
            payload.dataset_id = config.dataset_id;
            payload.table_id = config.table_id;
        }

        const response = await fetch('/api/load-bigquery', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (data.success) {
            currentData = data.summary;

            // Store data source info in localStorage
            localStorage.setItem('last_data_source', 'bigquery');

            displayDataSummary(data.summary);
            generateForecastBtn.disabled = false;
            scheduleForecastBtn.disabled = false;
            calibrateModelBtn.disabled = false;
            showAlert('BigQuery data loaded successfully!', 'success');
            addActivityLogEntry('data', 'BigQuery data loaded (from config)', {
                'Records': data.summary.total_records.toLocaleString(),
                'Categories': data.summary.categories.length,
                'Source': 'BigQuery (Configured)'
            });
        } else {
            showAlert(data.error, 'error');
        }
    } catch (error) {
        showAlert('Error loading BigQuery data: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Display data summary
function displayDataSummary(summary) {
    // Show data source summary section
    document.getElementById('dataSourceSummary').style.display = 'block';

    // Update data source info
    const dataSourceType = localStorage.getItem('last_data_source');
    let dataSourceText = '';
    if (dataSourceType === 'google_sheets') {
        const url = localStorage.getItem('last_sheets_url');
        dataSourceText = \`Google Sheets: \${url.substring(0, 50)}...\`;
    } else if (dataSourceType === 'bigquery') {
        dataSourceText = 'BigQuery';
    } else if (dataSourceType === 'csv') {
        dataSourceText = 'CSV Upload';
    } else {
        dataSourceText = 'Sample Data';
    }
    document.getElementById('dataSourceInfo').textContent = dataSourceText;

    let html = '<h3>Data Summary</h3>';
    html += '<div class="summary-grid">';

    html += \`
        <div class="summary-item">
            <h4>Total Records</h4>
            <p>\${summary.total_records.toLocaleString()}</p>
        </div>
        <div class="summary-item">
            <h4>Date Range</h4>
            <p>\${summary.date_range.start} to \${summary.date_range.end}</p>
        </div>
        <div class="summary-item">
            <h4>Categories</h4>
            <p>\${summary.categories.length}</p>
        </div>
    \`;

    if (summary.metrics) {
        html += \`
            <div class="summary-item">
                <h4>Total Clicks</h4>
                <p>\${summary.metrics.total_clicks.toLocaleString()}</p>
            </div>
            <div class="summary-item">
                <h4>Total Revenue</h4>
                <p>£\${summary.metrics.total_revenue.toLocaleString()}</p>
            </div>
            <div class="summary-item">
                <h4>Avg Daily Clicks</h4>
                <p>\${Math.round(summary.metrics.avg_daily_clicks).toLocaleString()}</p>
            </div>
            <div class="summary-item">
                <h4>Avg Daily Revenue</h4>
                <p>£\${Math.round(summary.metrics.avg_daily_revenue).toLocaleString()}</p>
            </div>
        \`;
    }

    html += '</div>';
    html += \`<p style="margin-top: 15px;"><strong>Categories:</strong> \${summary.categories.join(', ')}</p>\`;

    dataSummary.innerHTML = html;
}

// Generate forecast
async function generateForecast() {
    if (!currentData) {
        showAlert('Please load data first', 'error');
        return;
    }

    showLoading();

    const params = {
        seasonal_weight: parseFloat(sliders.seasonalWeight.value),
        run_rate_weight: parseFloat(sliders.runRateWeight.value),
        smoothing_alpha: parseFloat(sliders.smoothingAlpha.value),
        recent_window_days: parseInt(sliders.recentWindow.value),
        forecast_days: parseInt(document.getElementById('forecastDays').value),
        metric: document.getElementById('metricSelect').value
    };

    try {
        // Get forecast
        const forecastResponse = await fetch('/api/forecast', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params)
        });

        const forecastData = await forecastResponse.json();

        if (forecastData.success) {
            currentForecasts = forecastData.forecasts;

            // Get historical data
            const historicalResponse = await fetch(
                \`/api/historical-data?metric=\${params.metric}&days=90\`
            );
            const historicalData = await historicalResponse.json();

            if (historicalData.success) {
                currentHistorical = historicalData.historical;
                displayForecastResults(params.metric);
                exportBtn.disabled = false;
                // Enable push button if data source is Google Sheets
                const pushToSourceBtn = document.getElementById('pushToSourceBtn');
                if (pushToSourceBtn && localStorage.getItem('last_data_source') === 'google_sheets') {
                    pushToSourceBtn.disabled = false;
                }
                showAlert('Forecast generated successfully!', 'success');
                addActivityLogEntry('forecast', 'Forecast generated', {
                    'Mode': 'Single Metric',
                    'Metric': params.metric === 'clicks' ? 'Clicks' : 'Revenue',
                    'Forecast Days': params.forecast_days,
                    'Categories': Object.keys(currentForecasts).length
                });
            }
        } else {
            showAlert(forecastData.error, 'error');
        }
    } catch (error) {
        showAlert('Error generating forecast: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Display forecast results
function displayForecastResults(metric) {
    const categories = Object.keys(currentForecasts);

    // Create category tabs
    categoryTabs.innerHTML = '';
    categories.forEach((category, index) => {
        const tab = document.createElement('button');
        tab.className = 'tab' + (index === 0 ? ' active' : '');
        tab.textContent = category;
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            plotCategory(category, metric);
        });
        categoryTabs.appendChild(tab);
    });

    // Plot first category
    if (categories.length > 0) {
        plotCategory(categories[0], metric);
    }
}

// Plot forecast for a category
function plotCategory(category, metric) {
    activeCategory = category;

    const forecast = currentForecasts[category];
    const historical = currentHistorical[category];

    // Main forecast chart
    const historicalTrace = {
        x: historical.dates,
        y: historical.values,
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Historical',
        line: { color: '#60a5fa', width: 2 },
        marker: { size: 4 }
    };

    const forecastTrace = {
        x: forecast.dates,
        y: forecast.values,
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Forecast',
        line: { color: '#f8b133', width: 3, dash: 'dash' },
        marker: { size: 6 }
    };

    const mainLayout = {
        title: {
            text: \`\${category} - \${metric === 'clicks' ? 'Organic Search Clicks' : 'Organic Search Revenue (£)'}\`,
            font: { size: 18, color: '#f8b133' }
        },
        xaxis: {
            title: 'Date',
            showgrid: true,
            gridcolor: '#2a2a2a',
            color: '#ffffff'
        },
        yaxis: {
            title: metric === 'clicks' ? 'Clicks' : 'Revenue (£)',
            showgrid: true,
            gridcolor: '#2a2a2a',
            color: '#ffffff'
        },
        hovermode: 'x unified',
        plot_bgcolor: '#0a0a0a',
        paper_bgcolor: '#0a0a0a',
        font: { color: '#ffffff' },
        margin: { t: 50, r: 30, b: 50, l: 60 }
    };

    Plotly.newPlot('forecastChart', [historicalTrace, forecastTrace], mainLayout, {
        responsive: true
    });

    // Components breakdown chart
    const seasonalTrace = {
        x: forecast.dates,
        y: forecast.seasonal,
        type: 'bar',
        name: 'Seasonal Adjustment',
        marker: { color: '#60a5fa' }
    };

    const runRateTrace = {
        x: forecast.dates,
        y: forecast.run_rate,
        type: 'scatter',
        mode: 'lines',
        name: 'Run Rate',
        line: { color: '#4ade80', width: 3 }
    };

    const componentsLayout = {
        title: {
            text: 'Forecast Components Breakdown',
            font: { size: 18, color: '#f8b133' }
        },
        xaxis: {
            title: 'Date',
            showgrid: true,
            gridcolor: '#2a2a2a',
            color: '#ffffff'
        },
        yaxis: {
            title: 'Value',
            showgrid: true,
            gridcolor: '#2a2a2a',
            color: '#ffffff'
        },
        hovermode: 'x unified',
        plot_bgcolor: '#0a0a0a',
        paper_bgcolor: '#0a0a0a',
        font: { color: '#ffffff' },
        margin: { t: 50, r: 30, b: 50, l: 60 }
    };

    Plotly.newPlot('componentsChart', [runRateTrace, seasonalTrace], componentsLayout, {
        responsive: true
    });
}

// Export forecast
async function exportForecast() {
    if (!currentForecasts) {
        showAlert('No forecast to export', 'error');
        return;
    }

    try {
        const response = await fetch('/api/export-forecast', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ forecast_data: currentForecasts })
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = \`forecast_\${new Date().toISOString().split('T')[0]}.csv\`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            showAlert('Forecast exported successfully!', 'success');
            addActivityLogEntry('export', 'Forecast exported to CSV', {
                'Categories': Object.keys(currentForecasts).length,
                'Format': 'CSV'
            });
        } else {
            showAlert('Error exporting forecast', 'error');
        }
    } catch (error) {
        showAlert('Error exporting forecast: ' + error.message, 'error');
    }
}

// Save scheduler configuration
async function saveSchedulerConfig() {
    if (!currentData) {
        showAlert('Please load data first before saving scheduler configuration', 'error');
        return;
    }

    try {
        // Determine data source type
        let dataSource = {};
        const lastLoadedFrom = localStorage.getItem('last_data_source');

        if (lastLoadedFrom === 'google_sheets') {
            const spreadsheetUrl = localStorage.getItem('last_sheets_url');
            const sheetName = localStorage.getItem('last_sheet_name');
            dataSource = {
                type: 'google_sheets',
                spreadsheet_url: spreadsheetUrl,
                sheet_name: sheetName
            };
        } else if (lastLoadedFrom === 'bigquery') {
            dataSource = {
                type: 'bigquery',
                query: localStorage.getItem('last_bq_query'),
                project_id: localStorage.getItem('last_bq_project'),
                dataset_id: localStorage.getItem('last_bq_dataset'),
                table_id: localStorage.getItem('last_bq_table')
            };
        } else {
            showAlert('Cannot schedule CSV uploads. Please use Google Sheets or BigQuery.', 'error');
            return;
        }

        // Get current forecast parameters
        const forecastParams = {
            mode: document.querySelector('input[name="forecastMode"]:checked')?.value || 'volatility',
            seasonal_weight: parseFloat(sliders.seasonalWeight.value),
            run_rate_weight: parseFloat(sliders.runRateWeight.value),
            smoothing_alpha: parseFloat(sliders.smoothingAlpha.value),
            recent_window_days: parseInt(sliders.recentWindow.value),
            correlation_strength: parseFloat(document.getElementById('correlationStrength')?.value || 0.85),
            volatility_factor: parseFloat(document.getElementById('volatilityFactor')?.value || 0.7),
            forecast_days: 14
        };

        // Output configuration
        const outputConfig = {
            save_to_sheets: true,
            output_sheet_name: 'Forecast_Results',
            save_to_csv: true
        };

        const config = {
            data_source: dataSource,
            forecast_params: forecastParams,
            output_config: outputConfig
        };

        const response = await fetch('/api/save-scheduler-config', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(config)
        });

        const result = await response.json();

        if (result.success) {
            showAlert('Scheduler configuration saved! You can now set up automated forecasts.', 'success');
            addActivityLogEntry('config', 'Scheduler configuration saved', {
                'Data Source': dataSource.type,
                'Mode': forecastParams.mode
            });
        } else {
            showAlert('Error saving configuration: ' + result.error, 'error');
        }
    } catch (error) {
        showAlert('Error saving scheduler configuration: ' + error.message, 'error');
    }
}

// Store data source info when loading
function storeDataSourceInfo(type, details) {
    localStorage.setItem('last_data_source', type);
    if (type === 'google_sheets') {
        localStorage.setItem('last_sheets_url', details.url);
        localStorage.setItem('last_sheet_name', details.sheetName || '');
    } else if (type === 'bigquery') {
        localStorage.setItem('last_bq_query', details.query || '');
        localStorage.setItem('last_bq_project', details.projectId || '');
        localStorage.setItem('last_bq_dataset', details.datasetId || '');
        localStorage.setItem('last_bq_table', details.tableId || '');
    }
}

// Push results back to data source
async function pushToDataSource() {
    if (!currentForecasts) {
        showAlert('Please generate forecasts first', 'error');
        return;
    }

    const sourceType = localStorage.getItem('last_data_source');

    if (!sourceType) {
        showAlert('No data source found. Please load data from Google Sheets first.', 'error');
        return;
    }

    if (sourceType !== 'google_sheets') {
        showAlert('Push to data source is currently only supported for Google Sheets', 'error');
        return;
    }

    const spreadsheetUrl = localStorage.getItem('last_sheets_url');
    if (!spreadsheetUrl) {
        showAlert('No spreadsheet URL found', 'error');
        return;
    }

    showLoading();

    try {
        const response = await fetch('/api/push-results', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                forecasts: currentForecasts,
                source_type: sourceType,
                spreadsheet_url: spreadsheetUrl,
                output_sheet_name: 'Forecast_Results'
            })
        });

        const result = await response.json();

        if (result.success) {
            showAlert(\`Results pushed to Google Sheets! \${result.records_written} records written to "\${result.sheet_name}" tab.\`, 'success');
            addActivityLogEntry('push', 'Forecast results pushed to Google Sheets', {
                'Records': result.records_written,
                'Categories': result.categories.length,
                'Sheet': result.sheet_name
            });
        } else {
            showAlert('Error pushing results: ' + result.error, 'error');
        }
    } catch (error) {
        showAlert('Error pushing results: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Run auto-calibration (includes backtesting)
async function runAutoCalibration() {
    if (!currentData) {
        showAlert('Please load data first', 'error');
        return;
    }

    const mode = document.querySelector('input[name="forecastMode"]:checked')?.value || 'single';
    const category = document.getElementById('calibrationCategory').value;
    const metric = document.getElementById('calibrationMetric').value;
    const testWeeks = parseInt(document.getElementById('calibrationWeeks').value);

    if (!category) {
        showAlert('Please select a category', 'error');
        return;
    }

    showAlert('Running auto-calibration with backtesting... This may take 1-2 minutes.', 'info');
    showLoading();

    try {
        const params = {
            mode: mode,
            category: category,
            test_weeks: testWeeks,
            forecast_days: 7
        };

        if (mode === 'single') {
            params.metric = metric;
        }

        const response = await fetch('/api/calibrate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(params)
        });

        const result = await response.json();

        if (result.success) {
            const cal = result.calibration;

            // Update sliders with optimal parameters
            sliders.seasonalWeight.value = cal.best_params.seasonal_weight;
            sliders.runRateWeight.value = cal.best_params.run_rate_weight;
            sliders.smoothingAlpha.value = cal.best_params.smoothing_alpha;
            sliders.recentWindow.value = cal.best_params.recent_window_days;

            // Update value displays
            valueDisplays.seasonalWeight.textContent = cal.best_params.seasonal_weight.toFixed(2);
            valueDisplays.runRateWeight.textContent = cal.best_params.run_rate_weight.toFixed(2);
            valueDisplays.smoothingAlpha.textContent = cal.best_params.smoothing_alpha.toFixed(2);
            valueDisplays.recentWindow.textContent = cal.best_params.recent_window_days;

            // Display calibration results
            const calibrationResults = document.getElementById('calibrationResults');
            const calibrationMetrics = document.getElementById('calibrationMetrics');

            if (calibrationResults && calibrationMetrics) {
                calibrationResults.style.display = 'block';

                let metricsHTML = '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">';

                // Show MAE if available
                if (cal.performance && cal.performance.mae !== undefined) {
                    metricsHTML += \`
                        <div class="metric-box good">
                            <div class="metric-label">Mean Absolute Error</div>
                            <div class="metric-value">\${cal.performance.mae.toFixed(2)}</div>
                        </div>
                    \`;
                }

                // Show MAPE (primary metric)
                const mape = cal.best_mape || (cal.performance && cal.performance.mape);
                if (mape !== undefined) {
                    metricsHTML += \`
                        <div class="metric-box good">
                            <div class="metric-label">Mean Absolute % Error</div>
                            <div class="metric-value">\${mape.toFixed(2)}%</div>
                        </div>
                    \`;
                }

                // Show RMSE if available
                if (cal.performance && cal.performance.rmse !== undefined) {
                    metricsHTML += \`
                        <div class="metric-box good">
                            <div class="metric-label">Root Mean Squared Error</div>
                            <div class="metric-value">\${cal.performance.rmse.toFixed(2)}</div>
                        </div>
                    \`;
                }

                // Show test weeks
                metricsHTML += \`
                    <div class="metric-box info">
                        <div class="metric-label">Test Weeks</div>
                        <div class="metric-value">\${testWeeks}</div>
                    </div>
                \`;

                metricsHTML += '</div>';
                calibrationMetrics.innerHTML = metricsHTML;

                calibrationResults.scrollIntoView({ behavior: 'smooth' });
            }

            showAlert(
                \`Calibration complete! Best MAPE: \${mape.toFixed(2)}%. Parameters updated.\`,
                'success'
            );

            addActivityLogEntry('calibration', 'Model auto-calibrated', {
                'Category': category,
                'Test Weeks': testWeeks,
                'Best MAPE': mape.toFixed(2) + '%',
                'Seasonal Weight': cal.best_params.seasonal_weight.toFixed(2)
            });
        } else {
            showAlert('Error running calibration: ' + result.error, 'error');
        }
    } catch (error) {
        showAlert('Error running calibration: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Generate Google Apps Script
async function generateAppsScript() {
    // Check if Google Sheets was used
    const lastDataSource = localStorage.getItem('last_data_source');
    if (lastDataSource !== 'google_sheets') {
        showAlert('Please load data from Google Sheets first to generate the script.', 'warning');
        return;
    }

    const spreadsheetUrl = localStorage.getItem('last_sheets_url');
    if (!spreadsheetUrl) {
        showAlert('No Google Sheets URL found. Please load data from Google Sheets first.', 'error');
        return;
    }

    // Get current forecast parameters
    const mode = document.querySelector('input[name="forecastMode"]:checked')?.value || 'volatility';
    const forecastParams = {
        mode: mode,
        seasonal_weight: parseFloat(sliders.seasonalWeight.value),
        run_rate_weight: parseFloat(sliders.runRateWeight.value),
        smoothing_alpha: parseFloat(sliders.smoothingAlpha.value),
        recent_window_days: parseInt(sliders.recentWindow.value),
        forecast_days: parseInt(document.getElementById('forecastDays').value)
    };

    // Add mode-specific parameters
    if (mode === 'correlated' || mode === 'volatility') {
        const correlationStrength = document.getElementById('correlationStrength');
        if (correlationStrength) {
            forecastParams.correlation_strength = parseFloat(correlationStrength.value);
        }
    }

    if (mode === 'volatility') {
        const volatilityFactor = document.getElementById('volatilityFactor');
        if (volatilityFactor) {
            forecastParams.volatility_factor = parseFloat(volatilityFactor.value);
        }
    }

    showLoading();

    try {
        const response = await fetch('/api/generate-apps-script', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                spreadsheet_url: spreadsheetUrl,
                data_sheet_name: localStorage.getItem('last_sheet_name') || null,
                output_sheet_name: 'Forecast_Results',
                forecast_params: forecastParams
            })
        });

        const result = await response.json();

        if (result.success) {
            // Display the script in the modal
            document.getElementById('appsScriptCode').value = result.script;

            // Display instructions
            const instructionsList = document.getElementById('appsScriptInstructions');
            instructionsList.innerHTML = result.instructions.map(instruction =>
                \`<li>\${instruction}</li>\`
            ).join('');

            // Show the modal
            document.getElementById('appsScriptModal').style.display = 'flex';

            showAlert('Google Apps Script generated successfully!', 'success');
        } else {
            showAlert('Error generating script: ' + result.error, 'error');
        }
    } catch (error) {
        showAlert('Error generating script: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Copy script to clipboard
async function copyScriptToClipboard() {
    const scriptCode = document.getElementById('appsScriptCode');

    try {
        await navigator.clipboard.writeText(scriptCode.value);

        // Change button text temporarily
        const copyBtn = document.getElementById('copyScriptBtn');
        const originalText = copyBtn.textContent;
        copyBtn.textContent = 'Copied!';
        copyBtn.style.background = '#4ade80';

        setTimeout(() => {
            copyBtn.textContent = originalText;
            copyBtn.style.background = '';
        }, 2000);

        showAlert('Script copied to clipboard!', 'success');
    } catch (error) {
        // Fallback for older browsers
        scriptCode.select();
        document.execCommand('copy');
        showAlert('Script copied to clipboard!', 'success');
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initEventListeners);
`;
  const appCorrelatedJs = `// Enhancement to app.js for correlated forecasting
// This adds correlation mode support

// Additional global state for correlation
let currentMode = 'correlated';
let correlationMetrics = null;

// Add correlation strength slider management
const correlationStrength = document.getElementById('correlationStrength');
const correlationStrengthValue = document.getElementById('correlationStrengthValue');
const forecastMode = document.getElementById('forecastMode');
const metricSelectGroup = document.getElementById('metricSelectGroup');
const correlationStrengthGroup = document.getElementById('correlationStrengthGroup');

// Handle forecast mode changes
forecastMode.addEventListener('change', (e) => {
    currentMode = e.target.value;

    if (currentMode === 'correlated') {
        // Hide single metric selector, show correlation strength
        metricSelectGroup.style.display = 'none';
        correlationStrengthGroup.style.display = 'block';
    } else {
        // Show single metric selector, hide correlation strength
        metricSelectGroup.style.display = 'block';
        correlationStrengthGroup.style.display = 'none';
    }
});

// Update correlation strength value display
correlationStrength.addEventListener('input', (e) => {
    correlationStrengthValue.textContent = parseFloat(e.target.value).toFixed(2);
});

// Override the generateForecast function to support both modes
const originalGenerateForecast = window.generateForecast;

window.generateForecast = async function() {
    if (currentMode === 'correlated') {
        await generateCorrelatedForecast();
    } else {
        await originalGenerateForecast();
    }
};

// New function for correlated forecasting
async function generateCorrelatedForecast() {
    if (!currentData) {
        showAlert('Please load data first', 'error');
        return;
    }

    showLoading();

    const params = {
        seasonal_weight: parseFloat(sliders.seasonalWeight.value),
        run_rate_weight: parseFloat(sliders.runRateWeight.value),
        smoothing_alpha: parseFloat(sliders.smoothingAlpha.value),
        recent_window_days: parseInt(sliders.recentWindow.value),
        forecast_days: parseInt(document.getElementById('forecastDays').value),
        correlation_strength: parseFloat(correlationStrength.value)
    };

    try {
        // Get correlated forecast
        const forecastResponse = await fetch('/api/forecast-correlated', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params)
        });

        const forecastData = await forecastResponse.json();

        if (forecastData.success) {
            currentForecasts = forecastData.forecasts;
            correlationMetrics = forecastData.correlation_metrics;

            // Get historical data for both metrics
            const [clicksHistResponse, revenueHistResponse] = await Promise.all([
                fetch('/api/historical-data?metric=clicks&days=90'),
                fetch('/api/historical-data?metric=revenue&days=90')
            ]);

            const clicksHistData = await clicksHistResponse.json();
            const revenueHistData = await revenueHistResponse.json();

            if (clicksHistData.success && revenueHistData.success) {
                currentHistorical = {
                    clicks: clicksHistData.historical,
                    revenue: revenueHistData.historical
                };
                displayCorrelatedForecastResults();
                exportBtn.disabled = false;
                showAlert('Correlated forecast generated successfully!', 'success');
                addActivityLogEntry('forecast', 'Correlated forecast generated', {
                    'Mode': 'Correlated',
                    'Metrics': 'Clicks + Revenue',
                    'Forecast Days': params.forecast_days,
                    'Categories': Object.keys(currentForecasts).length
                });
            }
        } else {
            showAlert(forecastData.error, 'error');
        }
    } catch (error) {
        showAlert('Error generating forecast: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Display correlated forecast results
function displayCorrelatedForecastResults() {
    const categories = Object.keys(currentForecasts);
    const correlationMetricsDiv = document.getElementById('correlationMetrics');
    const correlationChartDiv = document.getElementById('correlationChart');

    // Show correlation metrics
    correlationMetricsDiv.style.display = 'block';
    correlationChartDiv.style.display = 'block';

    // Create category tabs
    categoryTabs.innerHTML = '';
    categories.forEach((category, index) => {
        const tab = document.createElement('button');
        tab.className = 'tab' + (index === 0 ? ' active' : '');
        tab.textContent = category;
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            plotCorrelatedCategory(category);
        });
        categoryTabs.appendChild(tab);
    });

    // Plot first category
    if (categories.length > 0) {
        plotCorrelatedCategory(categories[0]);
    }
}

// Plot correlated forecast for a category
function plotCorrelatedCategory(category) {
    activeCategory = category;

    const forecast = currentForecasts[category];
    const clicksHist = currentHistorical.clicks[category];
    const revenueHist = currentHistorical.revenue[category];
    const metrics = correlationMetrics[category];

    // Display correlation metrics
    displayCorrelationMetrics(category, metrics);

    // Main forecast chart - Clicks
    const clicksHistTrace = {
        x: clicksHist.dates,
        y: clicksHist.values,
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Historical Clicks',
        line: { color: '#667eea', width: 2 },
        marker: { size: 4 },
        yaxis: 'y'
    };

    const clicksForecastTrace = {
        x: forecast.dates,
        y: forecast.clicks,
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Forecast Clicks',
        line: { color: '#764ba2', width: 3, dash: 'dash' },
        marker: { size: 6 },
        yaxis: 'y'
    };

    // Revenue on secondary axis
    const revenueHistTrace = {
        x: revenueHist.dates,
        y: revenueHist.values,
        type: 'scatter',
        mode: 'lines',
        name: 'Historical Revenue',
        line: { color: '#28a745', width: 2 },
        yaxis: 'y2'
    };

    const revenueForecastTrace = {
        x: forecast.dates,
        y: forecast.revenue,
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Forecast Revenue',
        line: { color: '#17a2b8', width: 3, dash: 'dash' },
        marker: { size: 6 },
        yaxis: 'y2'
    };

    const mainLayout = {
        title: {
            text: \`\${category} - Correlated Clicks & Revenue Forecast\`,
            font: { size: 18, color: '#f8b133' }
        },
        xaxis: {
            title: 'Date',
            showgrid: true,
            gridcolor: '#2a2a2a',
            color: '#ffffff'
        },
        yaxis: {
            title: 'Clicks',
            showgrid: true,
            gridcolor: '#2a2a2a',
            side: 'left'
        ,
            color: '#ffffff'},
        yaxis2: {
            title: 'Revenue (£)',
            overlaying: 'y',
            side: 'right',
            showgrid: false
        },
        hovermode: 'x unified',
        plot_bgcolor: '#0a0a0a',
        paper_bgcolor: '#0a0a0a',
        font: { color: '#ffffff' },
        margin: { t: 50, r: 80, b: 50, l: 60 },
        legend: { orientation: 'h', y: -0.2 }
    };

    Plotly.newPlot('forecastChart',
        [clicksHistTrace, clicksForecastTrace, revenueHistTrace, revenueForecastTrace],
        mainLayout,
        { responsive: true }
    );

    // RPC (Revenue Per Click) chart
    const rpcTrace = {
        x: forecast.dates,
        y: forecast.rpc,
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Revenue Per Click',
        line: { color: '#ffc107', width: 3 },
        marker: { size: 6 },
        fill: 'tozeroy',
        fillcolor: 'rgba(255, 193, 7, 0.2)'
    };

    const rpcLayout = {
        title: {
            text: 'Revenue Per Click (RPC) Forecast',
            font: { size: 18, color: '#f8b133' }
        },
        xaxis: {
            title: 'Date',
            showgrid: true,
            gridcolor: '#2a2a2a',
            color: '#ffffff'
        },
        yaxis: {
            title: 'Revenue Per Click (£)',
            showgrid: true,
            gridcolor: '#2a2a2a'
        ,
            color: '#ffffff'},
        annotations: [{
            x: forecast.dates[0],
            y: metrics.forecast_rpc_mean,
            xref: 'x',
            yref: 'y',
            text: \`Avg: £\${metrics.forecast_rpc_mean.toFixed(2)}\`,
            showarrow: true,
            arrowhead: 2,
            ax: 40,
            ay: -40
        }],
        hovermode: 'x unified',
        plot_bgcolor: '#0a0a0a',
        paper_bgcolor: '#0a0a0a',
        font: { color: '#ffffff' },
        margin: { t: 50, r: 30, b: 50, l: 60 }
    };

    Plotly.newPlot('componentsChart', [rpcTrace], rpcLayout, { responsive: true });

    // Correlation scatter plot
    const correlationTrace = {
        x: forecast.clicks,
        y: forecast.revenue,
        type: 'scatter',
        mode: 'markers',
        name: 'Forecast Points',
        marker: {
            size: 10,
            color: forecast.dates.map((_, i) => i),
            colorscale: 'Viridis',
            showscale: true,
            colorbar: { title: 'Day' }
        },
        text: forecast.dates,
        hovertemplate: '<b>%{text}</b><br>Clicks: %{x}<br>Revenue: £%{y:.2f}<extra></extra>'
    };

    const correlationLayout = {
        title: {
            text: \`Correlation: \${metrics.forecast_correlation.toFixed(3)} (Historical: \${metrics.historical_correlation.toFixed(3)})\`,
            font: { size: 18, color: '#f8b133' }
        },
        xaxis: {
            title: 'Clicks',
            showgrid: true,
            gridcolor: '#2a2a2a',
            color: '#ffffff'
        },
        yaxis: {
            title: 'Revenue (£)',
            showgrid: true,
            gridcolor: '#2a2a2a'
        ,
            color: '#ffffff'},
        plot_bgcolor: '#0a0a0a',
        paper_bgcolor: '#0a0a0a',
        font: { color: '#ffffff' },
        margin: { t: 50, r: 30, b: 50, l: 60 }
    };

    Plotly.newPlot('correlationChart', [correlationTrace], correlationLayout, { responsive: true });
}

// Display correlation metrics
function displayCorrelationMetrics(category, metrics) {
    const metricsDiv = document.getElementById('correlationMetrics');

    let html = \`<h3>\${category} - Correlation Metrics</h3>\`;
    html += '<div class="metrics-grid">';

    // Historical correlation
    const histCorrClass = metrics.historical_correlation > 0.7 ? 'good' : metrics.historical_correlation > 0.4 ? 'warning' : 'info';
    html += \`
        <div class="metric-box \${histCorrClass}">
            <div class="metric-label">Historical Correlation</div>
            <div class="metric-value">\${metrics.historical_correlation.toFixed(3)}</div>
        </div>
    \`;

    // Forecast correlation
    const forecastCorrClass = metrics.forecast_correlation > 0.7 ? 'good' : metrics.forecast_correlation > 0.4 ? 'warning' : 'info';
    html += \`
        <div class="metric-box \${forecastCorrClass}">
            <div class="metric-label">Forecast Correlation</div>
            <div class="metric-value">\${metrics.forecast_correlation.toFixed(3)}</div>
        </div>
    \`;

    // Average RPC
    html += \`
        <div class="metric-box info">
            <div class="metric-label">Avg Revenue Per Click</div>
            <div class="metric-value">£\${metrics.forecast_rpc_mean.toFixed(2)}</div>
        </div>
    \`;

    // RPC Coefficient of Variation
    const rpcCvClass = metrics.rpc_coefficient_of_variation < 0.2 ? 'good' : metrics.rpc_coefficient_of_variation < 0.4 ? 'warning' : 'info';
    html += \`
        <div class="metric-box \${rpcCvClass}">
            <div class="metric-label">RPC Stability (CV)</div>
            <div class="metric-value">\${metrics.rpc_coefficient_of_variation.toFixed(3)}</div>
        </div>
    \`;

    html += '</div>';

    metricsDiv.innerHTML = html;
}

// Initialize correlation mode on page load
document.addEventListener('DOMContentLoaded', () => {
    // Set initial state
    metricSelectGroup.style.display = 'none';
    correlationStrengthGroup.style.display = 'block';
});
`;
  const appVolatilityJs = `// Volatility forecasting support

// Additional global state
let volatilityMetrics = null;

// Get volatility elements
const volatilityFactor = document.getElementById('volatilityFactor');
const volatilityFactorValue = document.getElementById('volatilityFactorValue');
const volatilityFactorGroup = document.getElementById('volatilityFactorGroup');

// Update volatility factor value display
volatilityFactor.addEventListener('input', (e) => {
    volatilityFactorValue.textContent = parseFloat(e.target.value).toFixed(2);
});

// Update forecast mode handler to include volatility
const originalForecastModeHandler = forecastMode.onchange;
forecastMode.addEventListener('change', (e) => {
    currentMode = e.target.value;

    if (currentMode === 'volatility') {
        // Show all correlation controls plus volatility
        metricSelectGroup.style.display = 'none';
        correlationStrengthGroup.style.display = 'block';
        volatilityFactorGroup.style.display = 'block';
    } else if (currentMode === 'correlated') {
        // Show correlation controls, hide volatility
        metricSelectGroup.style.display = 'none';
        correlationStrengthGroup.style.display = 'block';
        volatilityFactorGroup.style.display = 'none';
    } else {
        // Single metric mode
        metricSelectGroup.style.display = 'block';
        correlationStrengthGroup.style.display = 'none';
        volatilityFactorGroup.style.display = 'none';
    }
});

// Override generateForecast to support volatility mode
const baseGenerateForecast = window.generateForecast;

window.generateForecast = async function() {
    if (currentMode === 'volatility') {
        await generateVolatilityForecast();
    } else if (currentMode === 'correlated') {
        await generateCorrelatedForecast();
    } else {
        await baseGenerateForecast();
    }
};

// New function for volatility forecasting
async function generateVolatilityForecast() {
    if (!currentData) {
        showAlert('Please load data first', 'error');
        return;
    }

    showLoading();

    const params = {
        seasonal_weight: parseFloat(sliders.seasonalWeight.value),
        run_rate_weight: parseFloat(sliders.runRateWeight.value),
        smoothing_alpha: parseFloat(sliders.smoothingAlpha.value),
        recent_window_days: parseInt(sliders.recentWindow.value),
        forecast_days: parseInt(document.getElementById('forecastDays').value),
        correlation_strength: parseFloat(correlationStrength.value),
        volatility_factor: parseFloat(volatilityFactor.value)
    };

    try{
        // Get volatility forecast
        const forecastResponse = await fetch('/api/forecast-with-volatility', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params)
        });

        const forecastData = await forecastResponse.json();

        if (forecastData.success) {
            currentForecasts = forecastData.forecasts;
            correlationMetrics = forecastData.correlation_metrics;
            volatilityMetrics = forecastData.volatility_metrics;

            // Get historical data for both metrics
            const [clicksHistResponse, revenueHistResponse] = await Promise.all([
                fetch('/api/historical-data?metric=clicks&days=90'),
                fetch('/api/historical-data?metric=revenue&days=90')
            ]);

            const clicksHistData = await clicksHistResponse.json();
            const revenueHistData = await revenueHistResponse.json();

            if (clicksHistData.success && revenueHistData.success) {
                currentHistorical = {
                    clicks: clicksHistData.historical,
                    revenue: revenueHistData.historical
                };
                displayVolatilityForecastResults();
                exportBtn.disabled = false;
                showAlert('Forecast with volatility generated successfully!', 'success');
                addActivityLogEntry('forecast', 'Volatility forecast generated', {
                    'Mode': 'Correlated + Volatility',
                    'Metrics': 'Clicks + Revenue',
                    'Forecast Days': params.forecast_days,
                    'Categories': Object.keys(currentForecasts).length,
                    'Volatility Factor': params.volatility_factor.toFixed(2)
                });
            }
        } else {
            showAlert(forecastData.error, 'error');
        }
    } catch (error) {
        showAlert('Error generating forecast: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Display volatility forecast results
function displayVolatilityForecastResults() {
    const categories = Object.keys(currentForecasts);
    const correlationMetricsDiv = document.getElementById('correlationMetrics');
    const correlationChartDiv = document.getElementById('correlationChart');

    // Show correlation metrics
    correlationMetricsDiv.style.display = 'block';
    correlationChartDiv.style.display = 'block';

    // Create category tabs
    categoryTabs.innerHTML = '';
    categories.forEach((category, index) => {
        const tab = document.createElement('button');
        tab.className = 'tab' + (index === 0 ? ' active' : '');
        tab.textContent = category;
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            plotVolatilityCategory(category);
        });
        categoryTabs.appendChild(tab);
    });

    // Plot first category
    if (categories.length > 0) {
        plotVolatilityCategory(categories[0]);
    }
}

// Plot volatility forecast for a category
function plotVolatilityCategory(category) {
    activeCategory = category;

    const forecast = currentForecasts[category];
    const clicksHist = currentHistorical.clicks[category];
    const revenueHist = currentHistorical.revenue[category];
    const corrMetrics = correlationMetrics[category];
    const volMetrics = volatilityMetrics[category];

    // Display metrics with volatility info
    displayVolatilityMetrics(category, corrMetrics, volMetrics);

    // Main forecast chart - Clicks with volatility
    const clicksHistTrace = {
        x: clicksHist.dates,
        y: clicksHist.values,
        type: 'scatter',
        mode: 'lines',
        name: 'Historical Clicks',
        line: { color: '#667eea', width: 2 },
        yaxis: 'y'
    };

    // Confidence band for clicks
    const clicksUpperTrace = {
        x: forecast.dates,
        y: forecast.clicks_upper,
        type: 'scatter',
        mode: 'lines',
        name: 'Upper Bound',
        line: { width: 0 },
        showlegend: false,
        yaxis: 'y'
    };

    const clicksLowerTrace = {
        x: forecast.dates,
        y: forecast.clicks_lower,
        type: 'scatter',
        mode: 'lines',
        name: 'Clicks Range',
        line: { width: 0 },
        fill: 'tonexty',
        fillcolor: 'rgba(102, 126, 234, 0.2)',
        yaxis: 'y'
    };

    const clicksSmoothTrace = {
        x: forecast.dates,
        y: forecast.clicks_smooth,
        type: 'scatter',
        mode: 'lines',
        name: 'Smooth Trend (Clicks)',
        line: { color: '#764ba2', width: 2, dash: 'dash' },
        yaxis: 'y'
    };

    const clicksForecastTrace = {
        x: forecast.dates,
        y: forecast.clicks,
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Forecast Clicks (with volatility)',
        line: { color: '#764ba2', width: 3 },
        marker: { size: 6 },
        yaxis: 'y'
    };

    // Revenue with volatility on secondary axis
    const revenueHistTrace = {
        x: revenueHist.dates,
        y: revenueHist.values,
        type: 'scatter',
        mode: 'lines',
        name: 'Historical Revenue',
        line: { color: '#28a745', width: 2 },
        yaxis: 'y2'
    };

    const revenueSmoothTrace = {
        x: forecast.dates,
        y: forecast.revenue_smooth,
        type: 'scatter',
        mode: 'lines',
        name: 'Smooth Trend (Revenue)',
        line: { color: '#17a2b8', width: 2, dash: 'dash' },
        yaxis: 'y2'
    };

    const revenueForecastTrace = {
        x: forecast.dates,
        y: forecast.revenue,
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Forecast Revenue (with volatility)',
        line: { color: '#17a2b8', width: 3 },
        marker: { size: 6 },
        yaxis: 'y2'
    };

    const mainLayout = {
        title: {
            text: \`\${category} - Forecast with Volatility (\${(volMetrics.volatility_preserved_pct).toFixed(0)}% of historical)\`,
            font: { size: 18, color: '#f8b133' }
        },
        xaxis: {
            title: 'Date',
            showgrid: true,
            gridcolor: '#2a2a2a',
            color: '#ffffff'
        },
        yaxis: {
            title: 'Clicks',
            showgrid: true,
            gridcolor: '#2a2a2a',
            side: 'left'
        ,
            color: '#ffffff'},
        yaxis2: {
            title: 'Revenue (£)',
            overlaying: 'y',
            side: 'right',
            showgrid: false
        },
        hovermode: 'x unified',
        plot_bgcolor: '#0a0a0a',
        paper_bgcolor: '#0a0a0a',
        font: { color: '#ffffff' },
        margin: { t: 50, r: 80, b: 50, l: 60 },
        legend: { orientation: 'h', y: -0.3 }
    };

    Plotly.newPlot('forecastChart',
        [clicksHistTrace, clicksLowerTrace, clicksUpperTrace, clicksSmoothTrace,
         clicksForecastTrace, revenueHistTrace, revenueSmoothTrace, revenueForecastTrace],
        mainLayout,
        { responsive: true }
    );

    // RPC chart
    const rpcTrace = {
        x: forecast.dates,
        y: forecast.rpc,
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Revenue Per Click',
        line: { color: '#ffc107', width: 3 },
        marker: { size: 6 },
        fill: 'tozeroy',
        fillcolor: 'rgba(255, 193, 7, 0.2)'
    };

    const rpcLayout = {
        title: {
            text: 'Revenue Per Click (RPC) Forecast',
            font: { size: 18, color: '#f8b133' }
        },
        xaxis: {
            title: 'Date',
            showgrid: true,
            gridcolor: '#2a2a2a',
            color: '#ffffff'
        },
        yaxis: {
            title: 'Revenue Per Click (£)',
            showgrid: true,
            gridcolor: '#2a2a2a'
        ,
            color: '#ffffff'},
        hovermode: 'x unified',
        plot_bgcolor: '#0a0a0a',
        paper_bgcolor: '#0a0a0a',
        font: { color: '#ffffff' },
        margin: { t: 50, r: 30, b: 50, l: 60 }
    };

    Plotly.newPlot('componentsChart', [rpcTrace], rpcLayout, { responsive: true });

    // Volatility comparison chart
    const smoothClicksTrace = {
        x: forecast.dates,
        y: forecast.clicks_smooth,
        type: 'scatter',
        mode: 'lines',
        name: 'Smooth Forecast',
        line: { color: '#999', width: 2, dash: 'dot' }
    };

    const volatileClicksTrace = {
        x: forecast.dates,
        y: forecast.clicks,
        type: 'scatter',
        mode: 'lines+markers',
        name: 'With Volatility',
        line: { color: '#667eea', width: 3 },
        marker: { size: 6 }
    };

    const volatilityLayout = {
        title: {
            text: \`Volatility Impact - Clicks (Std: \${volMetrics.clicks_volatility_std.toFixed(2)})\`,
            font: { size: 18, color: '#f8b133' }
        },
        xaxis: {
            title: 'Date',
            showgrid: true,
            gridcolor: '#2a2a2a',
            color: '#ffffff'
        },
        yaxis: {
            title: 'Clicks',
            showgrid: true,
            gridcolor: '#2a2a2a'
        ,
            color: '#ffffff'},
        hovermode: 'x unified',
        plot_bgcolor: '#0a0a0a',
        paper_bgcolor: '#0a0a0a',
        font: { color: '#ffffff' },
        margin: { t: 50, r: 30, b: 50, l: 60 }
    };

    Plotly.newPlot('correlationChart', [smoothClicksTrace, volatileClicksTrace],
                   volatilityLayout, { responsive: true });
}

// Display volatility metrics
function displayVolatilityMetrics(category, corrMetrics, volMetrics) {
    const metricsDiv = document.getElementById('correlationMetrics');

    let html = \`<h3>\${category} - Forecast Metrics</h3>\`;
    html += '<div class="metrics-grid">';

    // Historical correlation
    const histCorrClass = corrMetrics.historical_correlation > 0.7 ? 'good' : 'info';
    html += \`
        <div class="metric-box \${histCorrClass}">
            <div class="metric-label">Historical Correlation</div>
            <div class="metric-value">\${corrMetrics.historical_correlation.toFixed(3)}</div>
        </div>
    \`;

    // Average RPC
    html += \`
        <div class="metric-box info">
            <div class="metric-label">Avg Revenue Per Click</div>
            <div class="metric-value">£\${corrMetrics.forecast_rpc_mean.toFixed(2)}</div>
        </div>
    \`;

    // Volatility preserved
    const volPreservedClass = volMetrics.volatility_preserved_pct > 50 ? 'good' : 'warning';
    html += \`
        <div class="metric-box \${volPreservedClass}">
            <div class="metric-label">Volatility Preserved</div>
            <div class="metric-value">\${volMetrics.volatility_preserved_pct.toFixed(0)}%</div>
        </div>
    \`;

    // Clicks volatility std
    html += \`
        <div class="metric-box info">
            <div class="metric-label">Clicks Daily Variance</div>
            <div class="metric-value">±\${volMetrics.clicks_volatility_std.toFixed(0)}</div>
        </div>
    \`;

    // Revenue volatility std
    html += \`
        <div class="metric-box info">
            <div class="metric-label">Revenue Daily Variance</div>
            <div class="metric-value">±£\${volMetrics.revenue_volatility_std.toFixed(0)}</div>
        </div>
    \`;

    // Historical spike threshold
    html += \`
        <div class="metric-box warning">
            <div class="metric-label">Expected Spike Size</div>
            <div class="metric-value">±\${volMetrics.clicks_spike_threshold.toFixed(0)}</div>
        </div>
    \`;

    html += '</div>';

    metricsDiv.innerHTML = html;
}

// Initialize volatility mode on page load
document.addEventListener('DOMContentLoaded', () => {
    // Set initial state to volatility mode
    currentMode = 'volatility';
    metricSelectGroup.style.display = 'none';
    correlationStrengthGroup.style.display = 'block';
    volatilityFactorGroup.style.display = 'block';
});
`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nostradamus - Retail Forecasting Dashboard</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>${cssContent}</style>
    <script src="https://cdn.plot.ly/plotly-2.27.0.min.js"></script>
</head>
<body>
    <div class="container">
        <header>
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 20px;">
                    <svg viewBox=\"0 0 180 60\" xmlns=\"http://www.w3.org/2000/svg\" preserveAspectRatio=\"xMidYMid meet\">
  <!-- Crystal ball circle -->
  <circle cx=\"30\" cy=\"30\" r=\"20\" fill=\"none\" stroke=\"#f8b133\" stroke-width=\"2.5\"/>
  <circle cx=\"30\" cy=\"30\" r=\"15\" fill=\"none\" stroke=\"#f8b133\" stroke-width=\"1.5\" opacity=\"0.5\"/>

  <!-- Stars inside crystal ball -->
  <path d=\"M 30 22 L 31 25 L 34 25 L 32 27 L 33 30 L 30 28 L 27 30 L 28 27 L 26 25 L 29 25 Z\" fill=\"#f8b133\" opacity=\"0.8\"/>
  <circle cx=\"25\" cy=\"28\" r=\"1\" fill=\"#f8b133\" opacity=\"0.6\"/>
  <circle cx=\"35\" cy=\"32\" r=\"0.8\" fill=\"#f8b133\" opacity=\"0.6\"/>

  <!-- Text -->
  <text x=\"60\" y=\"38\" font-family=\"Arial, sans-serif\" font-size=\"28\" font-weight=\"bold\" fill=\"#f8b133\">NOSTRADAMUS</text>
</svg>


                    <!-- Project Selector -->
                    <div style="display: flex; align-items: center; gap: 10px; padding: 8px 16px; background: #1a1a1a; border: 1px solid #333; border-radius: 8px;">
                        <span style="color: #aaa; font-size: 0.85em;">Project:</span>
                        <select id="projectSelector" style="background: transparent; color: #f8b133; border: none; font-size: 0.95em; font-weight: 500; cursor: pointer; outline: none;">
                            <option value="">Loading projects...</option>
                        </select>
                        <button id="manageProjectsBtn" class="btn btn-secondary" style="padding: 4px 12px; font-size: 0.85em; margin-left: 10px;">
                            Manage
                        </button>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 20px;">
                    
                    <div style="color: #aaaaaa; font-size: 0.9em; text-align: right;">
                        <div>${userName}</div>
                        <div style="font-size: 0.85em; opacity: 0.8;">${userEmail}</div>
                    </div>
                    
                    <img src="${userPicture}" alt="${userName}" style="width: 40px; height: 40px; border-radius: 50%; border: 2px solid #f8b133;">
                    
                    <a href="/auth/logout" class="btn btn-secondary" style="text-decoration: none; white-space: nowrap; font-size: 0.9em; padding: 8px 16px;">
                        Logout
                    </a>
                    
                    <a href="/admin" class="btn btn-secondary" style="text-decoration: none; white-space: nowrap;">
                        Configuration
                    </a>
                </div>
            </div>
        </header>

        <!-- Data Source Summary -->
        <section class="card" id="dataSourceSummary" style="display: none;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h3 style="color: #f8b133; margin: 0 0 10px 0;">Current Data Source</h3>
                    <div id="dataSourceInfo" style="color: #aaaaaa;"></div>
                </div>
                <button id="changeDataSourceBtn" class="btn btn-secondary">Change Data Source</button>
            </div>
            <div id="dataSummary" class="data-summary" style="display: block; margin-top: 20px;"></div>
        </section>

        <!-- Hidden file input for CSV upload -->
        <input type="file" id="fileInput" accept=".csv" style="display: none;">

        <!-- Project Management Modal -->
        <div id="projectManagementModal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 10001; justify-content: center; align-items: center;">
            <div style="background: #1a1a1a; border-radius: 12px; padding: 40px; max-width: 700px; width: 90%; border: 1px solid #2a2a2a; max-height: 80vh; overflow-y: auto;">
                <h2 style="color: #f8b133; margin-top: 0;">Manage Projects</h2>

                <!-- Create New Project -->
                <div style="margin-bottom: 30px; padding: 20px; background: #0a0a0a; border-radius: 8px; border: 1px solid #333;">
                    <h3 style="color: #fff; margin-top: 0; font-size: 1.1em;">Create New Project</h3>
                    <form id="createProjectForm">
                        <div class="form-group">
                            <label for="newProjectName">Project Name *</label>
                            <input type="text" id="newProjectName" class="input" placeholder="E.g., E-commerce Main Site" required>
                        </div>
                        <div class="form-group">
                            <label for="newProjectDescription">Description (optional)</label>
                            <textarea id="newProjectDescription" class="input" rows="2" placeholder="Brief description of this project"></textarea>
                        </div>
                        <button type="submit" class="btn btn-primary" style="width: 100%;">Create Project</button>
                    </form>
                </div>

                <!-- Existing Projects List -->
                <div>
                    <h3 style="color: #fff; margin-bottom: 15px; font-size: 1.1em;">Your Projects</h3>
                    <div id="projectsList" style="display: flex; flex-direction: column; gap: 10px;">
                        <!-- Projects will be loaded here -->
                    </div>
                </div>

                <button id="closeProjectsModalBtn" class="btn btn-secondary" style="margin-top: 30px; width: 100%;">Close</button>
            </div>
        </div>

        <!-- Data Source Setup Modal -->
        <div id="dataSourceModal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 10000; justify-content: center; align-items: center;">
            <div style="background: #1a1a1a; border-radius: 12px; padding: 40px; max-width: 800px; width: 90%; border: 1px solid #2a2a2a;">
                <h2 style="color: #f8b133; margin-top: 0;">Setup Data Source</h2>
                <p style="color: #aaaaaa; margin-bottom: 30px;">
                    Choose how you want to load your forecast data. You can change this anytime from Configuration.
                </p>

                <!-- Configured Source Button (shown when config exists) -->
                <div id="configuredSourceSection" style="display: none; margin-bottom: 30px;">
                    <button id="loadConfiguredSourceBtn" class="btn btn-primary" style="width: 100%; height: 80px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px;">
                        <span style="font-size: 2em;">⚙️</span>
                        <span id="configuredSourceLabel">Load Configured Source</span>
                    </button>
                    <p style="color: #aaaaaa; font-size: 0.85em; margin-top: 10px; text-align: center;">
                        Use your saved data source configuration from the Configuration page
                    </p>
                </div>

                <p style="color: #666; text-align: center; margin-bottom: 15px; font-size: 0.9em;" id="otherSourcesLabel">Or choose another source:</p>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 20px;">
                    <button id="loadSampleBtn" class="btn btn-primary" style="height: 80px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px;">
                        <span style="font-size: 2em;">📊</span>
                        <span>Sample Data</span>
                    </button>
                    <button id="loadCSVBtn" class="btn btn-secondary" style="height: 80px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px;">
                        <span style="font-size: 2em;">📄</span>
                        <span>Upload CSV</span>
                    </button>
                    <button id="loadGoogleSheetsBtn" class="btn btn-secondary" style="height: 80px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px;">
                        <span style="font-size: 2em;">📗</span>
                        <span>Google Sheets</span>
                    </button>
                    <button id="loadBigQueryBtn" class="btn btn-secondary" style="height: 80px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px;">
                        <span style="font-size: 2em;">🔍</span>
                        <span>BigQuery</span>
                    </button>
                </div>

                <button id="closeDataSourceModalBtn" class="btn btn-secondary" style="margin-top: 30px; width: 100%;">Cancel</button>
            </div>
        </div>

            <!-- Google Sheets Modal -->
            <div id="googleSheetsModal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 9999; justify-content: center; align-items: center;">
                <div style="background: #1a1a1a; border-radius: 12px; padding: 40px; max-width: 600px; width: 90%; border: 1px solid #2a2a2a;">
                    <h2 style="color: #f8b133; margin-top: 0;">Load from Google Sheets</h2>

                    <p style="color: #aaaaaa; margin-bottom: 25px;">
                        Load data directly from your Google Sheets. We'll use your Google account (already logged in) to access your sheets.
                    </p>

                    <div class="control-group" style="margin-bottom: 20px;">
                        <label for="sheetsUrl">Spreadsheet URL:</label>
                        <input type="text" id="sheetsUrl" class="input" placeholder="https://docs.google.com/spreadsheets/d/...">
                        <p class="help-text">Paste the full URL of your Google Sheet (must be accessible with your Google account)</p>
                    </div>

                    <div class="control-group" style="margin-bottom: 30px;">
                        <label for="sheetsName">Sheet Name (optional):</label>
                        <input type="text" id="sheetsName" class="input" placeholder="Sheet1">
                        <p class="help-text">Leave blank to use the first sheet</p>
                    </div>

                    <div class="button-group">
                        <button id="loadSheetsDataBtn" class="btn btn-primary">Load Data</button>
                        <button id="closeSheetsModalBtn" class="btn btn-secondary">Cancel</button>
                    </div>
                </div>
            </div>

            <!-- BigQuery Modal -->
            <div id="bigQueryModal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 9999; justify-content: center; align-items: center;">
                <div style="background: #1a1a1a; border-radius: 12px; padding: 40px; max-width: 700px; width: 90%; border: 1px solid #2a2a2a;">
                    <h2 style="color: #f8b133; margin-top: 0;">Load from BigQuery</h2>

                    <p style="color: #aaaaaa; margin-bottom: 25px;">
                        Load data from Google BigQuery using SQL or table reference. We'll use your Google account for authentication.
                    </p>

                    <div class="control-group" style="margin-bottom: 20px;">
                        <label for="bqLoadMethod">Load Method:</label>
                        <select id="bqLoadMethod" class="input">
                            <option value="query">SQL Query</option>
                            <option value="table">Table Reference</option>
                        </select>
                    </div>

                    <div id="bqQuerySection" style="margin-bottom: 20px;">
                        <div class="control-group">
                            <label for="bqQuery">SQL Query:</label>
                            <textarea id="bqQuery" class="input" rows="6" placeholder="SELECT date, category, clicks, revenue FROM \`project.dataset.table\`" style="font-family: 'Courier New', monospace; resize: vertical;"></textarea>
                            <p class="help-text">Must return columns: date, category, clicks, revenue</p>
                        </div>
                    </div>

                    <div id="bqTableSection" style="display: none; margin-bottom: 20px;">
                        <div class="control-group" style="margin-bottom: 15px;">
                            <label for="bqProjectId">Project ID:</label>
                            <input type="text" id="bqProjectId" class="input" placeholder="my-project-id">
                        </div>
                        <div class="control-group" style="margin-bottom: 15px;">
                            <label for="bqDatasetId">Dataset ID:</label>
                            <input type="text" id="bqDatasetId" class="input" placeholder="my_dataset">
                        </div>
                        <div class="control-group">
                            <label for="bqTableId">Table ID:</label>
                            <input type="text" id="bqTableId" class="input" placeholder="my_table">
                        </div>
                    </div>

                    <div class="button-group">
                        <button id="loadBigQueryDataBtn" class="btn btn-primary">Load Data</button>
                        <button id="closeBigQueryModalBtn" class="btn btn-secondary">Cancel</button>
                    </div>
                </div>
            </div>
        </section>

        <!-- Model Calibration Section -->
        <section class="card" id="calibrationSection" style="display: none;">
            <h2>Auto-Calibrate Parameters</h2>
            <p style="color: #aaaaaa; margin-bottom: 20px;">
                Automatically find the best parameters by testing on historical data. This will update your sliders with optimized values.
            </p>

            <div class="controls-grid" style="grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));">
                <div class="control-group">
                    <label for="calibrationCategory">Category to Test:</label>
                    <select id="calibrationCategory" class="input">
                        <!-- Populated dynamically -->
                    </select>
                </div>

                <div class="control-group" id="calibrationMetricGroup">
                    <label for="calibrationMetric">Metric (Single mode only):</label>
                    <select id="calibrationMetric" class="input">
                        <option value="clicks">Clicks</option>
                        <option value="revenue">Revenue</option>
                    </select>
                </div>

                <div class="control-group">
                    <label for="calibrationWeeks">Test Weeks:</label>
                    <input type="number" id="calibrationWeeks" class="input" value="4" min="2" max="12">
                    <p class="help-text">Backtest on this many recent weeks</p>
                </div>
            </div>

            <div class="button-group" style="margin-top: 20px;">
                <button id="autoCalibrationBtn" class="btn btn-primary btn-large">Run Auto-Calibration</button>
            </div>

            <div id="calibrationResults" style="margin-top: 30px; display: none;">
                <h3 style="color: #f8b133;">Calibration Results</h3>
                <div id="calibrationMetrics" class="correlation-metrics" style="margin-top: 15px;"></div>
            </div>
        </section>

        <!-- Model Configuration Section -->
        <section class="card">
            <h2>Model Configuration</h2>
            <div class="controls-grid">
                <div class="control-group">
                    <label for="forecastMode">Forecast Mode:</label>
                    <select id="forecastMode" class="input">
                        <option value="volatility">Correlated + Volatility (Realistic)</option>
                        <option value="correlated">Correlated (Smooth)</option>
                        <option value="single">Single Metric</option>
                    </select>
                    <p class="help-text">Volatility mode captures daily highs/lows</p>
                </div>

                <div class="control-group" id="metricSelectGroup">
                    <label for="metricSelect">Metric to Forecast:</label>
                    <select id="metricSelect" class="input">
                        <option value="clicks">Organic Search Clicks</option>
                        <option value="revenue">Organic Search Revenue (£)</option>
                    </select>
                </div>

                <div class="control-group">
                    <label for="forecastDays">Forecast Period (days):</label>
                    <input type="number" id="forecastDays" class="input" value="14" min="7" max="30">
                </div>

                <div class="control-group">
                    <label for="seasonalWeight">Seasonal Weight: <span id="seasonalWeightValue">0.50</span></label>
                    <input type="range" id="seasonalWeight" class="slider" min="0" max="1" step="0.05" value="0.5">
                    <p class="help-text">Higher values emphasize seasonal patterns</p>
                </div>

                <div class="control-group">
                    <label for="runRateWeight">Run Rate Weight: <span id="runRateWeightValue">0.50</span></label>
                    <input type="range" id="runRateWeight" class="slider" min="0" max="1" step="0.05" value="0.5">
                    <p class="help-text">Higher values emphasize recent performance</p>
                </div>

                <div class="control-group">
                    <label for="smoothingAlpha">Smoothing Factor: <span id="smoothingAlphaValue">0.30</span></label>
                    <input type="range" id="smoothingAlpha" class="slider" min="0.1" max="0.9" step="0.05" value="0.3">
                    <p class="help-text">Higher values respond faster to changes</p>
                </div>

                <div class="control-group">
                    <label for="recentWindow">Recent Window (days): <span id="recentWindowValue">28</span></label>
                    <input type="range" id="recentWindow" class="slider" min="7" max="90" step="7" value="28">
                    <p class="help-text">Number of recent days for run rate calculation</p>
                </div>

                <div class="control-group" id="correlationStrengthGroup">
                    <label for="correlationStrength">Correlation Strength: <span id="correlationStrengthValue">0.85</span></label>
                    <input type="range" id="correlationStrength" class="slider" min="0.5" max="1.0" step="0.05" value="0.85">
                    <p class="help-text">How strongly clicks and revenue forecasts correlate</p>
                </div>

                <div class="control-group" id="volatilityFactorGroup">
                    <label for="volatilityFactor">Volatility Factor: <span id="volatilityFactorValue">0.70</span></label>
                    <input type="range" id="volatilityFactor" class="slider" min="0" max="1.0" step="0.1" value="0.7">
                    <p class="help-text">Amount of daily variation: 0=smooth, 1=full spikes</p>
                </div>
            </div>

            <div class="button-group">
                <button id="generateForecastBtn" class="btn btn-primary btn-large" disabled>Generate Forecast</button>
                <button id="exportBtn" class="btn btn-secondary" disabled>Export Results</button>
                <button id="pushToSourceBtn" class="btn btn-secondary" disabled>Push to Data Source</button>
                <button id="calibrateModelBtn" class="btn btn-secondary" disabled>Calibrate Model</button>
                <button id="scheduleForecastBtn" class="btn btn-secondary" disabled>Schedule Forecast</button>
            </div>
        </section>

        <!-- Forecast Scheduling Section -->
        <section class="card" id="schedulingSection" style="display: none;">
            <h2>Scheduled Forecasts</h2>
            <p style="color: #aaaaaa; margin-bottom: 20px;">
                Configure automated forecast runs using Google Apps Script (recommended) or external cron services.
            </p>

            <div style="background: #0a0a0a; border: 1px solid #2a2a2a; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h3 style="color: #f8b133; margin-top: 0;">Google Apps Script Scheduler (Recommended)</h3>
                <p style="color: #aaaaaa; margin-bottom: 15px;">
                    Generate a configured Google Apps Script that runs directly from your Google Sheet. 100% free, no external services needed, persistent configuration.
                </p>
                <button id="generateAppsScriptBtn" class="btn btn-primary">Generate Google Apps Script</button>
            </div>

            <div style="background: #0a0a0a; border: 1px solid #2a2a2a; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h3 style="color: #f8b133; margin-top: 0;">External Cron Services (Alternative)</h3>
                <p style="color: #aaaaaa; margin-bottom: 15px;">
                    Save your current data source, forecast parameters, and output settings to enable automated scheduled forecasts via external cron services.
                </p>
                <button id="saveSchedulerConfigBtn" class="btn btn-secondary" style="margin-bottom: 20px;">Save Configuration for External Cron</button>

                <h3 style="color: #f8b133; margin-top: 30px;">API Endpoint for Automation</h3>
                <p style="color: #aaaaaa; margin-bottom: 10px;">Use this endpoint to trigger forecasts from external services:</p>
                <div style="background: #000; border: 1px solid #3a3a3a; padding: 12px; border-radius: 6px; font-family: 'Courier New', monospace; color: #4ade80; overflow-x: auto;">
                    POST https://nostradamus-o84f.onrender.com/api/scheduled-run
                </div>
                <p style="color: #aaaaaa; margin-top: 10px; font-size: 0.9em;">
                    Optional: Include your API key in the Authorization header: <code style="background: #2a2a2a; padding: 2px 6px; border-radius: 3px;">Authorization: Bearer YOUR_API_KEY</code>
                </p>
                <p style="color: #aaaaaa; font-size: 0.9em;">
                    <strong>Note:</strong> Set SCHEDULER_API_KEY environment variable in Render to enable API key protection.
                </p>
            </div>

            <div id="scheduledForecastsList" style="display: flex; flex-direction: column; gap: 15px;">
                <!-- Scheduled forecasts will be listed here -->
            </div>

            <div style="margin-top: 20px;">
                <button id="addScheduledForecastBtn" class="btn btn-primary">Add Scheduled Forecast</button>
            </div>
        </section>

        <!-- Add Scheduled Forecast Modal -->
        <div id="scheduledForecastModal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 9999; justify-content: center; align-items: center;">
            <div style="background: #1a1a1a; border-radius: 12px; padding: 40px; max-width: 600px; width: 90%; border: 1px solid #2a2a2a;">
                <h2 style="color: #f8b133; margin-top: 0;">Schedule New Forecast</h2>

                <div class="control-group" style="margin-bottom: 20px;">
                    <label for="scheduleName">Forecast Name:</label>
                    <input type="text" id="scheduleName" class="input" placeholder="Daily Revenue Forecast">
                </div>

                <div class="control-group" style="margin-bottom: 20px;">
                    <label for="scheduleFrequency">Frequency:</label>
                    <select id="scheduleFrequency" class="input">
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="custom">Custom Cron</option>
                    </select>
                </div>

                <div class="control-group" style="margin-bottom: 20px;">
                    <label for="scheduleCron">Cron Expression:</label>
                    <input type="text" id="scheduleCron" class="input" placeholder="0 9 * * *" value="0 9 * * *">
                    <p class="help-text">Example: 0 9 * * * = Every day at 9:00 AM UTC</p>
                </div>

                <div class="control-group" style="margin-bottom: 30px;">
                    <label>
                        <input type="checkbox" id="scheduleEnabled" checked>
                        Enabled
                    </label>
                </div>

                <div class="button-group">
                    <button id="saveScheduledForecastBtn" class="btn btn-primary">Save Schedule</button>
                    <button id="closeScheduledForecastModalBtn" class="btn btn-secondary">Cancel</button>
                </div>
            </div>
        </div>

        <!-- Google Apps Script Modal -->
        <div id="appsScriptModal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 9999; overflow-y: auto; padding: 20px;">
            <div style="display: flex; justify-content: center; align-items: center; min-height: 100%;">
                <div style="background: #1a1a1a; border-radius: 12px; padding: 40px; max-width: 900px; width: 100%; border: 1px solid #2a2a2a;">
                    <h2 style="color: #f8b133; margin-top: 0;">Your Google Apps Script</h2>

                    <p style="color: #aaaaaa; margin-bottom: 20px;">
                        This script is pre-configured with your current forecast settings. Copy it to your Google Sheet to enable automated forecasting.
                    </p>

                    <div style="background: #0a0a0a; border: 1px solid #2a2a2a; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                        <h3 style="color: #f8b133; margin-top: 0; font-size: 1em;">Setup Instructions</h3>
                        <ol id="appsScriptInstructions" style="color: #aaaaaa; line-height: 1.8; padding-left: 20px; margin: 0;">
                            <!-- Instructions will be inserted here -->
                        </ol>
                    </div>

                    <div class="control-group" style="margin-bottom: 20px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <label style="margin: 0; font-weight: 600;">Google Apps Script Code:</label>
                            <button id="copyScriptBtn" class="btn btn-secondary" style="font-size: 0.85em; padding: 6px 12px;">
                                Copy to Clipboard
                            </button>
                        </div>
                        <textarea id="appsScriptCode" readonly style="width: 100%; height: 400px; font-family: 'Courier New', monospace; font-size: 0.85em; background: #000; color: #4ade80; border: 1px solid #3a3a3a; padding: 15px; border-radius: 6px; resize: vertical; overflow-y: auto;"></textarea>
                    </div>

                    <div class="button-group">
                        <button id="closeAppsScriptModalBtn" class="btn btn-primary">Done</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Visualization Section -->
        <section class="card">
            <h2>Forecast Results</h2>
            <div id="correlationMetrics" class="correlation-metrics" style="display: none;"></div>
            <div id="categoryTabs" class="tabs"></div>
            <div id="forecastChart" class="chart-container"></div>
            <div id="componentsChart" class="chart-container"></div>
            <div id="correlationChart" class="chart-container" style="display: none;"></div>
        </section>

        <!-- Activity Log Section -->
        <section class="card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="margin: 0;">Activity Log</h2>
                <button id="clearLogBtn" class="btn btn-secondary" style="font-size: 0.85em; padding: 6px 12px;">Clear Log</button>
            </div>
            <div id="activityLog" style="max-height: 400px; overflow-y: auto;">
                <div id="activityLogList" style="display: flex; flex-direction: column; gap: 10px;">
                    <!-- Log entries will be added here dynamically -->
                    <div style="text-align: center; color: #666; padding: 20px; font-style: italic;">
                        No activity yet
                    </div>
                </div>
            </div>
        </section>

        <!-- Loading Spinner -->
        <div id="loadingSpinner" class="spinner-overlay" style="display: none;">
            <div class="spinner"></div>
            <p>Generating forecast...</p>
        </div>
    </div>

    <script>${appJs}</script>
    <script>${appCorrelatedJs}</script>
    <script>${appVolatilityJs}</script>
</body>
</html>
`;
};
