# Nostradamus Forecast - Cloudflare Workers

Retail forecasting application powered by Cloudflare Workers AI.

## Features

- 🤖 **Workers AI Forecasting** - Time series forecasting using Llama 2
- 📊 **Multi-Project Support** - Manage multiple forecast projects
- 🔄 **Scheduled Forecasting** - Automatic forecasts via cron triggers
- 💾 **D1 Database** - Serverless SQLite storage
- 🚀 **Zero Cold Starts** - Instant response at the edge
- 🔐 **OAuth 2.0** - Google authentication

## Setup Instructions

### 1. Install Dependencies

```bash
cd forecast-workers
npm install
```

### 2. Create D1 Database

```bash
wrangler d1 create nostradamus-db
```

Copy the `database_id` from the output and update `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "nostradamus-db"
database_id = "YOUR_DATABASE_ID_HERE"
```

### 3. Initialize Database Schema

```bash
wrangler d1 execute nostradamus-db --file=./schema.sql
```

### 4. Create R2 Bucket

```bash
wrangler r2 bucket create nostradamus-data
```

### 5. Set Environment Variables

Update `wrangler.toml` with your values:

```toml
[vars]
GOOGLE_CLIENT_ID = "your-google-client-id"
GOOGLE_REDIRECT_URI = "https://your-domain.com/auth/callback"
```

### 6. Set Secrets

```bash
wrangler secret put GOOGLE_CLIENT_SECRET
# Enter your Google Client Secret

wrangler secret put JWT_SECRET
# Enter a random string for JWT signing
```

### 7. Deploy

```bash
# Development
npm run dev

# Production
npm run deploy
```

## API Endpoints

### Authentication
- `GET /` - Homepage with login
- `GET /auth/google` - Initiate Google OAuth
- `GET /auth/callback` - OAuth callback

### Projects
- `GET /api/projects` - List user's projects
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Forecasting
- `POST /api/forecast` - Generate forecast

**Request:**
```json
{
  "historical_data": [
    {"date": "2025-01-01", "category": "Category A", "clicks": 1000, "revenue": 500},
    ...
  ],
  "params": {
    "mode": "volatility",
    "forecast_days": 14,
    "seasonal_weight": 0.5,
    "run_rate_weight": 0.5,
    "correlation_strength": 0.85,
    "volatility_factor": 0.7
  }
}
```

**Response:**
```json
{
  "success": true,
  "forecasts": [
    {
      "category": "Category A",
      "forecasts": [
        {"date": "2025-01-15", "clicks_forecast": 1050, "revenue_forecast": 525},
        ...
      ]
    }
  ]
}
```

### Configuration
- `POST /api/config/data-source` - Save data source configuration
- `GET /api/config/data-source` - Get saved configuration

## Scheduled Forecasting

Forecasts run automatically based on cron schedule in `wrangler.toml`:

```toml
[triggers]
crons = ["0 */6 * * *"]  # Every 6 hours
```

The scheduled worker:
1. Loads active projects from D1
2. Fetches data from configured sources
3. Generates forecasts with Workers AI
4. Saves results to D1
5. Optionally pushes to Google Sheets

## Workers AI

The forecasting uses Cloudflare Workers AI with the Llama 2 model:

- **Model**: `@cf/meta/llama-2-7b-chat-int8`
- **Task**: Time series analysis and forecasting
- **Input**: Historical click/revenue data + parameters
- **Output**: JSON forecast for next N days

### Forecast Quality

The AI is prompted to:
- Detect weekly seasonality patterns
- Identify growth/decline trends
- Maintain click-to-revenue correlation
- Apply realistic day-to-day volatility
- Weight recent data more heavily
- Smooth outliers appropriately

### Fallback Logic

If Workers AI fails or returns invalid JSON, the system falls back to simple linear extrapolation.

## Database Schema

See `schema.sql` for complete schema. Key tables:

- `users` - User accounts
- `projects` - Forecast projects
- `data_source_configs` - Google Sheets/BigQuery configs
- `oauth_tokens` - Encrypted OAuth tokens
- `forecast_configs` - Forecast parameters
- `forecast_results` - Historical forecasts
- `scheduler_configs` - Cron job settings
- `adjustments` - Manual forecast adjustments
- `activity_log` - Audit trail

## Development

### Local Development

```bash
npm run dev
```

Access at `http://localhost:8787`

### Local Database

```bash
npm run db:local
```

### View Logs

```bash
wrangler tail
```

### Test Cron Triggers

```bash
wrangler dev --test-scheduled
```

## Migration from Render

### Export Data

1. Export projects from `projects.json`
2. Export configs from `data_source_config.json`
3. Export scheduler configs

### Import to D1

Use SQL INSERT statements or create a migration script:

```typescript
// migrate.ts
import { projects } from './export/projects.json';

for (const project of projects) {
  await DB.prepare(`
    INSERT INTO projects (id, user_id, name, description)
    VALUES (?, ?, ?, ?)
  `).bind(project.id, 'user_id', project.name, project.description).run();
}
```

## Cost

With Cloudflare Workers Paid plan:

- Workers: $5/month
- D1: ~$0.50/month (100k reads, 1k writes per day)
- R2: ~$0.15/month (minimal storage)
- Workers AI: Included

**Total: ~$5.65/month**

Benefits over Render free tier:
- ✅ No cold starts
- ✅ No wake-up calls needed
- ✅ Built-in cron scheduling
- ✅ Global edge deployment
- ✅ Workers AI included

## Troubleshooting

### "Module not found" error
```bash
npm install
```

### D1 binding error
Check `wrangler.toml` has correct `database_id`

### AI timeout
Increase timeout in `wrangler.toml`:
```toml
compatibility_flags = ["nodejs_compat"]
```

### OAuth not working
1. Check GOOGLE_CLIENT_ID in wrangler.toml
2. Verify GOOGLE_CLIENT_SECRET is set
3. Ensure redirect URI matches Google Console

## Deployment Steps

### 1. Set Google OAuth Credentials

First, create OAuth 2.0 credentials in Google Cloud Console:
1. Go to https://console.cloud.google.com/apis/credentials
2. Create OAuth 2.0 Client ID
3. Add authorized redirect URI: `https://your-worker.workers.dev/auth/callback`
4. Note the Client ID and Client Secret

Update `wrangler.toml`:
```toml
[vars]
GOOGLE_CLIENT_ID = "your-client-id.apps.googleusercontent.com"
GOOGLE_REDIRECT_URI = "https://your-worker.workers.dev/auth/callback"
```

### 2. Set Secrets

```bash
# Set Google Client Secret
wrangler secret put GOOGLE_CLIENT_SECRET
# Enter your Google Client Secret when prompted

# Set JWT Secret (use a random string)
wrangler secret put JWT_SECRET
# Enter a random secure string when prompted
```

### 3. Deploy to Production

```bash
wrangler deploy
```

Your Worker will be deployed to: `https://nostradamus-forecast.workers.dev`

### 4. Enable R2 (Optional)

If you need R2 storage:
1. Go to https://dash.cloudflare.com → R2
2. Enable R2
3. Run: `wrangler r2 bucket create nostradamus-data`

## Features Implemented

✅ **Complete OAuth 2.0 Flow**
- Google authentication with automatic token refresh
- JWT session management
- Secure token storage in D1

✅ **Data Loading**
- Google Sheets integration with OAuth
- BigQuery integration with OAuth
- Auto-parsing to historical data format

✅ **Workers AI Forecasting**
- Llama 2 model for time series analysis
- Multiple forecast modes (volatility, correlated, single)
- Seasonality and trend detection
- Fallback logic if AI fails

✅ **Frontend Dashboard**
- Complete HTML/JS dashboard
- Interactive forecast charts (Plotly.js)
- Data loading UI
- Export to Google Sheets
- Download CSV results

✅ **Scheduled Forecasting**
- Cron triggers (every 6 hours)
- Automatic data loading and forecasting
- Results saved to D1

## Complete API Reference

### Authentication
- `GET /auth/google` - Initiate OAuth flow
- `GET /auth/callback` - OAuth callback
- `GET /auth/logout` - Logout
- `GET /dashboard` - Main dashboard (requires auth)

### Data Loading
- `POST /api/load-google-sheets` - Load from Sheets
  ```json
  {
    "spreadsheet_url": "https://docs.google.com/spreadsheets/d/...",
    "sheet_name": "Sheet1"
  }
  ```

- `POST /api/load-bigquery` - Load from BigQuery
  ```json
  {
    "project_id": "my-project",
    "query": "SELECT * FROM dataset.table"
  }
  ```

### Forecasting
- `POST /api/forecast` - Generate forecast
  ```json
  {
    "historical_data": [...],
    "params": {
      "mode": "volatility",
      "forecast_days": 14,
      "seasonal_weight": 0.5,
      "run_rate_weight": 0.5
    }
  }
  ```

### Export
- `POST /api/export-to-sheets` - Export forecasts
  ```json
  {
    "spreadsheet_url": "https://docs.google.com/spreadsheets/d/...",
    "sheet_name": "Forecast_Results",
    "forecasts": [...]
  }
  ```

### Projects
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `POST /api/config/data-source` - Save data source config

## Migration from Render

Your Render app has been fully replicated in Workers! To migrate:

1. Deploy Workers app (see above)
2. Update your Google OAuth redirect URI
3. Test the complete flow:
   - Login with Google
   - Load data from Sheets/BigQuery
   - Generate forecast
   - Export results
4. Once confirmed working, update any bookmarks/links

Benefits of Workers vs Render:
- ✅ No cold starts (instant response)
- ✅ No wake-up calls needed
- ✅ Built-in cron scheduling
- ✅ Global edge deployment
- ✅ Workers AI included
- ✅ More cost-effective (~$5.65/month)

## Support

For issues or questions, check the migration plan in the main repo:
`CLOUDFLARE_WORKERS_MIGRATION.md`
