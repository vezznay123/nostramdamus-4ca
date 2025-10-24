// Enhancement to app.js for correlated forecasting
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
            text: `${category} - Correlated Clicks & Revenue Forecast`,
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
            text: `Avg: £${metrics.forecast_rpc_mean.toFixed(2)}`,
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
            text: `Correlation: ${metrics.forecast_correlation.toFixed(3)} (Historical: ${metrics.historical_correlation.toFixed(3)})`,
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

    let html = `<h3>${category} - Correlation Metrics</h3>`;
    html += '<div class="metrics-grid">';

    // Historical correlation
    const histCorrClass = metrics.historical_correlation > 0.7 ? 'good' : metrics.historical_correlation > 0.4 ? 'warning' : 'info';
    html += `
        <div class="metric-box ${histCorrClass}">
            <div class="metric-label">Historical Correlation</div>
            <div class="metric-value">${metrics.historical_correlation.toFixed(3)}</div>
        </div>
    `;

    // Forecast correlation
    const forecastCorrClass = metrics.forecast_correlation > 0.7 ? 'good' : metrics.forecast_correlation > 0.4 ? 'warning' : 'info';
    html += `
        <div class="metric-box ${forecastCorrClass}">
            <div class="metric-label">Forecast Correlation</div>
            <div class="metric-value">${metrics.forecast_correlation.toFixed(3)}</div>
        </div>
    `;

    // Average RPC
    html += `
        <div class="metric-box info">
            <div class="metric-label">Avg Revenue Per Click</div>
            <div class="metric-value">£${metrics.forecast_rpc_mean.toFixed(2)}</div>
        </div>
    `;

    // RPC Coefficient of Variation
    const rpcCvClass = metrics.rpc_coefficient_of_variation < 0.2 ? 'good' : metrics.rpc_coefficient_of_variation < 0.4 ? 'warning' : 'info';
    html += `
        <div class="metric-box ${rpcCvClass}">
            <div class="metric-label">RPC Stability (CV)</div>
            <div class="metric-value">${metrics.rpc_coefficient_of_variation.toFixed(3)}</div>
        </div>
    `;

    html += '</div>';

    metricsDiv.innerHTML = html;
}

// Initialize correlation mode on page load
document.addEventListener('DOMContentLoaded', () => {
    // Set initial state
    metricSelectGroup.style.display = 'none';
    correlationStrengthGroup.style.display = 'block';
});
