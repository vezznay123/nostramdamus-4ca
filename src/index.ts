/**
 * Nostradamus Forecast - Cloudflare Workers
 * Main entry point
 */

import { Hono } from 'hono';
import { generateForecast, HistoricalDataPoint, ForecastParams } from './forecasting';
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
  formatForecastsForSheets
} from './google-sheets';
import {
  loadFromBigQuery,
  parseBigQueryDataToHistorical
} from './bigquery';

// Environment bindings
export interface Env {
  AI: any;
  DB: D1Database;
  R2_BUCKET: R2Bucket;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_REDIRECT_URI: string;
  JWT_SECRET: string;
}

const app = new Hono<{ Bindings: Env }>();

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
    return c.html(`
      <!DOCTYPE html>
      <html>
      <head>
        <script>
          document.cookie = 'session=${sessionToken}; path=/; max-age=86400; SameSite=Lax';
          window.location.href = '/dashboard';
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

    return c.json({
      success: true,
      data: historicalData,
      count: historicalData.length
    });

  } catch (error: any) {
    console.error('Google Sheets load error:', error);
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

    return c.json({
      success: true,
      data: historicalData,
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
// API: FORECAST
// ============================================================================

app.post('/api/forecast', async (c) => {
  try {
    const ai = c.env.AI;

    // Get request data
    const { historical_data, params } = await c.req.json<{
      historical_data: HistoricalDataPoint[];
      params?: ForecastParams;
    }>();

    if (!historical_data || !Array.isArray(historical_data)) {
      return c.json({ success: false, error: 'Invalid historical data' }, 400);
    }

    // Generate forecast using Workers AI
    const forecasts = await generateForecast(ai, historical_data, params);

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
// API: PROJECTS
// ============================================================================

app.get('/api/projects', async (c) => {
  try {
    const userId = 'default'; // TODO: Get from auth

    const { results } = await c.env.DB.prepare(`
      SELECT * FROM projects WHERE user_id = ? ORDER BY created_at DESC
    `).bind(userId).all();

    return c.json({
      success: true,
      projects: results
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.post('/api/projects', async (c) => {
  try {
    const userId = 'default'; // TODO: Get from auth
    const { name, description } = await c.req.json();

    if (!name) {
      return c.json({ success: false, error: 'Project name required' }, 400);
    }

    const projectId = `proj_${crypto.randomUUID().slice(0, 8)}`;

    await c.env.DB.prepare(`
      INSERT INTO projects (id, user_id, name, description, is_active)
      VALUES (?, ?, ?, ?, 1)
    `).bind(projectId, userId, name, description || '').run();

    return c.json({
      success: true,
      project: { id: projectId, name, description }
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

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

export default {
  fetch: app.fetch,

  // Cron trigger for scheduled forecasting
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    console.log('Running scheduled forecast:', event.scheduledTime);

    try {
      const ai = env.AI;

      // Get all active projects with scheduling enabled
      const { results: configs } = await env.DB.prepare(`
        SELECT p.id as project_id, p.name, s.*, d.*
        FROM scheduler_configs s
        JOIN projects p ON p.id = s.project_id
        JOIN data_source_configs d ON d.project_id = p.id
        WHERE s.is_active = 1 AND p.is_active = 1
      `).all();

      for (const config of configs as any[]) {
        console.log(`Processing project: ${config.name}`);

        // TODO: Load data from Google Sheets/BigQuery using saved config
        // TODO: Generate forecast with Workers AI
        // TODO: Save results back to database
        // TODO: Push results to Google Sheets if configured

        // Placeholder for now
        console.log(`Scheduled forecast completed for project ${config.name}`);
      }

    } catch (error) {
      console.error('Scheduled forecast error:', error);
    }
  }
};
