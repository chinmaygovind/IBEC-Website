import requests
import time
import yfinance as yf
from flask import request, jsonify
from api import api_bp
from datetime import datetime, timedelta


# ---------------------------------------------------------------------------
# Yahoo Finance data via yfinance: /api/stock/chart/<ticker>
# Returns data in the same shape as Yahoo v8 chart endpoint so the frontend
# can parse it without changes.
# ---------------------------------------------------------------------------
@api_bp.route('/stock/chart/<ticker>')
def stock_chart(ticker):
    try:
        stock = yf.Ticker(ticker)
        interval = request.args.get('interval', '1d')

        if 'period1' in request.args and 'period2' in request.args:
            start = datetime.utcfromtimestamp(int(request.args['period1']))
            end = datetime.utcfromtimestamp(int(request.args['period2']))
            hist = stock.history(start=start, end=end, interval=interval)
        else:
            range_str = request.args.get('range', '1d')
            hist = stock.history(period=range_str, interval=interval)

        fast = stock.fast_info
        currency = getattr(fast, 'currency', 'USD') or 'USD'
        market_price = getattr(fast, 'last_price', None)

        timestamps = []
        closes = []
        adjcloses = []

        if not hist.empty:
            for idx, row in hist.iterrows():
                ts = int(idx.timestamp())
                timestamps.append(ts)
                closes.append(row.get('Close'))
                adjcloses.append(row.get('Close'))

            if market_price is None:
                market_price = closes[-1] if closes else None

        result = {
            'chart': {
                'result': [{
                    'meta': {
                        'currency': currency,
                        'symbol': ticker,
                        'regularMarketPrice': market_price,
                    },
                    'timestamp': timestamps,
                    'indicators': {
                        'quote': [{'close': closes}],
                        'adjclose': [{'adjclose': adjcloses}],
                    },
                }],
            }
        }
        return jsonify(result)

    except Exception as e:
        return jsonify({'error': str(e)}), 502


# ---------------------------------------------------------------------------
# FX rate: /api/fx/rate?from=INR          (current)
#          /api/fx/rate?from=INR&date=YYYY-MM-DD  (historical)
# Returns { "rate": <float> } where rate converts 1 unit of `from` → USD
# ---------------------------------------------------------------------------
@api_bp.route('/fx/rate')
def fx_rate():
    base = request.args.get('from', '').upper()
    date_str = request.args.get('date')

    if not base or base == 'USD':
        return jsonify({'rate': 1})

    try:
        if date_str:
            rate = _get_historical_fx(base, date_str)
        else:
            rate = _get_latest_fx(base)
        return jsonify({'rate': rate})
    except Exception as e:
        return jsonify({'error': str(e), 'rate': None}), 502


def _get_latest_fx(base):
    """Try multiple free FX sources and return the first that works."""
    errors = []

    # 1) open.er-api.com
    try:
        r = requests.get(
            f'https://open.er-api.com/v6/latest/{base}', timeout=10
        )
        r.raise_for_status()
        rate = r.json().get('rates', {}).get('USD')
        if rate and float(rate) > 0:
            return float(rate)
    except Exception as e:
        errors.append(f'open.er-api: {e}')

    # 2) fawazahmed0 CDN
    try:
        lc = base.lower()
        r = requests.get(
            f'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/{lc}.json',
            timeout=10,
        )
        r.raise_for_status()
        rate = r.json().get(lc, {}).get('usd')
        if rate and float(rate) > 0:
            return float(rate)
    except Exception as e:
        errors.append(f'fawazahmed0: {e}')

    # 3) exchangerate.host
    try:
        r = requests.get(
            'https://api.exchangerate.host/latest',
            params={'base': base, 'symbols': 'USD'},
            timeout=10,
        )
        r.raise_for_status()
        rate = r.json().get('rates', {}).get('USD')
        if rate and float(rate) > 0:
            return float(rate)
    except Exception as e:
        errors.append(f'exchangerate.host: {e}')

    raise RuntimeError(f'FX rate unavailable for {base}: {"; ".join(errors)}')


def _get_historical_fx(base, date_str):
    """Get FX rate on a specific date, walking back up to 7 days for weekends."""
    errors = []
    try:
        dt = datetime.strptime(date_str, '%Y-%m-%d')
    except ValueError:
        raise ValueError(f'Invalid date format: {date_str}')

    dates_to_try = [(dt - timedelta(days=i)).strftime('%Y-%m-%d') for i in range(8)]

    lc = base.lower()
    for d in dates_to_try:
        try:
            r = requests.get(
                f'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@{d}/v1/currencies/{lc}.json',
                timeout=10,
            )
            r.raise_for_status()
            rate = r.json().get(lc, {}).get('usd')
            if rate and float(rate) > 0:
                return float(rate)
        except Exception as e:
            errors.append(f'fawazahmed0@{d}: {e}')

    for d in dates_to_try:
        try:
            r = requests.get(
                f'https://api.exchangerate.host/{d}',
                params={'base': base, 'symbols': 'USD'},
                timeout=10,
            )
            r.raise_for_status()
            rate = r.json().get('rates', {}).get('USD')
            if rate and float(rate) > 0:
                return float(rate)
        except Exception as e:
            errors.append(f'exchangerate.host@{d}: {e}')

    raise RuntimeError(
        f'Historical FX on {date_str} unavailable for {base}: {"; ".join(errors)}'
    )


# ---------------------------------------------------------------------------
# FX timeseries: /api/fx/timeseries?base=INR&start=YYYY-MM-DD&end=YYYY-MM-DD
# Returns { "rates": { "YYYY-MM-DD": <rate_to_USD>, ... } }
# ---------------------------------------------------------------------------
@api_bp.route('/fx/timeseries')
def fx_timeseries():
    base = request.args.get('base', '').upper()
    start = request.args.get('start', '')
    end = request.args.get('end', '')

    if not base or base == 'USD':
        return jsonify({'rates': {}})

    errors = []

    # 1) exchangerate.host timeseries
    try:
        r = requests.get(
            'https://api.exchangerate.host/timeseries',
            params={
                'base': base,
                'symbols': 'USD',
                'start_date': start,
                'end_date': end,
            },
            timeout=20,
        )
        r.raise_for_status()
        raw = r.json().get('rates', {})
        rates = {}
        for d, obj in raw.items():
            v = obj.get('USD') if isinstance(obj, dict) else None
            if v is not None:
                rates[d] = float(v)
        if rates:
            return jsonify({'rates': rates})
    except Exception as e:
        errors.append(f'exchangerate.host: {e}')

    # 2) Fallback: sample weekly from fawazahmed0
    try:
        rates = _fx_timeseries_fallback(base, start, end)
        if rates:
            return jsonify({'rates': rates})
    except Exception as e:
        errors.append(f'fawazahmed0 fallback: {e}')

    return jsonify({'error': '; '.join(errors), 'rates': {}}), 502


def _fx_timeseries_fallback(base, start_str, end_str):
    """Build a sparse timeseries by sampling every 7 days from fawazahmed0."""
    lc = base.lower()
    start = datetime.strptime(start_str, '%Y-%m-%d')
    end = datetime.strptime(end_str, '%Y-%m-%d')
    rates = {}
    current = start
    while current <= end:
        d = current.strftime('%Y-%m-%d')
        try:
            r = requests.get(
                f'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@{d}/v1/currencies/{lc}.json',
                timeout=10,
            )
            r.raise_for_status()
            rate = r.json().get(lc, {}).get('usd')
            if rate:
                rates[d] = float(rate)
        except Exception:
            pass
        current += timedelta(days=7)
    d = end.strftime('%Y-%m-%d')
    if d not in rates:
        try:
            r = requests.get(
                f'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@{d}/v1/currencies/{lc}.json',
                timeout=10,
            )
            r.raise_for_status()
            rate = r.json().get(lc, {}).get('usd')
            if rate:
                rates[d] = float(rate)
        except Exception:
            pass
    return rates
