# Nostradamus Forecasting - GCP Cloud Function

This Cloud Function provides Prophet and SARIMA forecasting capabilities for the Nostradamus forecasting platform.

## Features

- **Prophet Forecasting**: Facebook's time series forecasting library
- **SARIMA Forecasting**: Seasonal ARIMA with full parameter control
- **Single & Correlated Modes**: Forecast one metric or both with correlation
- **Confidence Intervals**: Configurable confidence levels (90%, 95%, 99%)
- **CORS Enabled**: Can be called from Cloudflare Workers

## Deployment

### Prerequisites

1. Install Google Cloud SDK: https://cloud.google.com/sdk/docs/install
2. Authenticate: `gcloud auth login`
3. Set project: `gcloud config set project YOUR_PROJECT_ID`

### Deploy Command

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

### Environment Variables (Optional)

```bash
gcloud functions deploy nostradamus-forecast \
  --set-env-vars KEY=VALUE
```

## API Usage

### Endpoint

```
POST https://REGION-PROJECT_ID.cloudfunctions.net/nostradamus-forecast
```

### Request Format

```json
{
  "historical_data": [
    {
      "date": "2025-01-01",
      "category": "Electronics",
      "clicks": 1000,
      "revenue": 500
    }
  ],
  "params": {
    "mode": "correlated",
    "method": "prophet",
    "forecast_days": 14,
    "p": 1,
    "d": 1,
    "q": 1,
    "P": 1,
    "D": 0,
    "Q": 1,
    "s": 7,
    "seasonality_mode": "additive",
    "changepoint_prior_scale": 0.05,
    "include_volatility": true,
    "confidence_level": 0.95
  }
}
```

### Response Format

```json
{
  "success": true,
  "forecasts": [
    {
      "category": "Electronics",
      "forecasts": [
        {
          "date": "2025-01-15",
          "clicks_forecast": 1050.25,
          "revenue_forecast": 525.13,
          "clicks_lower": 950.00,
          "clicks_upper": 1150.50,
          "revenue_lower": 475.00,
          "revenue_upper": 575.25
        }
      ]
    }
  ]
}
```

## Parameters

### Mode
- `single`: Forecast one metric (clicks or revenue)
- `correlated`: Forecast both metrics using correlation

### Method
- `prophet`: Use Facebook Prophet (recommended for automatic seasonality detection)
- `sarima`: Use SARIMA (recommended when you know the parameters)

### SARIMA Parameters
- `p`: AR order (0-5)
- `d`: Differencing order (0-2)
- `q`: MA order (0-5)
- `P`: Seasonal AR order (0-3)
- `D`: Seasonal differencing (0-1)
- `Q`: Seasonal MA order (0-3)
- `s`: Seasonal period (7 for weekly, 30 for monthly)

### Prophet Parameters
- `seasonality_mode`: `"additive"` or `"multiplicative"`
- `changepoint_prior_scale`: 0.001 to 0.5 (flexibility of trend changes)

## Local Testing

```bash
# Install dependencies
pip install -r requirements.txt

# Run locally with Functions Framework
functions-framework --target=forecast --debug
```

Then test with:

```bash
curl -X POST http://localhost:8080 \
  -H "Content-Type: application/json" \
  -d @test_data.json
```

## Cost Optimization

- **Memory**: 512MB is sufficient for most datasets
- **Timeout**: 60s handles up to ~1000 data points
- **Cold starts**: ~2-3 seconds with Prophet, ~1-2 seconds with SARIMA
- **Pricing**: ~$0.40 per million requests (512MB, 10s avg execution)

## Monitoring

View logs:
```bash
gcloud functions logs read nostradamus-forecast --limit 50
```

View metrics:
```bash
gcloud functions describe nostradamus-forecast
```
