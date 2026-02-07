from flask import Flask, jsonify, request
from flask_cors import CORS
import yfinance as yf

app = Flask(__name__)
CORS(app)  # This allows your HTML to talk to this server

@app.route('/price/<ticker>')
def get_price(ticker):
    try:
        # 1. Download the stock data
        stock = yf.Ticker(ticker)
        
        # 2. Get the latest price (fast)
        data = stock.history(period="1d")
        
        if data.empty:
            # Handle the "Tata Motors 2024" issue:
            # If no data today, try looking further back/forward or return 0
            return jsonify({"price": 0, "currency": "USD"})

        # Get the closing price
        price = data['Close'].iloc[-1]
        
        # Yahoo Finance usually returns currency in metadata, 
        # but for simplicity we assume the ticker implies it or default to USD.
        # (You can enhance this to fetch metadata if needed)
        
        return jsonify({
            "ticker": ticker,
            "price": price,
            "currency": "USD" # Simplified for this demo
        })

    except Exception as e:
        print(f"Error fetching {ticker}: {e}")
        return jsonify({"error": str(e), "price": 0}), 500

@app.route('/history/<ticker>')
def get_history(ticker):
    # Determine the start date from query params, e.g. ?start=2024-01-01
    start_date = request.args.get('start')
    end_date = request.args.get('end')
    
    try:
        stock = yf.Ticker(ticker)
        # Fetch history. If start_date is before listing, yfinance handles it gracefully.
        hist = stock.history(start=start_date, end=end_date)
        
        if hist.empty:
             return jsonify({"price": 0})
             
        # Return the first available Close price (Listing Price logic)
        first_price = hist['Close'].iloc[0]
        return jsonify({"price": first_price})
        
    except Exception as e:
        return jsonify({"error": str(e), "price": 0}), 500

if __name__ == '__main__':
    print("Starting Local Finance Server on port 5000...")
    app.run(port=5000)
