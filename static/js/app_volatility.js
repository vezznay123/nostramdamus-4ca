// Volatility forecasting support

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
            text: `${category} - Forecast with Volatility (${(volMetrics.volatility_preserved_pct).toFixed(0)}% of historical)`,
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
            text: `Volatility Impact - Clicks (Std: ${volMetrics.clicks_volatility_std.toFixed(2)})`,
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

    let html = `<h3>${category} - Forecast Metrics</h3>`;
    html += '<div class="metrics-grid">';

    // Historical correlation
    const histCorrClass = corrMetrics.historical_correlation > 0.7 ? 'good' : 'info';
    html += `
        <div class="metric-box ${histCorrClass}">
            <div class="metric-label">Historical Correlation</div>
            <div class="metric-value">${corrMetrics.historical_correlation.toFixed(3)}</div>
        </div>
    `;

    // Average RPC
    html += `
        <div class="metric-box info">
            <div class="metric-label">Avg Revenue Per Click</div>
            <div class="metric-value">£${corrMetrics.forecast_rpc_mean.toFixed(2)}</div>
        </div>
    `;

    // Volatility preserved
    const volPreservedClass = volMetrics.volatility_preserved_pct > 50 ? 'good' : 'warning';
    html += `
        <div class="metric-box ${volPreservedClass}">
            <div class="metric-label">Volatility Preserved</div>
            <div class="metric-value">${volMetrics.volatility_preserved_pct.toFixed(0)}%</div>
        </div>
    `;

    // Clicks volatility std
    html += `
        <div class="metric-box info">
            <div class="metric-label">Clicks Daily Variance</div>
            <div class="metric-value">±${volMetrics.clicks_volatility_std.toFixed(0)}</div>
        </div>
    `;

    // Revenue volatility std
    html += `
        <div class="metric-box info">
            <div class="metric-label">Revenue Daily Variance</div>
            <div class="metric-value">±£${volMetrics.revenue_volatility_std.toFixed(0)}</div>
        </div>
    `;

    // Historical spike threshold
    html += `
        <div class="metric-box warning">
            <div class="metric-label">Expected Spike Size</div>
            <div class="metric-value">±${volMetrics.clicks_spike_threshold.toFixed(0)}</div>
        </div>
    `;

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
