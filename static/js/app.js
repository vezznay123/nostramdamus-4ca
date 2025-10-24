// Global state
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
        activityLogList.innerHTML = `
            <div style="text-align: center; color: #666; padding: 20px; font-style: italic;">
                No activity yet
            </div>
        `;
        return;
    }

    activityLogList.innerHTML = activityLog.map(entry => {
        const icon = entry.type === 'data' ? '📊' : entry.type === 'forecast' ? '🔮' : entry.type === 'export' ? '💾' : '📌';
        const typeColor = entry.type === 'data' ? '#60a5fa' : entry.type === 'forecast' ? '#f8b133' : entry.type === 'export' ? '#4ade80' : '#aaaaaa';

        return `
            <div style="background: #0a0a0a; border: 1px solid #2a2a2a; border-radius: 8px; padding: 15px; border-left: 3px solid ${typeColor};">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <span style="font-size: 1.2em;">${icon}</span>
                        <span style="color: ${typeColor}; font-weight: 500;">${entry.message}</span>
                    </div>
                    <span style="color: #666; font-size: 0.85em; white-space: nowrap;">${entry.timestamp}</span>
                </div>
                ${Object.keys(entry.details).length > 0 ? `
                    <div style="margin-left: 32px; font-size: 0.9em; color: #aaaaaa;">
                        ${Object.entries(entry.details).map(([key, value]) =>
                            `<div>${key}: <span style="color: #ffffff;">${value}</span></div>`
                        ).join('')}
                    </div>
                ` : ''}
            </div>
        `;
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
                    `<option value="${cat}">${cat}</option>`
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
    alert.className = `alert alert-${type}`;
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

            configuredSourceLabel.innerHTML = `<span>${label}</span>`;

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
        dataSourceText = `Google Sheets: ${url.substring(0, 50)}...`;
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

    html += `
        <div class="summary-item">
            <h4>Total Records</h4>
            <p>${summary.total_records.toLocaleString()}</p>
        </div>
        <div class="summary-item">
            <h4>Date Range</h4>
            <p>${summary.date_range.start} to ${summary.date_range.end}</p>
        </div>
        <div class="summary-item">
            <h4>Categories</h4>
            <p>${summary.categories.length}</p>
        </div>
    `;

    if (summary.metrics) {
        html += `
            <div class="summary-item">
                <h4>Total Clicks</h4>
                <p>${summary.metrics.total_clicks.toLocaleString()}</p>
            </div>
            <div class="summary-item">
                <h4>Total Revenue</h4>
                <p>£${summary.metrics.total_revenue.toLocaleString()}</p>
            </div>
            <div class="summary-item">
                <h4>Avg Daily Clicks</h4>
                <p>${Math.round(summary.metrics.avg_daily_clicks).toLocaleString()}</p>
            </div>
            <div class="summary-item">
                <h4>Avg Daily Revenue</h4>
                <p>£${Math.round(summary.metrics.avg_daily_revenue).toLocaleString()}</p>
            </div>
        `;
    }

    html += '</div>';
    html += `<p style="margin-top: 15px;"><strong>Categories:</strong> ${summary.categories.join(', ')}</p>`;

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
                `/api/historical-data?metric=${params.metric}&days=90`
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
            text: `${category} - ${metric === 'clicks' ? 'Organic Search Clicks' : 'Organic Search Revenue (£)'}`,
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
            a.download = `forecast_${new Date().toISOString().split('T')[0]}.csv`;
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
            showAlert(`Results pushed to Google Sheets! ${result.records_written} records written to "${result.sheet_name}" tab.`, 'success');
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
                    metricsHTML += `
                        <div class="metric-box good">
                            <div class="metric-label">Mean Absolute Error</div>
                            <div class="metric-value">${cal.performance.mae.toFixed(2)}</div>
                        </div>
                    `;
                }

                // Show MAPE (primary metric)
                const mape = cal.best_mape || (cal.performance && cal.performance.mape);
                if (mape !== undefined) {
                    metricsHTML += `
                        <div class="metric-box good">
                            <div class="metric-label">Mean Absolute % Error</div>
                            <div class="metric-value">${mape.toFixed(2)}%</div>
                        </div>
                    `;
                }

                // Show RMSE if available
                if (cal.performance && cal.performance.rmse !== undefined) {
                    metricsHTML += `
                        <div class="metric-box good">
                            <div class="metric-label">Root Mean Squared Error</div>
                            <div class="metric-value">${cal.performance.rmse.toFixed(2)}</div>
                        </div>
                    `;
                }

                // Show test weeks
                metricsHTML += `
                    <div class="metric-box info">
                        <div class="metric-label">Test Weeks</div>
                        <div class="metric-value">${testWeeks}</div>
                    </div>
                `;

                metricsHTML += '</div>';
                calibrationMetrics.innerHTML = metricsHTML;

                calibrationResults.scrollIntoView({ behavior: 'smooth' });
            }

            showAlert(
                `Calibration complete! Best MAPE: ${mape.toFixed(2)}%. Parameters updated.`,
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
                `<li>${instruction}</li>`
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
