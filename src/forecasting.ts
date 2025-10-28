/**
 * Mathematical Forecasting Module
 * Implements hybrid forecasting combining seasonal patterns with run rate
 * Based on statistical methods, NOT AI/LLM
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
    confidence_lower?: number;
    confidence_upper?: number;
  }>;
}

export interface ForecastParams {
  mode?: 'single' | 'correlated' | 'volatility';
  seasonal_weight?: number;
  run_rate_weight?: number;
  smoothing_alpha?: number;
  recent_window_days?: number;
  correlation_strength?: number;
  volatility_factor?: number;
  forecast_days?: number;
  metric?: string;
}

/**
 * Generate forecast using mathematical algorithms (NO AI)
 */
export async function generateForecast(
  _ai: any, // Not used anymore - kept for backward compatibility
  historicalData: HistoricalDataPoint[],
  params: ForecastParams = {}
): Promise<ForecastResult[]> {

  const {
    forecast_days = 14,
    seasonal_weight = 0.5,
    run_rate_weight = 0.5,
    recent_window_days = 28,
  } = params;

  // Normalize weights
  const total = seasonal_weight + run_rate_weight;
  const normSeasonalWeight = total > 0 ? seasonal_weight / total : 0.5;
  const normRunRateWeight = total > 0 ? run_rate_weight / total : 0.5;

  // Group data by category
  const categorizedData = groupByCategory(historicalData);

  const forecasts: ForecastResult[] = [];

  for (const [category, data] of Object.entries(categorizedData)) {
    // Generate forecast for clicks
    const clicksForecast = forecastMetric(
      data,
      'clicks',
      forecast_days,
      normSeasonalWeight,
      normRunRateWeight,
      recent_window_days
    );

    // Generate forecast for revenue
    const revenueForecast = forecastMetric(
      data,
      'revenue',
      forecast_days,
      normSeasonalWeight,
      normRunRateWeight,
      recent_window_days
    );

    // Combine into forecast result
    const categoryForecast: ForecastResult = {
      category,
      forecasts: clicksForecast.map((cf, idx) => ({
        date: cf.date,
        clicks_forecast: cf.value,
        revenue_forecast: revenueForecast[idx].value,
      }))
    };

    forecasts.push(categoryForecast);
  }

  return forecasts;
}

/**
 * Forecast a single metric using mathematical algorithm
 */
function forecastMetric(
  data: HistoricalDataPoint[],
  metric: 'clicks' | 'revenue',
  forecastDays: number,
  seasonalWeight: number,
  runRateWeight: number,
  recentWindowDays: number
): Array<{ date: string; value: number }> {

  // Sort data by date
  const sortedData = [...data].sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Extract metric values
  const values = sortedData.map(d => d[metric]);
  const dates = sortedData.map(d => new Date(d.date));

  // Calculate run rate (exponential weighted average of recent data)
  const runRate = calculateRunRate(values, recentWindowDays);

  // Calculate mean for seasonal adjustment
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;

  // Get last date
  const lastDate = dates[dates.length - 1];

  // Generate forecasts
  const forecasts: Array<{ date: string; value: number }> = [];

  for (let i = 1; i <= forecastDays; i++) {
    // Calculate future date
    const futureDate = new Date(lastDate);
    futureDate.setDate(futureDate.getDate() + i);

    // Get day of week (0 = Sunday, 6 = Saturday)
    const dayOfWeek = futureDate.getDay();

    // Calculate seasonal pattern (average of same day of week from last 4 weeks)
    const seasonalPattern = calculateSeasonalPattern(
      sortedData,
      metric,
      dayOfWeek,
      4
    );

    // Calculate seasonal adjustment (deviation from mean)
    const seasonalAdjustment = seasonalPattern > 0 ? seasonalPattern - mean : 0;

    // Combine seasonal and run rate components
    let forecastValue =
      seasonalWeight * (runRate + seasonalAdjustment) +
      runRateWeight * runRate;

    // Ensure non-negative
    forecastValue = Math.max(0, forecastValue);

    forecasts.push({
      date: futureDate.toISOString().split('T')[0],
      value: Math.round(forecastValue * 100) / 100 // Round to 2 decimals
    });
  }

  return forecasts;
}

/**
 * Calculate run rate using exponential weighted average
 */
function calculateRunRate(values: number[], windowDays: number): number {
  // Get recent data
  const recentValues = values.slice(-windowDays);

  if (recentValues.length === 0) {
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  // Create exponential weights (more recent = higher weight)
  const weights: number[] = [];
  for (let i = 0; i < recentValues.length; i++) {
    weights.push(Math.exp((-1 + i / (recentValues.length - 1))));
  }

  // Normalize weights
  const weightSum = weights.reduce((sum, w) => sum + w, 0);
  const normalizedWeights = weights.map(w => w / weightSum);

  // Calculate weighted average
  let runRate = 0;
  for (let i = 0; i < recentValues.length; i++) {
    runRate += recentValues[i] * normalizedWeights[i];
  }

  return runRate;
}

/**
 * Calculate seasonal pattern for a specific day of week
 */
function calculateSeasonalPattern(
  data: HistoricalDataPoint[],
  metric: 'clicks' | 'revenue',
  dayOfWeek: number,
  numWeeks: number
): number {
  // Filter data for same day of week
  const sameDayData = data.filter(d => {
    const date = new Date(d.date);
    return date.getDay() === dayOfWeek;
  });

  if (sameDayData.length === 0) {
    return 0;
  }

  // Get last N weeks
  const recentSameDayData = sameDayData.slice(-numWeeks);

  // Calculate average
  const values = recentSameDayData.map(d => d[metric]);
  const average = values.reduce((sum, val) => sum + val, 0) / values.length;

  return average;
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
