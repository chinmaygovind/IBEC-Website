from flask import Flask, jsonify
from flask_cors import CORS
import yfinance as yf
import pandas as pd
import os

app = Flask(__name__)
# Enable CORS so your frontend can talk to this API without security blocks
CORS(app)

# Helper function to map suffixes to Yahoo Finance FX pairs
def get_fx_pair(ticker):
    if ticker.endswith('.NS'): return 'INRUSD=X'
    if ticker.endswith('.MC'): return 'EURUSD=X'
    if ticker.endswith('.L'): return 'GBPUSD=X'
    return None

@app.route('/api', methods=['GET'])
def get_portfolio():
    try:
        # 1. Read the CSV (Going up one directory from /api, then into /build)
        csv_path = os.path.join(os.path.dirname(__file__), '..', 'build', 'trades.csv')
        df = pd.read_csv(csv_path)
        
        # Clean columns and dates
        df.columns = ['ticker', 'shares', 'purchase_date']
        df['purchase_date'] = pd.to_datetime(df['purchase_date'])
        
        # We only want active/past trades, no future trades
        today = pd.Timestamp.today().normalize()
        df = df[df['purchase_date'] <= today]
        
        # Get unique tickers and necessary FX pairs
        unique_tickers = df['ticker'].unique().tolist()
        fx_pairs = list(set([get_fx_pair(t) for t in unique_tickers if get_fx_pair(t)]))
        all_symbols = unique_tickers + fx_pairs

        # 2. Bulk Download Data (Current and last 2 years for history)
        # Using threads=True makes this incredibly fast
        data = yf.download(all_symbols, period="2y", group_by='ticker', threads=True)
        
        holdings = []
        total_market_value = 0
        total_invested = 0
        
        # Aggregate net shares per ticker (handles buys and sells)
        portfolio_summary = df.groupby('ticker').agg(
            net_shares=('shares', 'sum'),
            first_buy=('purchase_date', 'min')
        ).reset_index()

        # 3. Calculate Metrics
        for _, row in portfolio_summary.iterrows():
            ticker = row['ticker']
            shares = row['net_shares']
            
            # Skip fully sold positions
            if shares <= 0: continue
            
            # Extract ticker history
            if len(all_symbols) == 1:
                hist = data
            else:
                hist = data[ticker] if ticker in data.columns.levels[0] else None
                
            if hist is None or hist.empty: continue
            
            # Get Current Price
            current_price_local = float(hist['Close'].iloc[-1])
            
            # Get Average Purchase Price (Simplified to first buy date for this iteration)
            buy_date = row['first_buy']
            try:
                # Find the closest trading day to the purchase date
                idx = hist.index.get_indexer([buy_date], method='bfill')[0]
                purchase_price_local = float(hist['Close'].iloc[idx])
            except:
                purchase_price_local = current_price_local # Fallback
                
            # Handle FX Conversion
            fx_pair = get_fx_pair(ticker)
            fx_rate = 1.0
            if fx_pair and fx_pair in data.columns.levels[0]:
                fx_hist = data[fx_pair]
                fx_rate = float(fx_hist['Close'].iloc[-1])
                
            current_price_usd = current_price_local * fx_rate
            purchase_price_usd = purchase_price_local * fx_rate
            
            # Math
            market_value = current_price_usd * shares
            invested_amount = purchase_price_usd * shares
            pnl = market_value - invested_amount
            return_pct = (pnl / invested_amount * 100) if invested_amount > 0 else 0
            
            total_market_value += market_value
            total_invested += invested_amount
            
            holdings.append({
                "ticker": ticker,
                "shares": int(shares),
                "purchase_price": round(purchase_price_usd, 2),
                "current_price": round(current_price_usd, 2),
                "market_value": round(market_value, 2),
                "profit_loss": round(pnl, 2),
                "return_pct": round(return_pct, 2)
            })

        # 4. Final Portfolio Math
        INITIAL_CAPITAL = 100000
        cash = INITIAL_CAPITAL - total_invested
        total_portfolio_value = total_market_value + cash
        total_return_pct = ((total_portfolio_value - INITIAL_CAPITAL) / INITIAL_CAPITAL) * 100
        total_pnl = total_portfolio_value - INITIAL_CAPITAL

        response = {
            "summary": {
                "initial_capital": INITIAL_CAPITAL,
                "current_value": round(total_portfolio_value, 2),
                "total_return_pct": round(total_return_pct, 2),
                "profit_loss": round(total_pnl, 2)
            },
            "holdings": sorted(holdings, key=lambda x: x['market_value'], reverse=True)
        }
        
        return jsonify(response)
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

# Vercel needs this to boot the WSGI application
if __name__ == '__main__':
    app.run(debug=True)
