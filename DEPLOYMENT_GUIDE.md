# Hybrid Forecasting Deployment Guide

## Architecture Overview

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│  React Frontend │─────▶│ Cloudflare       │─────▶│ GCP Cloud       │
│  (Pages)        │      │ Workers          │      │ Function        │
│                 │      │ - Auth           │      │ - Prophet       │
│                 │      │ - Data Loading   │      │ - SARIMA        │
│                 │      │ - D1 Database    │      │ (Python)        │
└─────────────────┘      └──────────────────┘      └─────────────────┘
```

## Step 1: Deploy GCP Cloud Function

### 1.1 Install Google Cloud SDK

If not already installed:
- Download from: https://cloud.google.com/sdk/docs/install
- Run: `gcloud init`
- Authenticate: `gcloud auth login`

### 1.2 Set Project

```bash
gcloud config set project YOUR_PROJECT_ID
```

### 1.3 Deploy Function

Navigate to the function directory:

```bash
cd C:\Users\jonat\OneDrive\Документы\Projects\forecast-gcp-function
```

Deploy:

```bash
gcloud functions deploy nostradamus-forecast \
  --runtime python311 \
  --trigger-http \
  --allow-unauthenticated \
  --entry-point forecast \
  --region us-central1 \
  --memory 512MB \
  --timeout 60s
```

### 1.4 Get the Function URL

After deployment completes, you'll see:

```
httpsTrigger:
  url: https://us-central1-YOUR_PROJECT.cloudfunctions.net/nostradamus-forecast
```

**Copy this URL** - you'll need it for Step 2.

## Step 2: Update Cloudflare Workers

### 2.1 Update wrangler.toml

Edit `C:\Users\jonat\OneDrive\Документы\Projects\forecast-workers\wrangler.toml`:

```toml
[vars]
GCP_FORECAST_URL = "https://us-central1-YOUR_PROJECT.cloudfunctions.net/nostradamus-forecast"
```

### 2.2 Deploy Workers

```bash
cd C:\Users\jonat\OneDrive\Документы\Projects\forecast-workers
npx wrangler deploy
```

## Step 3: Test the Integration

### 3.1 Test GCP Function Directly

```bash
curl -X POST https://us-central1-YOUR_PROJECT.cloudfunctions.net/nostradamus-forecast \
  -H "Content-Type: application/json" \
  -d '{
    "historical_data": [
      {"date": "2025-01-01", "category": "Test", "clicks": 1000, "revenue": 500},
      {"date": "2025-01-02", "category": "Test", "clicks": 1100, "revenue": 550}
    ],
    "params": {
      "mode": "correlated",
      "method": "prophet",
      "forecast_days": 7
    }
  }'
```

Should return:

```json
{
  "success": true,
  "forecasts": [...]
}
```

### 3.2 Test via Workers

Load data in the React app and run a forecast. Check browser console for:

```
Calling API with method: prophet
```

## Step 4: Build and Deploy React Frontend

```bash
cd C:\Users\jonat\OneDrive\Документы\Projects\forecast-react
npm run build
npx wrangler pages deploy dist --project-name=nostradamus-forecast
```

## Fallback Behavior

If the GCP Cloud Function is unavailable:
- Workers automatically fall back to Holt-Winters (pure JavaScript)
- Users see forecasts without errors
- No service interruption

## Cost Estimation

### GCP Cloud Functions

- **Memory**: 512MB
- **Average Execution**: 5-10 seconds
- **Monthly Free Tier**:
  - 2M invocations
  - 400,000 GB-seconds

**Example Usage:**
- 1,000 forecasts/month
- Average 7 seconds each
- **Cost**: ~$0 (within free tier)

### Cloudflare Workers

- **Free Tier**: 100,000 requests/day
- **Paid**: $5/month for 10M requests

## Monitoring

### View GCP Logs

```bash
gcloud functions logs read nostradamus-forecast --limit 50
```

### View GCP Metrics

```bash
gcloud functions describe nostradamus-forecast
```

### Test Performance

```bash
time curl -X POST ... # Should be < 10 seconds
```

## Troubleshooting

### Function times out

Increase timeout:

```bash
gcloud functions deploy nostradamus-forecast \
  --timeout 120s \
  ...
```

### Out of memory

Increase memory:

```bash
gcloud functions deploy nostradamus-forecast \
  --memory 1024MB \
  ...
```

### CORS errors

The function already includes CORS headers. If issues persist, check browser console for the exact error.

## Next Steps

1. Deploy GCP function
2. Get the function URL
3. Update wrangler.toml with URL
4. Deploy Workers
5. Test forecasting in the UI

The system is ready to use Prophet and SARIMA forecasting!
