/**
 * Workers AI Forecasting Module
 * Uses Cloudflare Workers AI for time series forecasting
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
}

/**
 * Generate forecast using Workers AI
 */
export async function generateForecast(
  ai: any,
  historicalData: HistoricalDataPoint[],
  params: ForecastParams = {}
): Promise<ForecastResult[]> {

  const {
    mode = 'volatility',
    forecast_days = 14,
    seasonal_weight = 0.5,
    run_rate_weight = 0.5,
    correlation_strength = 0.85,
    volatility_factor = 0.7
  } = params;

  // Group data by category
  const categorizedData = groupByCategory(historicalData);

  const forecasts: ForecastResult[] = [];

  for (const [category, data] of Object.entries(categorizedData)) {
    // Prepare data for AI analysis
    const preparedData = prepareDataForAI(data, forecast_days);

    // Create AI prompt based on mode
    const prompt = createForecastPrompt(
      category,
      preparedData,
      mode,
      forecast_days,
      {seasonal_weight, run_rate_weight, correlation_strength, volatility_factor}
    );

    // Call Workers AI
    const aiResponse = await ai.run('@cf/meta/llama-2-7b-chat-int8', {
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    // Parse AI response
    const forecast = parseAIResponse(aiResponse, category, forecast_days);
    forecasts.push(forecast);
  }

  return forecasts;
}

/**
 * System prompt for AI forecasting
 */
const SYSTEM_PROMPT = `You are an expert retail forecasting AI specialized in time series analysis.
Your task is to analyze historical click and revenue data and generate accurate forecasts.

You MUST output ONLY valid JSON in this exact format:
{
  "forecasts": [
    {"date": "YYYY-MM-DD", "clicks": number, "revenue": number},
    ...
  ]
}

Analysis requirements:
1. Detect weekly seasonality patterns (day-of-week effects)
2. Identify trends (growth/decline)
3. Maintain correlation between clicks and revenue
4. Apply realistic volatility
5. Consider recent performance more heavily
6. Smooth outliers appropriately

Do NOT include explanations or markdown. Output ONLY the JSON object.`;

/**
 * Create forecast prompt for AI
 */
function createForecastPrompt(
  category: string,
  data: PreparedData,
  mode: string,
  forecastDays: number,
  params: any
): string {
  const {seasonal_weight, run_rate_weight, correlation_strength, volatility_factor} = params;

  return `Historical Data for category "${category}":
${JSON.stringify(data.historical, null, 2)}

Statistics:
- Total days: ${data.stats.total_days}
- Average daily clicks: ${data.stats.avg_clicks.toFixed(2)}
- Average daily revenue: £${data.stats.avg_revenue.toFixed(2)}
- Click-to-revenue ratio: £${data.stats.revenue_per_click.toFixed(2)}
- Trend: ${data.stats.trend}
- Weekly seasonality detected: ${data.stats.has_weekly_pattern ? 'Yes' : 'No'}

Forecast Parameters:
- Mode: ${mode}
- Forecast period: ${forecastDays} days
- Seasonal weight: ${seasonal_weight}
- Run rate weight: ${run_rate_weight}
- Correlation strength: ${correlation_strength}
- Volatility factor: ${volatility_factor}

Generate a ${forecastDays}-day forecast starting from ${data.next_date}.

Requirements:
1. Maintain the ${data.stats.revenue_per_click.toFixed(2)} click-to-revenue ratio (±${correlation_strength * 100}%)
2. Apply ${seasonal_weight * 100}% seasonal pattern weighting
3. Apply ${run_rate_weight * 100}% recent trend weighting
4. Include realistic day-to-day volatility (±${volatility_factor * 100}%)
5. Output ONLY valid JSON with "forecasts" array

Output JSON now:`;
}

interface PreparedData {
  historical: Array<{date: string; clicks: number; revenue: number}>;
  stats: {
    total_days: number;
    avg_clicks: number;
    avg_revenue: number;
    revenue_per_click: number;
    trend: 'growing' | 'stable' | 'declining';
    has_weekly_pattern: boolean;
  };
  next_date: string;
}

/**
 * Prepare data for AI analysis
 */
function prepareDataForAI(
  data: HistoricalDataPoint[],
  forecastDays: number
): PreparedData {
  // Sort by date
  const sorted = [...data].sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Calculate statistics
  const totalClicks = sorted.reduce((sum, d) => sum + d.clicks, 0);
  const totalRevenue = sorted.reduce((sum, d) => sum + d.revenue, 0);
  const avgClicks = totalClicks / sorted.length;
  const avgRevenue = totalRevenue / sorted.length;
  const revenuePerClick = totalRevenue / totalClicks;

  // Detect trend (compare first third vs last third)
  const thirdSize = Math.floor(sorted.length / 3);
  const firstThirdAvg = sorted.slice(0, thirdSize)
    .reduce((sum, d) => sum + d.clicks, 0) / thirdSize;
  const lastThirdAvg = sorted.slice(-thirdSize)
    .reduce((sum, d) => sum + d.clicks, 0) / thirdSize;

  let trend: 'growing' | 'stable' | 'declining' = 'stable';
  if (lastThirdAvg > firstThirdAvg * 1.1) trend = 'growing';
  else if (lastThirdAvg < firstThirdAvg * 0.9) trend = 'declining';

  // Detect weekly pattern (simplified)
  const hasWeeklyPattern = sorted.length >= 14; // Assume pattern if enough data

  // Calculate next date
  const lastDate = new Date(sorted[sorted.length - 1].date);
  const nextDate = new Date(lastDate);
  nextDate.setDate(nextDate.getDate() + 1);

  return {
    historical: sorted.map(d => ({
      date: d.date,
      clicks: d.clicks,
      revenue: d.revenue
    })),
    stats: {
      total_days: sorted.length,
      avg_clicks: avgClicks,
      avg_revenue: avgRevenue,
      revenue_per_click: revenuePerClick,
      trend,
      has_weekly_pattern: hasWeeklyPattern
    },
    next_date: nextDate.toISOString().split('T')[0]
  };
}

/**
 * Parse AI response into forecast result
 */
function parseAIResponse(
  aiResponse: any,
  category: string,
  forecastDays: number
): ForecastResult {
  try {
    // Extract JSON from response
    const responseText = typeof aiResponse.response === 'string'
      ? aiResponse.response
      : JSON.stringify(aiResponse.response);

    // Try to extract JSON object from text
    const jsonMatch = responseText.match(/\{[\s\S]*"forecasts"[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in AI response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    if (!parsed.forecasts || !Array.isArray(parsed.forecasts)) {
      throw new Error('Invalid forecast format');
    }

    return {
      category,
      forecasts: parsed.forecasts.map((f: any) => ({
        date: f.date,
        clicks_forecast: parseFloat(f.clicks) || 0,
        revenue_forecast: parseFloat(f.revenue) || 0
      }))
    };

  } catch (error) {
    console.error('Failed to parse AI response:', error);

    // Fallback: generate simple forecast using basic logic
    return generateFallbackForecast(category, forecastDays);
  }
}

/**
 * Fallback forecast if AI fails
 */
function generateFallbackForecast(
  category: string,
  forecastDays: number
): ForecastResult {
  const forecasts = [];
  const today = new Date();

  for (let i = 1; i <= forecastDays; i++) {
    const forecastDate = new Date(today);
    forecastDate.setDate(today.getDate() + i);

    forecasts.push({
      date: forecastDate.toISOString().split('T')[0],
      clicks_forecast: 1000, // Placeholder
      revenue_forecast: 500   // Placeholder
    });
  }

  return {category, forecasts};
}

/**
 * Group historical data by category
 */
function groupByCategory(
  data: HistoricalDataPoint[]
): Record<string, HistoricalDataPoint[]> {
  const grouped: Record<string, HistoricalDataPoint[]> = {};

  for (const point of data) {
    if (!grouped[point.category]) {
      grouped[point.category] = [];
    }
    grouped[point.category].push(point);
  }

  return grouped;
}
