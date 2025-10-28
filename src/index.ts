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
