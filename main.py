"""
Nostradamus Forecasting - Google Cloud Function
Provides SARIMA forecasting with auto-tuning
"""

import json
import pandas as pd
import numpy as np
from flask import Request, jsonify
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

            "p": 1, "d": 1, "q": 1,
            "P": 1, "D": 0, "Q": 1, "s": 7,

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

        mode = params.get('mode', 'correlated')
        metric = params.get('metric', 'clicks')
        forecast_days = params.get('forecast_days', 14)
        include_volatility = params.get('include_volatility', True)
        confidence_level = params.get('confidence_level', 0.95)

        df = pd.DataFrame(historical_data)
        df['date'] = pd.to_datetime(df['date'])

        forecasts = []

        for category in df['category'].unique():
            category_data = df[df['category'] == category].sort_values('date')

            if mode == 'single':
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
    """Forecast a single metric using SARIMA"""

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

    clicks_forecast = forecast_with_sarima(
        data,
        'clicks',
        forecast_days,
        params,
        include_volatility,
        confidence_level
    )

    valid_data = data[data['clicks'] > 0]
    avg_ratio = (valid_data['revenue'] / valid_data['clicks']).mean()

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


def forecast_with_sarima(
    data: pd.DataFrame,
    metric: str,
    forecast_days: int,
    params: Dict[str, Any],
    include_volatility: bool,
    confidence_level: float
) -> List[Dict[str, Any]]:
    """Forecast using SARIMA"""

    ts = data[metric].values

    p = params.get('p', 1)
    d = params.get('d', 1)
    q = params.get('q', 1)
    P = params.get('P', 1)
    D = params.get('D', 0)
    Q = params.get('Q', 1)
    s = params.get('s', 7)

    model = SARIMAX(
        ts,
        order=(p, d, q),
        seasonal_order=(P, D, Q, s),
        enforce_stationarity=False,
        enforce_invertibility=False
    )

    fitted_model = model.fit(disp=False)

    forecast_result = fitted_model.get_forecast(steps=forecast_days)
    forecast_values = forecast_result.predicted_mean

    conf_int = forecast_result.conf_int(alpha=1-confidence_level)

    last_date = data['date'].iloc[-1]

    results = []
    for i in range(forecast_days):
        future_date = last_date + pd.Timedelta(days=i+1)

        point = {
            'date': future_date.strftime('%Y-%m-%d'),
            f'{metric}_forecast': max(0, round(float(forecast_values.iloc[i]), 2))
        }

        other_metric = 'revenue' if metric == 'clicks' else 'clicks'
        point[f'{other_metric}_forecast'] = 0

        if include_volatility:
            point[f'{metric}_lower'] = max(0, round(float(conf_int.iloc[i, 0]), 2))
            point[f'{metric}_upper'] = max(0, round(float(conf_int.iloc[i, 1]), 2))

        results.append(point)

    return results


def auto_tune_sarima(request: Request):
    """
    Auto-tune SARIMA parameters using grid search on AIC

    Accepts JSON with:
    {
        "historical_data": [...],
        "metric": "clicks" | "revenue",
        "s": 7
    }

    Returns:
    {
        "success": true,
        "best_params": {"p": 1, "d": 1, "q": 1, "P": 1, "D": 0, "Q": 1, "s": 7},
        "aic": 1234.56,
        "tested": 48
    }
    """

    if request.method == 'OPTIONS':
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '3600'
        }
        return ('', 204, headers)

    headers = {'Access-Control-Allow-Origin': '*'}

    try:
        request_json = request.get_json()

        if not request_json or 'historical_data' not in request_json:
            return jsonify({
                'success': False,
                'error': 'Missing historical_data'
            }), 400, headers

        historical_data = request_json['historical_data']
        metric = request_json.get('metric', 'clicks')
        s = request_json.get('s', 7)

        df = pd.DataFrame(historical_data)
        df['date'] = pd.to_datetime(df['date'])

        category = df['category'].unique()[0]
        category_data = df[df['category'] == category].sort_values('date')
        ts = category_data[metric].values

        p_range = range(0, 3)
        d_range = range(0, 2)
        q_range = range(0, 3)
        P_range = range(0, 2)
        D_range = range(0, 2)
        Q_range = range(0, 2)

        best_aic = float('inf')
        best_params = None
        tested = 0

        for p in p_range:
            for d in d_range:
                for q in q_range:
                    for P in P_range:
                        for D in D_range:
                            for Q in Q_range:
                                try:
                                    model = SARIMAX(
                                        ts,
                                        order=(p, d, q),
                                        seasonal_order=(P, D, Q, s),
                                        enforce_stationarity=False,
                                        enforce_invertibility=False
                                    )
                                    fitted = model.fit(disp=False, maxiter=50)
                                    tested += 1

                                    if fitted.aic < best_aic:
                                        best_aic = fitted.aic
                                        best_params = {
                                            'p': p, 'd': d, 'q': q,
                                            'P': P, 'D': D, 'Q': Q, 's': s
                                        }
                                except Exception as e:
                                    # Skip this combination if it fails
                                    continue

        if best_params is None:
            return jsonify({
                'success': False,
                'error': 'Could not find valid SARIMA parameters'
            }), 500, headers

        return jsonify({
            'success': True,
            'best_params': best_params,
            'aic': round(best_aic, 2),
            'tested': tested
        }), 200, headers

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500, headers
