"""
Nostradamus Forecasting - Google Cloud Function
Provides Prophet and SARIMA forecasting endpoints
"""

import json
import pandas as pd
import numpy as np
from flask import Request, jsonify
from prophet import Prophet
from statsmodels.tsa.statespace.sarimax import SARIMAX
from typing import List, Dict, Any
import warnings
warnings.filterwarnings('ignore')


def forecast(request: Request):
    """
    Main Cloud Function entry point

    Accepts JSON with:
    {
        "historical_data": [
            {"date": "2025-01-01", "category": "Electronics", "clicks": 1000, "revenue": 500},
            ...
        ],
        "params": {
            "mode": "single" | "correlated",
            "metric": "clicks" | "revenue",
            "forecast_days": 14,
            "method": "prophet" | "sarima",

            // SARIMA params
            "p": 1, "d": 1, "q": 1,
            "P": 1, "D": 0, "Q": 1, "s": 7,

            // Prophet params
            "seasonality_mode": "additive" | "multiplicative",
            "changepoint_prior_scale": 0.05,

            // Confidence
            "include_volatility": true,
            "confidence_level": 0.95
        }
    }

    Returns:
    {
        "success": true,
        "forecasts": [
            {
                "category": "Electronics",
                "forecasts": [
                    {
                        "date": "2025-01-15",
                        "clicks_forecast": 1050,
                        "revenue_forecast": 525,
                        "clicks_lower": 950,
                        "clicks_upper": 1150,
                        "revenue_lower": 475,
                        "revenue_upper": 575
                    },
                    ...
                ]
            }
        ]
    }
    """

    # Enable CORS
    if request.method == 'OPTIONS':
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '3600'
        }
        return ('', 204, headers)

    headers = {
        'Access-Control-Allow-Origin': '*'
    }

    try:
        request_json = request.get_json()

        if not request_json or 'historical_data' not in request_json:
            return jsonify({
                'success': False,
                'error': 'Missing historical_data'
            }), 400, headers

        historical_data = request_json['historical_data']
        params = request_json.get('params', {})

        # Extract parameters
        mode = params.get('mode', 'correlated')
        metric = params.get('metric', 'clicks')
        forecast_days = params.get('forecast_days', 14)
        method = params.get('method', 'prophet')
        include_volatility = params.get('include_volatility', True)
        confidence_level = params.get('confidence_level', 0.95)

        # Group data by category
        df = pd.DataFrame(historical_data)
        df['date'] = pd.to_datetime(df['date'])

        forecasts = []

        for category in df['category'].unique():
            category_data = df[df['category'] == category].sort_values('date')

            if mode == 'single':
                # Forecast single metric
                forecast_result = forecast_single_metric(
                    category_data,
                    metric,
                    forecast_days,
                    method,
                    params,
                    include_volatility,
                    confidence_level
                )
            else:
                # Correlated forecast (both metrics)
                forecast_result = forecast_correlated(
                    category_data,
                    forecast_days,
                    method,
                    params,
                    include_volatility,
                    confidence_level
                )

            forecasts.append({
                'category': category,
                'forecasts': forecast_result
            })

        return jsonify({
            'success': True,
            'forecasts': forecasts
        }), 200, headers

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500, headers


def forecast_single_metric(
    data: pd.DataFrame,
    metric: str,
    forecast_days: int,
    method: str,
    params: Dict[str, Any],
    include_volatility: bool,
    confidence_level: float
) -> List[Dict[str, Any]]:
    """Forecast a single metric using Prophet or SARIMA"""

    if method == 'prophet':
        return forecast_with_prophet(
            data,
            metric,
            forecast_days,
            params,
            include_volatility,
            confidence_level
        )
    else:
        return forecast_with_sarima(
            data,
            metric,
            forecast_days,
            params,
            include_volatility,
            confidence_level
        )


def forecast_correlated(
    data: pd.DataFrame,
    forecast_days: int,
    method: str,
    params: Dict[str, Any],
    include_volatility: bool,
    confidence_level: float
) -> List[Dict[str, Any]]:
    """Forecast both metrics with correlation"""

    # Forecast clicks first
    if method == 'prophet':
        clicks_forecast = forecast_with_prophet(
            data,
            'clicks',
            forecast_days,
            params,
            include_volatility,
            confidence_level
        )
    else:
        clicks_forecast = forecast_with_sarima(
            data,
            'clicks',
            forecast_days,
            params,
            include_volatility,
            confidence_level
        )

    # Calculate clicks-to-revenue ratio
    valid_data = data[data['clicks'] > 0]
    avg_ratio = (valid_data['revenue'] / valid_data['clicks']).mean()

    # Apply ratio to forecasted clicks for revenue
    result = []
    for forecast_point in clicks_forecast:
        clicks_pred = forecast_point['clicks_forecast']
        revenue_pred = clicks_pred * avg_ratio

        point = {
            'date': forecast_point['date'],
            'clicks_forecast': round(clicks_pred, 2),
            'revenue_forecast': round(revenue_pred, 2)
        }

        if include_volatility and 'clicks_lower' in forecast_point:
            point['clicks_lower'] = forecast_point['clicks_lower']
            point['clicks_upper'] = forecast_point['clicks_upper']
            point['revenue_lower'] = round(forecast_point['clicks_lower'] * avg_ratio, 2)
            point['revenue_upper'] = round(forecast_point['clicks_upper'] * avg_ratio, 2)

        result.append(point)

    return result


def forecast_with_prophet(
    data: pd.DataFrame,
    metric: str,
    forecast_days: int,
    params: Dict[str, Any],
    include_volatility: bool,
    confidence_level: float
) -> List[Dict[str, Any]]:
    """Forecast using Facebook Prophet"""

    # Prepare data for Prophet
    prophet_df = pd.DataFrame({
        'ds': data['date'],
        'y': data[metric]
    })

    # Initialize Prophet model
    seasonality_mode = params.get('seasonality_mode', 'additive')
    changepoint_prior_scale = params.get('changepoint_prior_scale', 0.05)

    model = Prophet(
        seasonality_mode=seasonality_mode,
        changepoint_prior_scale=changepoint_prior_scale,
        interval_width=confidence_level
    )

    # Fit model
    model.fit(prophet_df)

    # Make future dataframe
    future = model.make_future_dataframe(periods=forecast_days)

    # Predict
    forecast = model.predict(future)

    # Extract future predictions
    future_forecast = forecast.tail(forecast_days)

    # Format results
    results = []
    for _, row in future_forecast.iterrows():
        point = {
            'date': row['ds'].strftime('%Y-%m-%d'),
            f'{metric}_forecast': max(0, round(row['yhat'], 2))
        }

        # Add other metric as 0 for single mode
        other_metric = 'revenue' if metric == 'clicks' else 'clicks'
        point[f'{other_metric}_forecast'] = 0

        if include_volatility:
            point[f'{metric}_lower'] = max(0, round(row['yhat_lower'], 2))
            point[f'{metric}_upper'] = max(0, round(row['yhat_upper'], 2))

        results.append(point)

    return results


def forecast_with_sarima(
    data: pd.DataFrame,
    metric: str,
    forecast_days: int,
    params: Dict[str, Any],
    include_volatility: bool,
    confidence_level: float
) -> List[Dict[str, Any]]:
    """Forecast using SARIMA"""

    # Extract time series
    ts = data[metric].values

    # SARIMA parameters
    p = params.get('p', 1)
    d = params.get('d', 1)
    q = params.get('q', 1)
    P = params.get('P', 1)
    D = params.get('D', 0)
    Q = params.get('Q', 1)
    s = params.get('s', 7)

    # Fit SARIMA model
    model = SARIMAX(
        ts,
        order=(p, d, q),
        seasonal_order=(P, D, Q, s),
        enforce_stationarity=False,
        enforce_invertibility=False
    )

    fitted_model = model.fit(disp=False)

    # Forecast
    forecast_result = fitted_model.get_forecast(steps=forecast_days)
    forecast_values = forecast_result.predicted_mean

    # Get confidence intervals
    conf_int = forecast_result.conf_int(alpha=1-confidence_level)

    # Get last date
    last_date = data['date'].iloc[-1]

    # Format results
    results = []
    for i in range(forecast_days):
        future_date = last_date + pd.Timedelta(days=i+1)

        point = {
            'date': future_date.strftime('%Y-%m-%d'),
            f'{metric}_forecast': max(0, round(float(forecast_values.iloc[i]), 2))
        }

        # Add other metric as 0 for single mode
        other_metric = 'revenue' if metric == 'clicks' else 'clicks'
        point[f'{other_metric}_forecast'] = 0

        if include_volatility:
            point[f'{metric}_lower'] = max(0, round(float(conf_int.iloc[i, 0]), 2))
            point[f'{metric}_upper'] = max(0, round(float(conf_int.iloc[i, 1]), 2))

        results.append(point)

    return results
