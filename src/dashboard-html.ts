/**
 * Dashboard HTML Template
 * Complete frontend for Nostradamus forecasting
 */

export const dashboardHTML = (userEmail: string, userName: string, userPicture: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nostradamus - Retail Forecasting Dashboard</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <script src="https://cdn.plot.ly/plotly-2.27.0.min.js"></script>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: 'Inter', sans-serif;
            background: #0a0a0a;
            color: #ffffff;
            line-height: 1.6;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }
        .container { max-width: 1400px; margin: 0 auto; padding: 20px; }
        header {
            background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%);
            padding: 20px;
            border-radius: 12px;
            margin-bottom: 30px;
            border: 1px solid #2a2a2a;
        }
        .card {
            background: #1a1a1a;
            border-radius: 12px;
            padding: 30px;
            margin-bottom: 25px;
            border: 1px solid #2a2a2a;
        }
        .btn {
            padding: 12px 24px;
            border-radius: 8px;
            border: none;
            cursor: pointer;
            font-size: 1em;
            font-weight: 500;
            transition: all 0.2s;
            font-family: 'Inter', sans-serif;
        }
        .btn-primary {
            background: #f8b133;
            color: #000000;
        }
        .btn-primary:hover { background: #ffc759; }
        .btn-secondary {
            background: #2a2a2a;
            color: #ffffff;
        }
        .btn-secondary:hover { background: #3a3a3a; }
        .input, textarea, select {
            width: 100%;
            padding: 12px;
            background: #0a0a0a;
            border: 1px solid #3a3a3a;
            border-radius: 8px;
            color: #ffffff;
            font-size: 1em;
            font-family: 'Inter', sans-serif;
        }
        .input:focus, textarea:focus, select:focus {
            outline: none;
            border-color: #f8b133;
        }
        .form-group { margin-bottom: 20px; }
        .form-group label {
            display: block;
            margin-bottom: 8px;
            color: #aaaaaa;
            font-weight: 500;
        }
        h2 { color: #f8b133; margin-bottom: 20px; }
        h3 { color: #ffffff; margin-bottom: 15px; }
        .notification {
            padding: 15px 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            border: 1px solid;
        }
        .notification.success {
            background: rgba(34, 197, 94, 0.1);
            border-color: rgba(34, 197, 94, 0.3);
            color: #22c55e;
        }
        .notification.error {
            background: rgba(239, 68, 68, 0.1);
            border-color: rgba(239, 68, 68, 0.3);
            color: #ef4444;
        }
        .loading {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid #f3f3f3;
            border-top: 3px solid #f8b133;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        #forecastCharts { margin-top: 30px; }
        .chart-container {
            background: #1a1a1a;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 25px;
            border: 1px solid #2a2a2a;
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h1 style="color: #f8b133; margin-bottom: 5px;">🔮 Nostradamus</h1>
                    <p style="color: #aaaaaa; margin: 0;">Retail Forecasting Dashboard</p>
                </div>
                <div style="display: flex; align-items: center; gap: 20px;">
                    <div style="color: #aaaaaa; font-size: 0.9em; text-align: right;">
                        <div>${userName}</div>
                        <div style="font-size: 0.85em; opacity: 0.8;">${userEmail}</div>
                    </div>
                    ${userPicture ? `<img src="${userPicture}" alt="${userName}" style="width: 40px; height: 40px; border-radius: 50%; border: 2px solid #f8b133;">` : ''}
                    <a href="/auth/logout" class="btn btn-secondary" style="text-decoration: none;">Logout</a>
                </div>
            </div>
        </header>

        <div id="notificationArea"></div>

        <!-- Data Source Section -->
        <section class="card">
            <h2>📊 Data Source</h2>
            <div style="display: flex; gap: 15px; margin-bottom: 20px;">
                <button id="loadSheetsBtn" class="btn btn-primary">Load from Google Sheets</button>
                <button id="loadBigQueryBtn" class="btn btn-secondary">Load from BigQuery</button>
            </div>
            <div id="dataLoadStatus"></div>
            <div id="dataSummary" style="margin-top: 20px;"></div>
        </section>

        <!-- Forecast Configuration -->
        <section class="card">
            <h2>⚙️ Forecast Configuration</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">
                <div class="form-group">
                    <label>Forecast Mode</label>
                    <select id="forecastMode">
                        <option value="volatility">Volatility Mode</option>
                        <option value="correlated">Correlated Mode</option>
                        <option value="single">Single Metric</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Forecast Days</label>
                    <input type="number" id="forecastDays" value="14" min="1" max="90" class="input">
                </div>
                <div class="form-group">
                    <label>Seasonal Weight</label>
                    <input type="number" id="seasonalWeight" value="0.5" min="0" max="1" step="0.1" class="input">
                </div>
                <div class="form-group">
                    <label>Run Rate Weight</label>
                    <input type="number" id="runRateWeight" value="0.5" min="0" max="1" step="0.1" class="input">
                </div>
            </div>
            <button id="generateForecastBtn" class="btn btn-primary" style="margin-top: 20px;" disabled>Generate Forecast</button>
        </section>

        <!-- Forecast Results -->
        <section class="card" id="forecastSection" style="display: none;">
            <h2>📈 Forecast Results</h2>
            <div style="display: flex; gap: 15px; margin-bottom: 20px;">
                <button id="exportToSheetsBtn" class="btn btn-primary">Export to Google Sheets</button>
                <button id="downloadCsvBtn" class="btn btn-secondary">Download CSV</button>
            </div>
            <div id="forecastCharts"></div>
        </section>
    </div>

    <script>
        let currentData = null;
        let currentForecasts = null;

        // Show notification
        function showNotification(message, type = 'success') {
            const area = document.getElementById('notificationArea');
            const notif = document.createElement('div');
            notif.className = \`notification \${type}\`;
            notif.textContent = message;
            area.appendChild(notif);
            setTimeout(() => notif.remove(), 5000);
        }

        // Load from Google Sheets
        document.getElementById('loadSheetsBtn').addEventListener('click', async () => {
            const url = prompt('Enter Google Sheets URL:');
            if (!url) return;

            const sheetName = prompt('Enter sheet name:', 'Sheet1');

            document.getElementById('dataLoadStatus').innerHTML = '<div class="loading"></div> Loading data from Google Sheets...';

            try {
                const response = await fetch('/api/load-google-sheets', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ spreadsheet_url: url, sheet_name: sheetName })
                });

                const result = await response.json();

                if (result.success) {
                    currentData = result.data;
                    showNotification(\`Loaded \${result.count} rows from Google Sheets\`);
                    document.getElementById('dataSummary').innerHTML = \`
                        <p style="color: #aaaaaa;">✅ \${result.count} rows loaded</p>
                    \`;
                    document.getElementById('generateForecastBtn').disabled = false;
                    document.getElementById('dataLoadStatus').innerHTML = '';
                } else {
                    showNotification('Error: ' + result.error, 'error');
                    document.getElementById('dataLoadStatus').innerHTML = '';
                }
            } catch (error) {
                showNotification('Failed to load data: ' + error.message, 'error');
                document.getElementById('dataLoadStatus').innerHTML = '';
            }
        });

        // Load from BigQuery
        document.getElementById('loadBigQueryBtn').addEventListener('click', async () => {
            const projectId = prompt('Enter GCP Project ID:');
            if (!projectId) return;

            const useQuery = confirm('Use SQL query? (Cancel to use table reference)');
            let body = { project_id: projectId };

            if (useQuery) {
                const query = prompt('Enter SQL query:');
                if (!query) return;
                body.query = query;
            } else {
                const datasetId = prompt('Enter dataset ID:');
                const tableId = prompt('Enter table ID:');
                if (!datasetId || !tableId) return;
                body.dataset_id = datasetId;
                body.table_id = tableId;
            }

            document.getElementById('dataLoadStatus').innerHTML = '<div class="loading"></div> Loading data from BigQuery...';

            try {
                const response = await fetch('/api/load-bigquery', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });

                const result = await response.json();

                if (result.success) {
                    currentData = result.data;
                    showNotification(\`Loaded \${result.count} rows from BigQuery\`);
                    document.getElementById('dataSummary').innerHTML = \`
                        <p style="color: #aaaaaa;">✅ \${result.count} rows loaded</p>
                    \`;
                    document.getElementById('generateForecastBtn').disabled = false;
                    document.getElementById('dataLoadStatus').innerHTML = '';
                } else {
                    showNotification('Error: ' + result.error, 'error');
                    document.getElementById('dataLoadStatus').innerHTML = '';
                }
            } catch (error) {
                showNotification('Failed to load data: ' + error.message, 'error');
                document.getElementById('dataLoadStatus').innerHTML = '';
            }
        });

        // Generate Forecast
        document.getElementById('generateForecastBtn').addEventListener('click', async () => {
            if (!currentData) {
                showNotification('Please load data first', 'error');
                return;
            }

            const btn = document.getElementById('generateForecastBtn');
            btn.disabled = true;
            btn.innerHTML = '<div class="loading"></div> Generating forecast...';

            const params = {
                mode: document.getElementById('forecastMode').value,
                forecast_days: parseInt(document.getElementById('forecastDays').value),
                seasonal_weight: parseFloat(document.getElementById('seasonalWeight').value),
                run_rate_weight: parseFloat(document.getElementById('runRateWeight').value)
            };

            try {
                const response = await fetch('/api/forecast', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ historical_data: currentData, params })
                });

                const result = await response.json();

                if (result.success) {
                    currentForecasts = result.forecasts;
                    showNotification('Forecast generated successfully!');
                    renderForecasts(result.forecasts);
                    document.getElementById('forecastSection').style.display = 'block';
                } else {
                    showNotification('Error: ' + result.error, 'error');
                }
            } catch (error) {
                showNotification('Failed to generate forecast: ' + error.message, 'error');
            }

            btn.disabled = false;
            btn.textContent = 'Generate Forecast';
        });

        // Render forecast charts
        function renderForecasts(forecasts) {
            const container = document.getElementById('forecastCharts');
            container.innerHTML = '';

            forecasts.forEach(categoryForecast => {
                const chartDiv = document.createElement('div');
                chartDiv.className = 'chart-container';
                chartDiv.id = \`chart-\${categoryForecast.category}\`;
                container.appendChild(chartDiv);

                const dates = categoryForecast.forecasts.map(f => f.date);
                const clicks = categoryForecast.forecasts.map(f => f.clicks_forecast);
                const revenue = categoryForecast.forecasts.map(f => f.revenue_forecast);

                const trace1 = {
                    x: dates,
                    y: clicks,
                    type: 'scatter',
                    mode: 'lines+markers',
                    name: 'Clicks Forecast',
                    line: { color: '#f8b133', width: 3 }
                };

                const trace2 = {
                    x: dates,
                    y: revenue,
                    type: 'scatter',
                    mode: 'lines+markers',
                    name: 'Revenue Forecast',
                    yaxis: 'y2',
                    line: { color: '#ffffff', width: 3 }
                };

                const layout = {
                    title: {
                        text: \`Forecast: \${categoryForecast.category}\`,
                        font: { color: '#f8b133', size: 18 }
                    },
                    paper_bgcolor: '#0a0a0a',
                    plot_bgcolor: '#0a0a0a',
                    font: { color: '#ffffff' },
                    xaxis: { gridcolor: '#2a2a2a' },
                    yaxis: {
                        title: 'Clicks',
                        gridcolor: '#2a2a2a',
                        titlefont: { color: '#f8b133' }
                    },
                    yaxis2: {
                        title: 'Revenue',
                        overlaying: 'y',
                        side: 'right',
                        gridcolor: '#2a2a2a',
                        titlefont: { color: '#ffffff' }
                    },
                    showlegend: true,
                    legend: { x: 0, y: 1.2, orientation: 'h' }
                };

                Plotly.newPlot(chartDiv.id, [trace1, trace2], layout, { responsive: true });
            });
        }

        // Export to Sheets
        document.getElementById('exportToSheetsBtn').addEventListener('click', async () => {
            if (!currentForecasts) return;

            const url = prompt('Enter Google Sheets URL for export:');
            if (!url) return;

            const sheetName = prompt('Enter sheet name for results:', 'Forecast_Results');

            try {
                const response = await fetch('/api/export-to-sheets', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ spreadsheet_url: url, sheet_name: sheetName, forecasts: currentForecasts })
                });

                const result = await response.json();

                if (result.success) {
                    showNotification('Forecasts exported to Google Sheets successfully!');
                } else {
                    showNotification('Error: ' + result.error, 'error');
                }
            } catch (error) {
                showNotification('Failed to export: ' + error.message, 'error');
            }
        });

        // Download CSV
        document.getElementById('downloadCsvBtn').addEventListener('click', () => {
            if (!currentForecasts) return;

            let csv = 'Category,Date,Clicks Forecast,Revenue Forecast\\n';
            currentForecasts.forEach(cf => {
                cf.forecasts.forEach(f => {
                    csv += \`\${cf.category},\${f.date},\${f.clicks_forecast},\${f.revenue_forecast}\\n\`;
                });
            });

            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'forecast_results.csv';
            a.click();
        });
    </script>
</body>
</html>
`;
