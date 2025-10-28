/**
 * Machine Learning Forecasting Module
 * Calls Google Cloud Function for Prophet/SARIMA forecasting
 * Falls back to Holt-Winters if GCP is unavailable
 */

export interface HistoricalDataPoint {
  date: string;
  category: string;
  clicks: number;
  revenue: number;
}

export interface ForecastResult {
  category: string;
  forecasts: Array<{
    date: string;
    clicks_forecast: number;
    revenue_forecast: number;
    clicks_lower?: number;
    clicks_upper?: number;
    revenue_lower?: number;
    revenue_upper?: number;
  }>;
}

export interface ForecastParams {
  mode?: 'single' | 'correlated';
  metric?: 'clicks' | 'revenue';
  forecast_days?: number;
  method?: 'prophet' | 'sarima';  // Forecasting method

  // SARIMA parameters
  p?: number;  // AR order
  d?: number;  // Differencing order
  q?: number;  // MA order
  P?: number;  // Seasonal AR order
  D?: number;  // Seasonal differencing
  Q?: number;  // Seasonal MA order
  s?: number;  // Seasonal period (e.g., 7 for weekly)

  // Prophet parameters
  seasonality_mode?: 'additive' | 'multiplicative';
  changepoint_prior_scale?: number;  // 0.001 to 0.5

  // Volatility/confidence
  include_volatility?: boolean;
  confidence_level?: number;  // 0.95 for 95% confidence interval
}

/**
 * Generate forecast using Prophet/SARIMA (GCP) or Holt-Winters (fallback)
 */
export async function generateMLForecast(
  historicalData: HistoricalDataPoint[],
  params: ForecastParams = {},
  gcpForecastUrl?: string
): Promise<ForecastResult[]> {

  const {
    forecast_days = 14,
    mode = 'correlated',
    metric = 'clicks',
    method = 'prophet',  // 'prophet' or 'sarima'
    p = 1,
    d = 1,
    q = 1,
    P = 1,
    D = 0,
    Q = 1,
    s = 7,  // Weekly seasonality
    seasonality_mode = 'additive',
    changepoint_prior_scale = 0.05,
    include_volatility = false,
    confidence_level = 0.95,
  } = params;

  // Try GCP Cloud Function first (Prophet/SARIMA)
  if (gcpForecastUrl) {
    try {
      const response = await fetch(gcpForecastUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          historical_data: historicalData,
          params: {
            mode,
            metric,
            forecast_days,
            method,
            p, d, q,
            P, D, Q, s,
            seasonality_mode,
            changepoint_prior_scale,
            include_volatility,
            confidence_level,
          }
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          return result.forecasts;
        }
      }
    } catch (error) {
      console.error('GCP forecast error, falling back to Holt-Winters:', error);
    }
  }

  // Fallback to Holt-Winters if GCP unavailable

  // Group data by category
  const categorizedData = groupByCategory(historicalData);
  const forecasts: ForecastResult[] = [];

  for (const [category, data] of Object.entries(categorizedData)) {
    if (mode === 'single') {
      // Single metric forecasting
      const result = await forecastSingleMetric(
        data,
        metric,
        forecast_days,
        { p, d, q, P, D, Q, s },
        include_volatility,
        confidence_level
      );
      forecasts.push(result);
    } else {
      // Correlated forecasting (forecast both metrics)
      const result = await forecastCorrelated(
        data,
        forecast_days,
        { p, d, q, P, D, Q, s },
        include_volatility,
        confidence_level
      );
      forecasts.push(result);
    }
  }

  return forecasts;
}

/**
 * Forecast a single metric using SARIMA
 */
async function forecastSingleMetric(
  data: HistoricalDataPoint[],
  metric: 'clicks' | 'revenue',
  forecastDays: number,
  arimaParams: { p: number; d: number; q: number; P: number; D: number; Q: number; s: number },
  includeVolatility: boolean,
  confidenceLevel: number
): Promise<ForecastResult> {

  // Sort data by date
  const sortedData = [...data].sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Extract time series values
  const values = sortedData.map(d => d[metric]);
  const dates = sortedData.map(d => new Date(d.date));
  const lastDate = dates[dates.length - 1];
  const category = sortedData[0].category;

  // Use Holt-Winters Triple Exponential Smoothing
  const seasonalPeriod = arimaParams.s;
  const predictions = holtWintersAdditive(values, forecastDays, seasonalPeriod);

  // Calculate confidence intervals if requested
  let lowerBounds: number[] | undefined;
  let upperBounds: number[] | undefined;

  if (includeVolatility) {
    // Calculate standard error from residuals
    const fitted = holtWintersAdditive(values, 0, seasonalPeriod);
    const residuals = values.slice(seasonalPeriod).map((v, i) => v - fitted[i]);
    const mse = residuals.reduce((sum, r) => sum + r * r, 0) / residuals.length;
    const stdError = Math.sqrt(mse);

    const zScore = getZScore(confidenceLevel);
    lowerBounds = predictions.map((pred) => Math.max(0, pred - zScore * stdError));
    upperBounds = predictions.map((pred) => pred + zScore * stdError);
  }

  // Format results
  const forecasts = predictions.map((pred, i) => {
    const futureDate = new Date(lastDate);
    futureDate.setDate(futureDate.getDate() + i + 1);

    const result: any = {
      date: futureDate.toISOString().split('T')[0],
      [metric === 'clicks' ? 'clicks_forecast' : 'revenue_forecast']: Math.max(0, Math.round(pred * 100) / 100),
      [metric === 'clicks' ? 'revenue_forecast' : 'clicks_forecast']: 0,  // Other metric is 0 in single mode
    };

    if (lowerBounds && upperBounds) {
      result[`${metric}_lower`] = Math.round(lowerBounds[i] * 100) / 100;
      result[`${metric}_upper`] = Math.round(upperBounds[i] * 100) / 100;
    }

    return result;
  });

  return { category, forecasts };
}

/**
 * Forecast both metrics with correlation
 */
async function forecastCorrelated(
  data: HistoricalDataPoint[],
  forecastDays: number,
  arimaParams: { p: number; d: number; q: number; P: number; D: number; Q: number; s: number },
  includeVolatility: boolean,
  confidenceLevel: number
): Promise<ForecastResult> {

  // Sort data by date
  const sortedData = [...data].sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const clicksValues = sortedData.map(d => d.clicks);
  const revenueValues = sortedData.map(d => d.revenue);
  const dates = sortedData.map(d => new Date(d.date));
  const lastDate = dates[dates.length - 1];
  const category = sortedData[0].category;

  // Forecast clicks using Holt-Winters
  const seasonalPeriod = arimaParams.s;
  const clicksPred = holtWintersAdditive(clicksValues, forecastDays, seasonalPeriod);

  // Calculate clicks-to-revenue ratio for correlation
  const validRatios = sortedData
    .filter(d => d.clicks > 0)
    .map(d => d.revenue / d.clicks);

  const avgRatio = validRatios.reduce((sum, r) => sum + r, 0) / validRatios.length;

  // Forecast revenue based on forecasted clicks
  const revenuePred = clicksPred.map(clicks => clicks * avgRatio);

  // Calculate confidence intervals
  let clicksLower: number[] | undefined;
  let clicksUpper: number[] | undefined;
  let revenueLower: number[] | undefined;
  let revenueUpper: number[] | undefined;

  if (includeVolatility) {
    // Calculate standard error from clicks residuals
    const clicksFitted = holtWintersAdditive(clicksValues, 0, seasonalPeriod);
    const clicksResiduals = clicksValues.slice(seasonalPeriod).map((v, i) => v - clicksFitted[i]);
    const clicksMse = clicksResiduals.reduce((sum, r) => sum + r * r, 0) / clicksResiduals.length;
    const clicksStdError = Math.sqrt(clicksMse);

    const zScore = getZScore(confidenceLevel);
    clicksLower = clicksPred.map((pred) => Math.max(0, pred - zScore * clicksStdError));
    clicksUpper = clicksPred.map((pred) => pred + zScore * clicksStdError);

    // Revenue confidence based on clicks confidence
    revenueLower = clicksLower.map(clicks => clicks * avgRatio * 0.9); // 10% variance
    revenueUpper = clicksUpper.map(clicks => clicks * avgRatio * 1.1);
  }

  // Format results
  const forecasts = clicksPred.map((clicksForecast, i) => {
    const futureDate = new Date(lastDate);
    futureDate.setDate(futureDate.getDate() + i + 1);

    const result: any = {
      date: futureDate.toISOString().split('T')[0],
      clicks_forecast: Math.max(0, Math.round(clicksForecast * 100) / 100),
      revenue_forecast: Math.max(0, Math.round(revenuePred[i] * 100) / 100),
    };

    if (clicksLower && clicksUpper && revenueLower && revenueUpper) {
      result.clicks_lower = Math.round(clicksLower[i] * 100) / 100;
      result.clicks_upper = Math.round(clicksUpper[i] * 100) / 100;
      result.revenue_lower = Math.round(revenueLower[i] * 100) / 100;
      result.revenue_upper = Math.round(revenueUpper[i] * 100) / 100;
    }

    return result;
  });

  return { category, forecasts };
}

/**
 * Fallback forecast using simple exponential smoothing
 */
function fallbackForecast(
  data: HistoricalDataPoint[],
  metric: 'clicks' | 'revenue',
  forecastDays: number,
  category: string
): ForecastResult {

  const sortedData = [...data].sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const values = sortedData.map(d => d[metric]);
  const dates = sortedData.map(d => new Date(d.date));
  const lastDate = dates[dates.length - 1];

  // Simple exponential smoothing with alpha = 0.3
  const alpha = 0.3;
  let level = values[0];

  for (let i = 1; i < values.length; i++) {
    level = alpha * values[i] + (1 - alpha) * level;
  }

  // Forecast with constant level
  const forecasts = [];
  for (let i = 1; i <= forecastDays; i++) {
    const futureDate = new Date(lastDate);
    futureDate.setDate(futureDate.getDate() + i);

    forecasts.push({
      date: futureDate.toISOString().split('T')[0],
      [metric === 'clicks' ? 'clicks_forecast' : 'revenue_forecast']: Math.max(0, Math.round(level * 100) / 100),
      [metric === 'clicks' ? 'revenue_forecast' : 'clicks_forecast']: 0,
    });
  }

  return { category, forecasts };
}

/**
 * Get Z-score for confidence level
 */
function getZScore(confidenceLevel: number): number {
  const zScores: Record<number, number> = {
    0.90: 1.645,
    0.95: 1.96,
    0.99: 2.576,
  };
  return zScores[confidenceLevel] || 1.96;
}

/**
 * Group data by category
 */
function groupByCategory(data: HistoricalDataPoint[]): Record<string, HistoricalDataPoint[]> {
  const grouped: Record<string, HistoricalDataPoint[]> = {};

  for (const point of data) {
    if (!grouped[point.category]) {
      grouped[point.category] = [];
    }
    grouped[point.category].push(point);
  }

  return grouped;
}

/**
 * Holt-Winters Triple Exponential Smoothing (Additive)
 * Captures level, trend, and seasonal components
 */
function holtWintersAdditive(
  data: number[],
  forecastSteps: number,
  seasonalPeriod: number,
  alpha: number = 0.3,
  beta: number = 0.1,
  gamma: number = 0.1
): number[] {
  const n = data.length;

  if (n < seasonalPeriod * 2) {
    // Not enough data for seasonal decomposition - use simple exponential smoothing
    return simpleExponentialSmoothing(data, forecastSteps, alpha);
  }

  // Initialize components
  let level = data[0];
  let trend = 0;
  const seasonal: number[] = new Array(seasonalPeriod).fill(0);

  // Initial seasonal indices
  for (let i = 0; i < seasonalPeriod; i++) {
    let sum = 0;
    for (let j = 0; j < Math.floor(n / seasonalPeriod); j++) {
      if (i + j * seasonalPeriod < n) {
        sum += data[i + j * seasonalPeriod];
      }
    }
    seasonal[i] = sum / Math.floor(n / seasonalPeriod) - data.slice(0, seasonalPeriod).reduce((a, b) => a + b) / seasonalPeriod;
  }

  // Initial trend
  const firstSeasonAvg = data.slice(0, seasonalPeriod).reduce((a, b) => a + b) / seasonalPeriod;
  const secondSeasonAvg = data.slice(seasonalPeriod, seasonalPeriod * 2).reduce((a, b) => a + b) / seasonalPeriod;
  trend = (secondSeasonAvg - firstSeasonAvg) / seasonalPeriod;

  // Update components through the data
  for (let i = 0; i < n; i++) {
    const lastLevel = level;
    const seasonalIndex = seasonal[i % seasonalPeriod];

    // Update level
    level = alpha * (data[i] - seasonalIndex) + (1 - alpha) * (level + trend);

    // Update trend
    trend = beta * (level - lastLevel) + (1 - beta) * trend;

    // Update seasonal
    seasonal[i % seasonalPeriod] = gamma * (data[i] - level) + (1 - gamma) * seasonalIndex;
  }

  // Generate forecasts
  const forecasts: number[] = [];
  for (let i = 1; i <= forecastSteps; i++) {
    const seasonalIndex = seasonal[(n + i - 1) % seasonalPeriod];
    const forecast = level + i * trend + seasonalIndex;
    forecasts.push(Math.max(0, forecast));
  }

  return forecasts;
}

/**
 * Simple Exponential Smoothing (fallback for small datasets)
 */
function simpleExponentialSmoothing(
  data: number[],
  forecastSteps: number,
  alpha: number = 0.3
): number[] {
  let level = data[0];

  // Update level through the data
  for (let i = 1; i < data.length; i++) {
    level = alpha * data[i] + (1 - alpha) * level;
  }

  // Forecast with constant level
  return new Array(forecastSteps).fill(Math.max(0, level));
}
