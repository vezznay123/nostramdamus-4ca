/**
 * Nostradamus Forecast - Cloudflare Workers
 * Main entry point
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { generateForecast, HistoricalDataPoint, ForecastParams } from './forecasting';
import { generateMLForecast } from './forecasting-ml';
import {
  generateAuthUrl,
  exchangeCodeForTokens,
  getUserInfo,
  saveTokens,
  createJWT,
  getUserIdFromRequest,
  getValidAccessToken
} from './auth';
import {
  loadFromGoogleSheets,
  parseSheetDataToHistorical,
  writeToGoogleSheets,
  formatForecastsForSheets,
  getSheetInfo
} from './google-sheets';
import {
  loadFromBigQuery,
  parseBigQueryDataToHistorical
} from './bigquery';
import { dashboardHTML } from './dashboard-html';
import { completeDashboardHTML } from './complete-dashboard';
import { adminHTML } from './admin-html';
import * as apiEndpoints from './api-endpoints';

// Environment bindings
export interface Env {
  AI: any;
  DB: D1Database;
  R2_BUCKET?: R2Bucket; // Optional - only if R2 is enabled
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_REDIRECT_URI: string;
  JWT_SECRET: string;
  GCP_FORECAST_URL: string;
}

const app = new Hono<{ Bindings: Env }>();

// Enable CORS for Pages domain
app.use('/*', cors({
  origin: ['https://nostradamus-forecast.pages.dev', 'https://*.nostradamus-forecast.pages.dev', 'http://localhost:5173'],
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length', 'X-Request-Id'],
  maxAge: 86400,
}));

// ============================================================================
// HOMEPAGE & AUTH
// ============================================================================

app.get('/', async (c) => {
  // TODO: Render dashboard HTML
  return c.html(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Nostradamus - Forecasting Dashboard</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
      <style>
        body {
          font-family: 'Inter', sans-serif;
          background: #0a0a0a;
          color: #fff;
          margin: 0;
          padding: 20px;
        }
        .container {
          max-width: 1200px;
          margin: 0 auto;
        }
        h1 { color: #f8b133; }
        .btn {
          background: #f8b133;
          color: #000;
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🔮 Nostradamus Forecasting</h1>
        <p>Retail forecasting powered by Cloudflare Workers AI</p>
        <a href="/auth/google" class="btn">Login with Google</a>
      </div>
    </body>
    </html>
  `);
});

// ============================================================================
// AUTH: GOOGLE OAUTH
// ============================================================================

app.get('/auth/google', async (c) => {
  const authUrl = generateAuthUrl(c.env);
  return c.redirect(authUrl);
});

app.get('/auth/callback', async (c) => {
  try {
    const code = c.req.query('code');

    if (!code) {
      return c.html('<h1>Error: No authorization code received</h1>', 400);
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(c.env, code);

    // Get user info
    const userInfo = await getUserInfo(tokens.access_token);

    // Save or update user in database
    const existingUser = await c.env.DB.prepare(`
      SELECT id FROM users WHERE email = ?
    `).bind(userInfo.email).first();

    let userId: string;

    if (existingUser) {
      userId = (existingUser as any).id;

      // Update user info
      await c.env.DB.prepare(`
        UPDATE users
        SET name = ?, picture = ?, updated_at = datetime('now')
        WHERE id = ?
      `).bind(userInfo.name, userInfo.picture, userId).run();
    } else {
      // Create new user
      userId = `user_${crypto.randomUUID().slice(0, 8)}`;

      await c.env.DB.prepare(`
        INSERT INTO users (id, email, name, picture)
        VALUES (?, ?, ?, ?)
      `).bind(userId, userInfo.email, userInfo.name, userInfo.picture).run();
    }

    // Save OAuth tokens
    await saveTokens(c.env.DB, userId, tokens);

    // Create session JWT
    const sessionToken = await createJWT(c.env.JWT_SECRET, { userId });

    // Set cookie and redirect to dashboard
    // For Pages deployment, pass token in URL then set in localStorage
    const pagesUrl = 'https://nostradamus-forecast.pages.dev';
    const redirectUrl = `${pagesUrl}/auth/callback?token=${sessionToken}`;

    return c.html(`
      <!DOCTYPE html>
      <html>
      <head>
        <script>
          // Set cookie for Workers domain for API calls
          document.cookie = 'session=${sessionToken}; path=/; max-age=86400; SameSite=None; Secure';
          // Redirect to Pages with token
          window.location.href = '${redirectUrl}';
        </script>
      </head>
      <body>Redirecting...</body>
      </html>
    `);

  } catch (error: any) {
    console.error('OAuth callback error:', error);
    return c.html(`<h1>Authentication Error</h1><p>${error.message}</p>`, 500);
  }
});

app.get('/auth/logout', async (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html>
    <head>
      <script>
        document.cookie = 'session=; path=/; max-age=0';
        window.location.href = '/';
      </script>
    </head>
    <body>Logging out...</body>
    </html>
  `);
});

// ============================================================================
// API: AUTH CHECK
// ============================================================================

app.get('/api/check-auth', async (c) => {
  try {
    const userId = await getUserIdFromRequest(c.req.raw, c.env.JWT_SECRET);

    if (!userId) {
      return c.json({ authenticated: false, user: null });
    }

    // Get user info from database
    const user = await c.env.DB.prepare(`
      SELECT email, name, picture FROM users WHERE id = ?
    `).bind(userId).first() as any;

    if (!user) {
      return c.json({ authenticated: false, user: null });
    }

    return c.json({
      authenticated: true,
      user: {
        email: user.email,
        name: user.name,
        picture: user.picture
      }
    });

  } catch (error) {
    console.error('Auth check error:', error);
    return c.json({ authenticated: false, user: null });
  }
});

// ============================================================================
// DASHBOARD
// ============================================================================

app.get('/dashboard', async (c) => {
  try {
    const userId = await getUserIdFromRequest(c.req.raw, c.env.JWT_SECRET);

    if (!userId) {
      return c.redirect('/');
    }

    // Get user info from database
    const user = await c.env.DB.prepare(`
      SELECT email, name, picture FROM users WHERE id = ?
    `).bind(userId).first() as any;

    if (!user) {
      return c.redirect('/');
    }

    // Use complete dashboard with ALL features
    return c.html(completeDashboardHTML(user.email, user.name, user.picture || ''));

  } catch (error) {
    console.error('Dashboard error:', error);
    return c.redirect('/');
  }
});

// ============================================================================
// API: DATA LOADING
// ============================================================================

app.post('/api/load-google-sheets', async (c) => {
  try {
    const userId = await getUserIdFromRequest(c.req.raw, c.env.JWT_SECRET);

    if (!userId) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    const accessToken = await getValidAccessToken(c.env.DB, c.env, userId);

    if (!accessToken) {
      return c.json({ success: false, error: 'No valid OAuth token. Please log in again.' }, 401);
    }

    const { spreadsheet_url, sheet_name } = await c.req.json();

    if (!spreadsheet_url) {
      return c.json({ success: false, error: 'spreadsheet_url is required' }, 400);
    }

    // Load data from Google Sheets
    const sheetData = await loadFromGoogleSheets(accessToken, spreadsheet_url, sheet_name || 'Sheet1');

    // Parse into historical data format
    const historicalData = parseSheetDataToHistorical(sheetData);

    // Calculate summary
    const categories = [...new Set(historicalData.map(d => d.category))];
    const dates = historicalData.map(d => d.date).sort();
    const totalClicks = historicalData.reduce((sum, d) => sum + d.clicks, 0);
    const totalRevenue = historicalData.reduce((sum, d) => sum + d.revenue, 0);

    const dateGroups = new Map<string, { clicks: number, revenue: number }>();
    historicalData.forEach(d => {
      if (!dateGroups.has(d.date)) {
        dateGroups.set(d.date, { clicks: 0, revenue: 0 });
      }
      const group = dateGroups.get(d.date)!;
      group.clicks += d.clicks;
      group.revenue += d.revenue;
    });

    const summary = {
      total_records: historicalData.length,
      date_range: {
        start: dates[0],
        end: dates[dates.length - 1]
      },
      categories,
      metrics: {
        total_clicks: totalClicks,
        total_revenue: totalRevenue,
        avg_daily_clicks: totalClicks / dateGroups.size,
        avg_daily_revenue: totalRevenue / dateGroups.size
      }
    };

    return c.json({
      success: true,
      data: historicalData,
      summary,
      count: historicalData.length
    });

  } catch (error: any) {
    console.error('Google Sheets load error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.post('/api/google-sheets/info', async (c) => {
  try {
    const userId = await getUserIdFromRequest(c.req.raw, c.env.JWT_SECRET);

    if (!userId) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    const accessToken = await getValidAccessToken(c.env.DB, c.env, userId);

    if (!accessToken) {
      return c.json({ success: false, error: 'No valid OAuth token. Please log in again.' }, 401);
    }

    const { spreadsheet_url } = await c.req.json();

    if (!spreadsheet_url) {
      return c.json({ success: false, error: 'spreadsheet_url is required' }, 400);
    }

    // Get sheet info
    const info = await getSheetInfo(accessToken, spreadsheet_url);

    return c.json({
      success: true,
      info
    });

  } catch (error: any) {
    console.error('Google Sheets info error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.post('/api/load-bigquery', async (c) => {
  try {
    const userId = await getUserIdFromRequest(c.req.raw, c.env.JWT_SECRET);

    if (!userId) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    const accessToken = await getValidAccessToken(c.env.DB, c.env, userId);

    if (!accessToken) {
      return c.json({ success: false, error: 'No valid OAuth token. Please log in again.' }, 401);
    }

    const { project_id, dataset_id, table_id, query } = await c.req.json();

    if (!project_id) {
      return c.json({ success: false, error: 'project_id is required' }, 400);
    }

    // Load data from BigQuery
    const bigQueryData = await loadFromBigQuery(accessToken, {
      projectId: project_id,
      datasetId: dataset_id,
      tableId: table_id,
      query
    });

    // Parse into historical data format
    const historicalData = parseBigQueryDataToHistorical(bigQueryData);

    // Calculate summary
    const categories = [...new Set(historicalData.map(d => d.category))];
    const dates = historicalData.map(d => d.date).sort();
    const totalClicks = historicalData.reduce((sum, d) => sum + d.clicks, 0);
    const totalRevenue = historicalData.reduce((sum, d) => sum + d.revenue, 0);

    const dateGroups = new Map<string, { clicks: number, revenue: number }>();
    historicalData.forEach(d => {
      if (!dateGroups.has(d.date)) {
        dateGroups.set(d.date, { clicks: 0, revenue: 0 });
      }
      const group = dateGroups.get(d.date)!;
      group.clicks += d.clicks;
      group.revenue += d.revenue;
    });

    const summary = {
      total_records: historicalData.length,
      date_range: {
        start: dates[0],
        end: dates[dates.length - 1]
      },
      categories,
      metrics: {
        total_clicks: totalClicks,
        total_revenue: totalRevenue,
        avg_daily_clicks: totalClicks / dateGroups.size,
        avg_daily_revenue: totalRevenue / dateGroups.size
      }
    };

    return c.json({
      success: true,
      data: historicalData,
      summary,
      count: historicalData.length
    });

  } catch (error: any) {
    console.error('BigQuery load error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.post('/api/export-to-sheets', async (c) => {
  try {
    const userId = await getUserIdFromRequest(c.req.raw, c.env.JWT_SECRET);

    if (!userId) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    const accessToken = await getValidAccessToken(c.env.DB, c.env, userId);

    if (!accessToken) {
      return c.json({ success: false, error: 'No valid OAuth token. Please log in again.' }, 401);
    }

    const { spreadsheet_url, sheet_name, forecasts } = await c.req.json();

    if (!spreadsheet_url || !forecasts) {
      return c.json({ success: false, error: 'spreadsheet_url and forecasts are required' }, 400);
    }

    // Format forecasts for sheets
    const sheetData = formatForecastsForSheets(forecasts);

    // Write to Google Sheets
    await writeToGoogleSheets(accessToken, spreadsheet_url, sheet_name || 'Forecast_Results', sheetData);

    return c.json({ success: true });

  } catch (error: any) {
    console.error('Export to sheets error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================================================
// API: ADDITIONAL ENDPOINTS
// ============================================================================

// Sample data
app.post('/api/load-sample-data', (c) => apiEndpoints.loadSampleData(c));

// CSV upload
app.post('/api/upload-data', (c) => apiEndpoints.uploadData(c));

// Historical data
app.get('/api/historical-data', (c) => apiEndpoints.getHistoricalData(c));

// Export
app.post('/api/export-forecast', (c) => apiEndpoints.exportForecast(c));

// Push results
app.post('/api/push-results', (c) => apiEndpoints.pushResults(c));

// Calibration
app.post('/api/calibrate', (c) => apiEndpoints.calibrate(c));

// Backtesting
app.post('/api/backtest', (c) => apiEndpoints.backtest(c));

// Google Apps Script
app.post('/api/generate-apps-script', (c) => apiEndpoints.generateAppsScript(c));

// Adjustments
app.get('/api/adjustments/list', (c) => apiEndpoints.listAdjustments(c));
app.post('/api/adjustments/add', (c) => apiEndpoints.addAdjustment(c));
app.delete('/api/adjustments/delete/:adj_id', (c) => apiEndpoints.deleteAdjustment(c));

// Scheduler
app.post('/api/save-scheduler-config', (c) => apiEndpoints.saveSchedulerConfig(c));
app.post('/api/save-data-source-config', (c) => apiEndpoints.saveDataSourceConfig(c));
app.get('/api/data-source-config/:project_id', (c) => apiEndpoints.getDataSourceConfig(c));

// Refresh Data Source
app.post('/api/refresh-data-source', async (c) => {
  const session = await getSession(c);
  if (!session) {
    return c.json({ success: false, error: 'Not authenticated' }, 401);
  }

  const { project_id } = await c.req.json();

  if (!project_id) {
    return c.json({ success: false, error: 'project_id is required' }, 400);
  }

  try {
    // Get data source config for the project
    const { results: configs } = await c.env.DB.prepare(`
      SELECT * FROM data_source_configs WHERE project_id = ? LIMIT 1
    `).bind(project_id).all();

    if (!configs || configs.length === 0) {
      return c.json({ success: false, error: 'No data source configured for this project' }, 404);
    }

    const config = configs[0] as any;
    let data: any[] = [];

    // Load data based on source type
    if (config.source_type === 'google_sheets') {
      // Get user's OAuth token
      const tokenResult = await c.env.DB.prepare(`
        SELECT access_token FROM oauth_tokens WHERE user_id = ? AND provider = 'google' LIMIT 1
      `).bind(session.userId).first();

      if (!tokenResult) {
        return c.json({ success: false, error: 'Google OAuth token not found. Please re-authenticate.' }, 401);
      }

      const spreadsheetId = config.spreadsheet_url.match(/[-\w]{25,}/)?.[0];
      if (!spreadsheetId) {
        return c.json({ success: false, error: 'Invalid spreadsheet URL' }, 400);
      }

      const range = `${config.sheet_name || 'Sheet1'}!A:D`;
      const sheetsResponse = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`,
        {
          headers: {
            'Authorization': `Bearer ${tokenResult.access_token}`,
          },
        }
      );

      if (!sheetsResponse.ok) {
        return c.json({ success: false, error: 'Failed to fetch data from Google Sheets' }, 500);
      }

      const sheetsData = await sheetsResponse.json();
      const rows = sheetsData.values || [];

      // Skip header row and parse data
      data = rows.slice(1).map((row: any[]) => ({
        date: row[0],
        category: row[1],
        clicks: parseFloat(row[2]) || 0,
        revenue: parseFloat(row[3]) || 0,
      })).filter((item: any) => item.date && item.category);

    } else if (config.source_type === 'bigquery') {
      // Get user's OAuth token
      const tokenResult = await c.env.DB.prepare(`
        SELECT access_token FROM oauth_tokens WHERE user_id = ? AND provider = 'google' LIMIT 1
      `).bind(session.userId).first();

      if (!tokenResult) {
        return c.json({ success: false, error: 'Google OAuth token not found. Please re-authenticate.' }, 401);
      }

      let bigqueryUrl: string;
      if (config.load_method === 'query') {
        bigqueryUrl = `https://bigquery.googleapis.com/bigquery/v2/projects/${config.project_id_gcp}/queries`;
      } else {
        bigqueryUrl = `https://bigquery.googleapis.com/bigquery/v2/projects/${config.project_id_gcp}/datasets/${config.dataset_id}/tables/${config.table_id}/data`;
      }

      const bqResponse = await fetch(bigqueryUrl, {
        method: config.load_method === 'query' ? 'POST' : 'GET',
        headers: {
          'Authorization': `Bearer ${tokenResult.access_token}`,
          'Content-Type': 'application/json',
        },
        body: config.load_method === 'query' ? JSON.stringify({ query: config.query, useLegacySql: false }) : undefined,
      });

      if (!bqResponse.ok) {
        return c.json({ success: false, error: 'Failed to fetch data from BigQuery' }, 500);
      }

      const bqData = await bqResponse.json();
      const rows = bqData.rows || [];

      data = rows.map((row: any) => ({
        date: row.f[0].v,
        category: row.f[1].v,
        clicks: parseFloat(row.f[2].v) || 0,
        revenue: parseFloat(row.f[3].v) || 0,
      }));
    } else {
      return c.json({ success: false, error: 'Unsupported data source type' }, 400);
    }

    // Calculate summary
    const summary = {
      total_records: data.length,
      date_range: {
        start: data[0]?.date || '',
        end: data[data.length - 1]?.date || '',
      },
      categories: [...new Set(data.map((d: any) => d.category))],
      metrics: {
        total_clicks: data.reduce((sum: number, d: any) => sum + d.clicks, 0),
        total_revenue: data.reduce((sum: number, d: any) => sum + d.revenue, 0),
        avg_daily_clicks: data.reduce((sum: number, d: any) => sum + d.clicks, 0) / data.length,
        avg_daily_revenue: data.reduce((sum: number, d: any) => sum + d.revenue, 0) / data.length,
      },
    };

    return c.json({ success: true, data, summary });
  } catch (error: any) {
    console.error('Error refreshing data source:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Health check
app.get('/api/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

// Correlated and volatility forecast modes (use same endpoint with different params)
app.post('/api/forecast-correlated', async (c) => {
  try {
    const body = await c.req.json();
    const params = { ...body.params, mode: 'correlated' as 'correlated' };
    const forecasts = await generateMLForecast(body.historical_data, params, c.env.GCP_FORECAST_URL);
    return c.json({ success: true, forecasts });
  } catch (error: any) {
    console.error('Forecast correlated error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.post('/api/forecast-with-volatility', async (c) => {
  try {
    const body = await c.req.json();
    const params = { ...body.params, include_volatility: true };
    const forecasts = await generateMLForecast(body.historical_data, params, c.env.GCP_FORECAST_URL);
    return c.json({ success: true, forecasts });
  } catch (error: any) {
    console.error('Forecast volatility error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.post('/api/auto-tune-sarima', async (c) => {
  try {
    const body = await c.req.json();

    if (!c.env.GCP_FORECAST_URL) {
      return c.json({ success: false, error: 'GCP function not configured' }, 500);
    }

    const response = await fetch(`${c.env.GCP_FORECAST_URL}/auto_tune_sarima`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        historical_data: body.historical_data,
        metric: body.metric || 'clicks',
        s: body.s || 7
      })
    });

    const result = await response.json();
    return c.json(result);
  } catch (error: any) {
    console.error('Auto-tune SARIMA error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================================================
// API: FORECAST
// ============================================================================

app.post('/api/forecast', async (c) => {
  try {
    // Get request data
    const { historical_data, params } = await c.req.json<{
      historical_data: HistoricalDataPoint[];
      params?: ForecastParams;
    }>();

    if (!historical_data || !Array.isArray(historical_data)) {
      return c.json({ success: false, error: 'Invalid historical data' }, 400);
    }

    // Generate forecast using ARIMA/ML
    const forecasts = await generateMLForecast(historical_data, params, c.env.GCP_FORECAST_URL);

    // Save to database
    const projectId = 'default'; // TODO: Get from auth
    for (const forecast of forecasts) {
      for (const point of forecast.forecasts) {
        await c.env.DB.prepare(`
          INSERT INTO forecast_results
          (project_id, category, forecast_date, clicks_forecast, revenue_forecast, mode)
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
          projectId,
          forecast.category,
          point.date,
          point.clicks_forecast,
          point.revenue_forecast,
          params?.mode || 'volatility'
        ).run();
      }
    }

    return c.json({
      success: true,
      forecasts
    });

  } catch (error: any) {
    console.error('Forecast error:', error);
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
});

// ============================================================================
// API: PROJECTS (Full CRUD)
// ============================================================================

// List all projects for the user
app.get('/api/projects', (c) => apiEndpoints.listProjects(c));

// Get single project
app.get('/api/projects/:project_id', (c) => apiEndpoints.getProject(c));

// Create new project
app.post('/api/projects', (c) => apiEndpoints.createProject(c));

// Update project
app.put('/api/projects/:project_id', (c) => apiEndpoints.updateProject(c));

// Delete project
app.delete('/api/projects/:project_id', (c) => apiEndpoints.deleteProject(c));

// Set active project
app.post('/api/projects/:project_id/set-active', (c) => apiEndpoints.setActiveProject(c));

// Get active project
app.get('/api/projects/active', (c) => apiEndpoints.getActiveProject(c));

// ============================================================================
// API: DATA SOURCE CONFIG
// ============================================================================

app.post('/api/config/data-source', async (c) => {
  try {
    const projectId = 'default'; // TODO: Get from auth
    const config = await c.req.json();

    // Save data source config
    await c.env.DB.prepare(`
      INSERT OR REPLACE INTO data_source_configs
      (project_id, source_type, spreadsheet_url, sheet_name, query,
       project_id_gcp, dataset_id, table_id, load_method)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      projectId,
      config.source_type,
      config.spreadsheet_url || null,
      config.sheet_name || null,
      config.query || null,
      config.project_id || null,
      config.dataset_id || null,
      config.table_id || null,
      config.load_method || null
    ).run();

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================================================
// FORECAST ACCURACY & COMPARISON
// ============================================================================

// Record actual values for accuracy tracking
app.post('/api/record-actual-values', async (c) => {
  try {
    const session = await getSession(c);
    if (!session) {
      return c.json({ success: false, error: 'Not authenticated' }, 401);
    }

    const body = await c.req.json();
    const { project_id, actual_data } = body;

    if (!project_id || !actual_data || !Array.isArray(actual_data)) {
      return c.json({ success: false, error: 'Missing required fields' }, 400);
    }

    // Find matching forecasts and calculate accuracy
    for (const actual of actual_data) {
      const { date, category, clicks, revenue } = actual;

      // Find the most recent forecast for this date/category
      const forecast = await c.env.DB.prepare(`
        SELECT fr.id as run_id, fres.clicks_forecast, fres.revenue_forecast
        FROM forecast_runs fr
        JOIN forecast_results fres ON fres.project_id = fr.project_id
        WHERE fr.project_id = ?
          AND fres.category = ?
          AND fres.forecast_date = ?
          AND fr.status = 'completed'
        ORDER BY fr.run_at DESC
        LIMIT 1
      `).bind(project_id, category, date).first();

      if (forecast) {
        const clicksError = Math.abs(clicks - forecast.clicks_forecast);
        const revenueError = Math.abs(revenue - forecast.revenue_forecast);
        const clicksErrorPct = forecast.clicks_forecast > 0
          ? (clicksError / forecast.clicks_forecast) * 100
          : 0;
        const revenueErrorPct = forecast.revenue_forecast > 0
          ? (revenueError / forecast.revenue_forecast) * 100
          : 0;

        await c.env.DB.prepare(`
          INSERT INTO forecast_accuracy (
            project_id, category, forecast_date, forecast_run_id,
            predicted_clicks, actual_clicks, predicted_revenue, actual_revenue,
            clicks_error, revenue_error, clicks_error_pct, revenue_error_pct
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          project_id, category, date, forecast.run_id,
          forecast.clicks_forecast, clicks,
          forecast.revenue_forecast, revenue,
          clicksError, revenueError, clicksErrorPct, revenueErrorPct
        ).run();
      }
    }

    return c.json({ success: true, message: 'Actual values recorded' });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Get forecast accuracy metrics
app.get('/api/forecast-accuracy/:projectId', async (c) => {
  try {
    const session = await getSession(c);
    if (!session) {
      return c.json({ success: false, error: 'Not authenticated' }, 401);
    }

    const projectId = c.req.param('projectId');

    // Calculate overall accuracy metrics
    const metrics = await c.env.DB.prepare(`
      SELECT
        COUNT(*) as total_comparisons,
        AVG(clicks_error_pct) as avg_clicks_error_pct,
        AVG(revenue_error_pct) as avg_revenue_error_pct,
        AVG(clicks_error) as avg_clicks_error,
        AVG(revenue_error) as avg_revenue_error,
        category
      FROM forecast_accuracy
      WHERE project_id = ?
      GROUP BY category
    `).bind(projectId).all();

    // Get recent accuracy data
    const recent = await c.env.DB.prepare(`
      SELECT *
      FROM forecast_accuracy
      WHERE project_id = ?
      ORDER BY recorded_at DESC
      LIMIT 50
    `).bind(projectId).all();

    return c.json({
      success: true,
      metrics: metrics.results,
      recent_accuracy: recent.results
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================================================
// DATA QUALITY VALIDATION
// ============================================================================

// Run data quality check
app.post('/api/data-quality-check', async (c) => {
  try {
    const session = await getSession(c);
    if (!session) {
      return c.json({ success: false, error: 'Not authenticated' }, 401);
    }

    const body = await c.req.json();
    const { project_id, historical_data } = body;

    if (!project_id || !historical_data || !Array.isArray(historical_data)) {
      return c.json({ success: false, error: 'Missing required fields' }, 400);
    }

    const issues: string[] = [];
    let missingValues = 0;
    let duplicates = 0;
    let outliers = 0;

    // Check for missing values
    for (const record of historical_data) {
      if (!record.date || record.clicks === null || record.clicks === undefined ||
          record.revenue === null || record.revenue === undefined) {
        missingValues++;
        issues.push(`Missing values in record: ${JSON.stringify(record)}`);
      }
    }

    // Check for duplicates
    const seen = new Set();
    for (const record of historical_data) {
      const key = `${record.date}-${record.category}`;
      if (seen.has(key)) {
        duplicates++;
        issues.push(`Duplicate record: ${key}`);
      }
      seen.add(key);
    }

    // Check for outliers (using simple statistical method)
    const clicksValues = historical_data.map(r => r.clicks).filter(v => v !== null);
    const revenueValues = historical_data.map(r => r.revenue).filter(v => v !== null);

    if (clicksValues.length > 0) {
      const clicksMean = clicksValues.reduce((a, b) => a + b, 0) / clicksValues.length;
      const clicksStd = Math.sqrt(clicksValues.reduce((sum, val) => sum + Math.pow(val - clicksMean, 2), 0) / clicksValues.length);

      for (const record of historical_data) {
        if (Math.abs(record.clicks - clicksMean) > 3 * clicksStd) {
          outliers++;
          issues.push(`Outlier detected in clicks: ${record.category} on ${record.date} = ${record.clicks}`);
        }
      }
    }

    const totalRecords = historical_data.length;
    const dataCompletenessPct = totalRecords > 0
      ? ((totalRecords - missingValues) / totalRecords) * 100
      : 0;

    const qualityScore = Math.max(0, 100 - (missingValues * 2) - (duplicates * 3) - (outliers * 1));

    // Save to database
    await c.env.DB.prepare(`
      INSERT INTO data_quality_checks (
        project_id, total_records, missing_values, duplicate_records,
        outliers_detected, data_completeness_pct, quality_score, issues
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      project_id, totalRecords, missingValues, duplicates,
      outliers, dataCompletenessPct, qualityScore, JSON.stringify(issues)
    ).run();

    return c.json({
      success: true,
      quality_check: {
        total_records: totalRecords,
        missing_values: missingValues,
        duplicate_records: duplicates,
        outliers_detected: outliers,
        data_completeness_pct: dataCompletenessPct.toFixed(2),
        quality_score: qualityScore.toFixed(2),
        issues: issues.slice(0, 10) // Return first 10 issues
      }
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Get data quality history
app.get('/api/data-quality/:projectId', async (c) => {
  try {
    const session = await getSession(c);
    if (!session) {
      return c.json({ success: false, error: 'Not authenticated' }, 401);
    }

    const projectId = c.req.param('projectId');

    const history = await c.env.DB.prepare(`
      SELECT *
      FROM data_quality_checks
      WHERE project_id = ?
      ORDER BY check_date DESC
      LIMIT 20
    `).bind(projectId).all();

    return c.json({
      success: true,
      quality_history: history.results
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================================================
// FORECAST ALERTS
// ============================================================================

// Create forecast alert
app.post('/api/alerts', async (c) => {
  try {
    const session = await getSession(c);
    if (!session) {
      return c.json({ success: false, error: 'Not authenticated' }, 401);
    }

    const body = await c.req.json();
    const { project_id, category, alert_type, metric, threshold_value, comparison, notification_email } = body;

    await c.env.DB.prepare(`
      INSERT INTO forecast_alerts (
        project_id, category, alert_type, metric, threshold_value, comparison, notification_email
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(project_id, category || null, alert_type, metric, threshold_value, comparison, notification_email || null).run();

    return c.json({ success: true, message: 'Alert created' });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Get alerts for project
app.get('/api/alerts/:projectId', async (c) => {
  try {
    const session = await getSession(c);
    if (!session) {
      return c.json({ success: false, error: 'Not authenticated' }, 401);
    }

    const projectId = c.req.param('projectId');

    const alerts = await c.env.DB.prepare(`
      SELECT * FROM forecast_alerts WHERE project_id = ? ORDER BY created_at DESC
    `).bind(projectId).all();

    return c.json({ success: true, alerts: alerts.results });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Delete alert
app.delete('/api/alerts/:alertId', async (c) => {
  try {
    const session = await getSession(c);
    if (!session) {
      return c.json({ success: false, error: 'Not authenticated' }, 401);
    }

    const alertId = c.req.param('alertId');

    await c.env.DB.prepare(`DELETE FROM forecast_alerts WHERE id = ?`).bind(alertId).run();

    return c.json({ success: true, message: 'Alert deleted' });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Get forecast history
app.get('/api/forecast-history/:projectId', async (c) => {
  try {
    const session = await getSession(c);
    if (!session) {
      return c.json({ success: false, error: 'Not authenticated' }, 401);
    }

    const projectId = c.req.param('projectId');

    const history = await c.env.DB.prepare(`
      SELECT id, run_at, status, forecast_data
      FROM forecast_runs
      WHERE project_id = ?
      ORDER BY run_at DESC
      LIMIT 50
    `).bind(projectId).all();

    return c.json({
      success: true,
      forecast_history: history.results.map(row => ({
        ...row,
        forecast_data: row.forecast_data ? JSON.parse(row.forecast_data as string) : null
      }))
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================================================
// CSV EXPORT
// ============================================================================

// Export forecast to CSV
app.post('/api/export-csv', async (c) => {
  try {
    const session = await getSession(c);
    if (!session) {
      return c.json({ success: false, error: 'Not authenticated' }, 401);
    }

    const body = await c.req.json();
    const { forecasts } = body;

    if (!forecasts || !Array.isArray(forecasts)) {
      return c.json({ success: false, error: 'Missing forecasts data' }, 400);
    }

    // Helper function to escape CSV values
    const escapeCsvValue = (value: string): string => {
      if (!value) return '';
      const stringValue = String(value);
      // If value contains comma, quote, or newline, wrap in quotes and escape quotes
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    // Convert forecasts to CSV
    const rows: string[][] = [['Date', 'Category', 'Clicks Forecast', 'Revenue Forecast', 'Clicks Lower', 'Clicks Upper', 'Revenue Lower', 'Revenue Upper']];

    for (const categoryForecast of forecasts) {
      for (const forecast of categoryForecast.forecasts) {
        rows.push([
          escapeCsvValue(forecast.date),
          escapeCsvValue(categoryForecast.category),
          String(forecast.clicks_forecast || 0),
          String(forecast.revenue_forecast || 0),
          String(forecast.clicks_lower || ''),
          String(forecast.clicks_upper || ''),
          String(forecast.revenue_lower || ''),
          String(forecast.revenue_upper || ''),
        ]);
      }
    }

    const csv = rows.map(row => row.join(',')).join('\n');

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="forecast_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================================================
// FORECAST SCENARIOS
// ============================================================================

// Create scenario
app.post('/api/scenarios', async (c) => {
  try {
    const session = await getSession(c);
    if (!session) {
      return c.json({ success: false, error: 'Not authenticated' }, 401);
    }

    const body = await c.req.json();
    const { project_id, name, description, parameters, is_baseline } = body;

    const scenarioId = crypto.randomUUID();

    await c.env.DB.prepare(`
      INSERT INTO forecast_scenarios (id, project_id, name, description, parameters, created_by, is_baseline)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(scenarioId, project_id, name, description || null, JSON.stringify(parameters), session.userId, is_baseline ? 1 : 0).run();

    return c.json({ success: true, scenario_id: scenarioId });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Get scenarios for project
app.get('/api/scenarios/:projectId', async (c) => {
  try {
    const session = await getSession(c);
    if (!session) {
      return c.json({ success: false, error: 'Not authenticated' }, 401);
    }

    const projectId = c.req.param('projectId');

    const scenarios = await c.env.DB.prepare(`
      SELECT s.*, u.name as created_by_name
      FROM forecast_scenarios s
      JOIN users u ON u.id = s.created_by
      WHERE s.project_id = ?
      ORDER BY s.created_at DESC
    `).bind(projectId).all();

    return c.json({
      success: true,
      scenarios: scenarios.results.map(row => ({
        ...row,
        parameters: JSON.parse(row.parameters as string)
      }))
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Delete scenario
app.delete('/api/scenarios/:scenarioId', async (c) => {
  try {
    const session = await getSession(c);
    if (!session) {
      return c.json({ success: false, error: 'Not authenticated' }, 401);
    }

    const scenarioId = c.req.param('scenarioId');

    await c.env.DB.prepare(`DELETE FROM forecast_scenarios WHERE id = ?`).bind(scenarioId).run();

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Run scenario forecast
app.post('/api/scenarios/run', async (c) => {
  try {
    const session = await getSession(c);
    if (!session) {
      return c.json({ success: false, error: 'Not authenticated' }, 401);
    }

    const body = await c.req.json();
    const { scenario_id, historical_data } = body;

    if (!scenario_id || !historical_data) {
      return c.json({ success: false, error: 'Missing required fields' }, 400);
    }

    // Get scenario parameters
    const scenario = await c.env.DB.prepare(`
      SELECT * FROM forecast_scenarios WHERE id = ?
    `).bind(scenario_id).first();

    if (!scenario) {
      return c.json({ success: false, error: 'Scenario not found' }, 404);
    }

    const parameters = JSON.parse(scenario.parameters as string);

    // Generate forecast using scenario parameters
    const forecasts = await generateMLForecast(historical_data, parameters, c.env.GCP_FORECAST_URL);

    return c.json({ success: true, forecasts });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================================================
// TEAM COLLABORATION
// ============================================================================

// Add collaborator
app.post('/api/collaborators', async (c) => {
  try {
    const session = await getSession(c);
    if (!session) {
      return c.json({ success: false, error: 'Not authenticated' }, 401);
    }

    const body = await c.req.json();
    const { project_id, user_email, role } = body;

    // Find user by email
    const user = await c.env.DB.prepare(`SELECT id FROM users WHERE email = ?`).bind(user_email).first();

    if (!user) {
      return c.json({ success: false, error: 'User not found' }, 404);
    }

    await c.env.DB.prepare(`
      INSERT INTO project_collaborators (project_id, user_id, role, invited_by)
      VALUES (?, ?, ?, ?)
    `).bind(project_id, user.id, role, session.userId).run();

    // Create notification
    await c.env.DB.prepare(`
      INSERT INTO notifications (user_id, type, title, message, data)
      VALUES (?, 'share_invite', ?, ?, ?)
    `).bind(user.id, 'Project Invitation', `You've been invited to collaborate on a project`, JSON.stringify({ project_id })).run();

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Get collaborators
app.get('/api/collaborators/:projectId', async (c) => {
  try {
    const session = await getSession(c);
    if (!session) {
      return c.json({ success: false, error: 'Not authenticated' }, 401);
    }

    const projectId = c.req.param('projectId');

    const collaborators = await c.env.DB.prepare(`
      SELECT c.*, u.name, u.email, u.picture
      FROM project_collaborators c
      JOIN users u ON u.id = c.user_id
      WHERE c.project_id = ?
      ORDER BY c.invited_at DESC
    `).bind(projectId).all();

    return c.json({ success: true, collaborators: collaborators.results });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Remove collaborator
app.delete('/api/collaborators/:collaboratorId', async (c) => {
  try {
    const session = await getSession(c);
    if (!session) {
      return c.json({ success: false, error: 'Not authenticated' }, 401);
    }

    const collaboratorId = c.req.param('collaboratorId');

    await c.env.DB.prepare(`DELETE FROM project_collaborators WHERE id = ?`).bind(collaboratorId).run();

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Add comment
app.post('/api/comments', async (c) => {
  try {
    const session = await getSession(c);
    if (!session) {
      return c.json({ success: false, error: 'Not authenticated' }, 401);
    }

    const body = await c.req.json();
    const { project_id, comment } = body;

    await c.env.DB.prepare(`
      INSERT INTO project_comments (project_id, user_id, comment)
      VALUES (?, ?, ?)
    `).bind(project_id, session.userId, comment).run();

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Get comments
app.get('/api/comments/:projectId', async (c) => {
  try {
    const session = await getSession(c);
    if (!session) {
      return c.json({ success: false, error: 'Not authenticated' }, 401);
    }

    const projectId = c.req.param('projectId');

    const comments = await c.env.DB.prepare(`
      SELECT c.*, u.name, u.picture
      FROM project_comments c
      JOIN users u ON u.id = c.user_id
      WHERE c.project_id = ?
      ORDER BY c.created_at DESC
      LIMIT 50
    `).bind(projectId).all();

    return c.json({ success: true, comments: comments.results });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================================================
// API KEYS
// ============================================================================

// Generate API key
app.post('/api/api-keys', async (c) => {
  try {
    const session = await getSession(c);
    if (!session) {
      return c.json({ success: false, error: 'Not authenticated' }, 401);
    }

    const body = await c.req.json();
    const { name, rate_limit, expires_at } = body;

    const keyId = crypto.randomUUID();
    const apiKey = `nst_${crypto.randomUUID()}${crypto.randomUUID()}`.replace(/-/g, '');

    // Hash the key (simple hash for demo, use proper crypto in production)
    const encoder = new TextEncoder();
    const data = encoder.encode(apiKey);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    await c.env.DB.prepare(`
      INSERT INTO api_keys (id, user_id, key_hash, name, rate_limit, expires_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(keyId, session.userId, keyHash, name, rate_limit || 1000, expires_at || null).run();

    return c.json({ success: true, api_key: apiKey, key_id: keyId });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// List API keys
app.get('/api/api-keys', async (c) => {
  try {
    const session = await getSession(c);
    if (!session) {
      return c.json({ success: false, error: 'Not authenticated' }, 401);
    }

    const keys = await c.env.DB.prepare(`
      SELECT id, name, last_used_at, requests_count, rate_limit, is_active, created_at, expires_at
      FROM api_keys
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).bind(session.userId).all();

    return c.json({ success: true, api_keys: keys.results });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Revoke API key
app.delete('/api/api-keys/:keyId', async (c) => {
  try {
    const session = await getSession(c);
    if (!session) {
      return c.json({ success: false, error: 'Not authenticated' }, 401);
    }

    const keyId = c.req.param('keyId');

    await c.env.DB.prepare(`
      UPDATE api_keys SET is_active = 0 WHERE id = ? AND user_id = ?
    `).bind(keyId, session.userId).run();

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================================================
// NOTIFICATIONS
// ============================================================================

// Get notifications
app.get('/api/notifications', async (c) => {
  try {
    const session = await getSession(c);
    if (!session) {
      return c.json({ success: false, error: 'Not authenticated' }, 401);
    }

    const notifications = await c.env.DB.prepare(`
      SELECT * FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `).bind(session.userId).all();

    return c.json({ success: true, notifications: notifications.results });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Mark notification as read
app.post('/api/notifications/:notificationId/read', async (c) => {
  try {
    const session = await getSession(c);
    if (!session) {
      return c.json({ success: false, error: 'Not authenticated' }, 401);
    }

    const notificationId = c.req.param('notificationId');

    await c.env.DB.prepare(`
      UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?
    `).bind(notificationId, session.userId).run();

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Mark all notifications as read
app.post('/api/notifications/mark-all-read', async (c) => {
  try {
    const session = await getSession(c);
    if (!session) {
      return c.json({ success: false, error: 'Not authenticated' }, 401);
    }

    await c.env.DB.prepare(`
      UPDATE notifications SET is_read = 1 WHERE user_id = ?
    `).bind(session.userId).run();

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Delete notification
app.delete('/api/notifications/:notificationId', async (c) => {
  try {
    const session = await getSession(c);
    if (!session) {
      return c.json({ success: false, error: 'Not authenticated' }, 401);
    }

    const notificationId = c.req.param('notificationId');

    await c.env.DB.prepare(`
      DELETE FROM notifications WHERE id = ? AND user_id = ?
    `).bind(notificationId, session.userId).run();

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Get notification settings
app.get('/api/notification-settings', async (c) => {
  try {
    const session = await getSession(c);
    if (!session) {
      return c.json({ success: false, error: 'Not authenticated' }, 401);
    }

    let settings = await c.env.DB.prepare(`
      SELECT * FROM notification_settings WHERE user_id = ?
    `).bind(session.userId).first();

    if (!settings) {
      // Create default settings
      await c.env.DB.prepare(`
        INSERT INTO notification_settings (user_id) VALUES (?)
      `).bind(session.userId).run();

      settings = await c.env.DB.prepare(`
        SELECT * FROM notification_settings WHERE user_id = ?
      `).bind(session.userId).first();
    }

    return c.json({ success: true, settings });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Update notification settings
app.patch('/api/notification-settings', async (c) => {
  try {
    const session = await getSession(c);
    if (!session) {
      return c.json({ success: false, error: 'Not authenticated' }, 401);
    }

    const body = await c.req.json();
    const { forecast_complete, alert_triggered, data_quality_issues, daily_summary, weekly_summary } = body;

    await c.env.DB.prepare(`
      UPDATE notification_settings
      SET forecast_complete = ?, alert_triggered = ?, data_quality_issues = ?, daily_summary = ?, weekly_summary = ?
      WHERE user_id = ?
    `).bind(
      forecast_complete ? 1 : 0,
      alert_triggered ? 1 : 0,
      data_quality_issues ? 1 : 0,
      daily_summary ? 1 : 0,
      weekly_summary ? 1 : 0,
      session.userId
    ).run();

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================================================
// DATA TRANSFORMATIONS
// ============================================================================

// Apply transformation
app.post('/api/transformations', async (c) => {
  try {
    const session = await getSession(c);
    if (!session) {
      return c.json({ success: false, error: 'Not authenticated' }, 401);
    }

    const body = await c.req.json();
    const { project_id, transformation_type, parameters, data } = body;

    let transformedData = [...data];

    // Apply transformation based on type
    if (transformation_type === 'log') {
      transformedData = transformedData.map(row => ({
        ...row,
        clicks: row.clicks > 0 ? Math.log(row.clicks) : 0,
        revenue: row.revenue > 0 ? Math.log(row.revenue) : 0,
      }));
    } else if (transformation_type === 'sqrt') {
      transformedData = transformedData.map(row => ({
        ...row,
        clicks: Math.sqrt(Math.abs(row.clicks)),
        revenue: Math.sqrt(Math.abs(row.revenue)),
      }));
    }

    // Save transformation
    await c.env.DB.prepare(`
      INSERT INTO data_transformations (project_id, transformation_type, parameters)
      VALUES (?, ?, ?)
    `).bind(project_id, transformation_type, JSON.stringify(parameters || {})).run();

    return c.json({ success: true, transformed_data: transformedData });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Get transformations
app.get('/api/transformations/:projectId', async (c) => {
  try {
    const session = await getSession(c);
    if (!session) {
      return c.json({ success: false, error: 'Not authenticated' }, 401);
    }

    const projectId = c.req.param('projectId');

    const transformations = await c.env.DB.prepare(`
      SELECT * FROM data_transformations
      WHERE project_id = ?
      ORDER BY applied_at DESC
      LIMIT 20
    `).bind(projectId).all();

    return c.json({ success: true, transformations: transformations.results });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================================================
// SCHEDULED FORECASTING (CRON)
// ============================================================================

// Shared function for running scheduled forecasts
async function runScheduledForecasts(env: Env) {
  console.log('Running scheduled forecasts...');

  try {
      // Get all active projects with scheduling enabled
      const { results: configs } = await env.DB.prepare(`
        SELECT p.id as project_id, p.name, p.user_id, s.*, d.*
        FROM scheduler_configs s
        JOIN projects p ON p.id = s.project_id
        JOIN data_source_configs d ON d.project_id = p.id
        WHERE s.is_active = 1 AND p.is_active = 1
      `).all();

      for (const config of configs as any[]) {
        console.log(`Processing scheduled forecast for project: ${config.name}`);

        try {
          // Step 1: Load data from saved data source
          let historicalData: any[] = [];

          if (config.source_type === 'google_sheets' && config.spreadsheet_url) {
            console.log('Loading data from Google Sheets...');
            // Get user's OAuth token
            const tokenResult = await env.DB.prepare(`
              SELECT access_token FROM users WHERE id = ?
            `).bind(config.user_id).first();

            if (!tokenResult?.access_token) {
              console.error(`No access token for user ${config.user_id}`);
              continue;
            }

            // Extract spreadsheet ID and load data
            const spreadsheetId = config.spreadsheet_url.match(/[-\w]{25,}/)?.[0];
            const sheetName = config.sheet_name || 'Sheet1';
            const range = `${sheetName}!A:D`;

            const sheetsResponse = await fetch(
              `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`,
              {
                headers: {
                  'Authorization': `Bearer ${tokenResult.access_token}`,
                },
              }
            );

            if (!sheetsResponse.ok) {
              console.error('Failed to load from Google Sheets:', await sheetsResponse.text());
              continue;
            }

            const sheetsData = await sheetsResponse.json();
            const rows = sheetsData.values || [];

            // Parse CSV-like data (skip header)
            for (let i = 1; i < rows.length; i++) {
              const row = rows[i];
              if (row.length >= 4) {
                historicalData.push({
                  date: row[0],
                  category: row[1],
                  clicks: parseFloat(row[2]) || 0,
                  revenue: parseFloat(row[3]) || 0,
                });
              }
            }

          } else if (config.source_type === 'bigquery') {
            console.log('Loading data from BigQuery...');
            // Get user's OAuth token
            const tokenResult = await env.DB.prepare(`
              SELECT access_token FROM users WHERE id = ?
            `).bind(config.user_id).first();

            if (!tokenResult?.access_token) {
              console.error(`No access token for user ${config.user_id}`);
              continue;
            }

            let query = config.query;
            if (!query && config.project_id_gcp && config.dataset_id && config.table_id) {
              query = `SELECT * FROM \`${config.project_id_gcp}.${config.dataset_id}.${config.table_id}\``;
            }

            const bqResponse = await fetch(
              `https://bigquery.googleapis.com/bigquery/v2/projects/${config.project_id_gcp}/queries`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${tokenResult.access_token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query, useLegacySql: false }),
              }
            );

            if (!bqResponse.ok) {
              console.error('Failed to load from BigQuery:', await bqResponse.text());
              continue;
            }

            const bqData = await bqResponse.json();
            const rows = bqData.rows || [];
            const fields = bqData.schema?.fields || [];

            // Map BigQuery rows to historical data format
            for (const row of rows) {
              const record: any = {};
              fields.forEach((field: any, idx: number) => {
                record[field.name] = row.f[idx].v;
              });
              historicalData.push(record);
            }
          }

          if (historicalData.length === 0) {
            console.error(`No data loaded for project ${config.name}`);
            continue;
          }

          console.log(`Loaded ${historicalData.length} records`);

          // Step 2: Generate forecast using GCP Cloud Function
          const forecastParams = JSON.parse(config.forecast_params || '{}');
          const forecastPayload = {
            historical_data: historicalData,
            params: {
              mode: forecastParams.mode || 'correlated',
              metric: forecastParams.metric || 'clicks',
              forecast_days: forecastParams.forecast_days || 14,
              p: forecastParams.p || 1,
              d: forecastParams.d || 1,
              q: forecastParams.q || 1,
              P: forecastParams.P || 1,
              D: forecastParams.D || 0,
              Q: forecastParams.Q || 1,
              s: forecastParams.s || 7,
              include_volatility: forecastParams.include_volatility !== false,
              confidence_level: forecastParams.confidence_level || 0.95,
            },
          };

          console.log('Generating forecast...');
          const forecastResponse = await fetch(`${env.GCP_FORECAST_URL}/forecast`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(forecastPayload),
          });

          if (!forecastResponse.ok) {
            console.error('Forecast generation failed:', await forecastResponse.text());
            continue;
          }

          const forecastResult = await forecastResponse.json();
          if (!forecastResult.success) {
            console.error('Forecast error:', forecastResult.error);
            continue;
          }

          console.log(`Forecast generated for ${forecastResult.forecasts.length} categories`);

          // Step 3: Push results back to Google Sheets if configured
          if (config.output_to_sheets && config.output_sheet_name && config.spreadsheet_url) {
            console.log('Pushing results to Google Sheets...');

            const tokenResult = await env.DB.prepare(`
              SELECT access_token FROM users WHERE id = ?
            `).bind(config.user_id).first();

            if (tokenResult?.access_token) {
              const spreadsheetId = config.spreadsheet_url.match(/[-\w]{25,}/)?.[0];
              const outputSheetName = config.output_sheet_name;

              // Prepare data for Sheets
              const rows: any[][] = [['Date', 'Category', 'Clicks Forecast', 'Revenue Forecast']];

              for (const categoryForecast of forecastResult.forecasts) {
                for (const forecast of categoryForecast.forecasts) {
                  rows.push([
                    forecast.date,
                    categoryForecast.category,
                    forecast.clicks_forecast || 0,
                    forecast.revenue_forecast || 0,
                  ]);
                }
              }

              // Write to Google Sheets
              const writeResponse = await fetch(
                `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${outputSheetName}!A1:D${rows.length}?valueInputOption=RAW`,
                {
                  method: 'PUT',
                  headers: {
                    'Authorization': `Bearer ${tokenResult.access_token}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ values: rows }),
                }
              );

              if (writeResponse.ok) {
                console.log(`Successfully wrote ${rows.length} rows to ${outputSheetName}`);
              } else {
                console.error('Failed to write to Sheets:', await writeResponse.text());
              }
            }
          }

          // Step 4: Save forecast results to database for history
          await env.DB.prepare(`
            INSERT INTO forecast_runs (project_id, run_at, status, forecast_data)
            VALUES (?, datetime('now'), 'completed', ?)
          `).bind(config.project_id, JSON.stringify(forecastResult.forecasts)).run();

          console.log(`✅ Scheduled forecast completed for project: ${config.name}`);

        } catch (projectError) {
          console.error(`Error processing project ${config.name}:`, projectError);

          // Log failed run
          await env.DB.prepare(`
            INSERT INTO forecast_runs (project_id, run_at, status, error_message)
            VALUES (?, datetime('now'), 'failed', ?)
          `).bind(config.project_id, String(projectError)).run();
        }
      }

    } catch (error) {
      console.error('Scheduled forecast error:', error);
      throw error;
    }
}

// Manual trigger endpoint for scheduled forecasts (for testing)
app.post('/api/trigger-scheduled-forecast', async (c) => {
  try {
    const session = await getSession(c);
    if (!session) {
      return c.json({ success: false, error: 'Not authenticated' }, 401);
    }

    // Run the scheduled forecasts
    await runScheduledForecasts(c.env);

    return c.json({
      success: true,
      message: 'Scheduled forecasts triggered successfully'
    });
  } catch (error: any) {
    console.error('Manual trigger error:', error);
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
});

export default {
  fetch: app.fetch,

  // Cron trigger for scheduled forecasting
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    console.log('Running scheduled forecast:', event.scheduledTime);
    await runScheduledForecasts(env);
  }
};
