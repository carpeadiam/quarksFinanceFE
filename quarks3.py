from jugaad_data.nse import NSELive, stock_df
from datetime import datetime, date, timedelta
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
from datetime import datetime
from statsmodels.tsa.arima.model import ARIMA
import numpy as np
import os
import base64
from typing import List, Dict
from matplotlib import pyplot as plt
import json

# Add this class just below your imports
class PortfolioEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        return super().default(obj)


# Initialize NSELive for live data
nse = NSELive()


def get_stock_price(symbol, live=True):
    """Fetch live or historical stock price"""
    if live:
        try:
            quote = nse.stock_quote(symbol)
            print(symbol)
            return quote['priceInfo']['lastPrice']
        except Exception as e:
            print(f"Error fetching live data for {symbol}: {e}")
            return None
    else:
        try:
            today = date.today()
            df = stock_df(symbol, from_date=today, to_date=today, series="EQ")
            return df.iloc[-1]['CLOSE'] if not df.empty else None
        except Exception as e:
            print(f"Error fetching historical data for {symbol}: {e}")
            return None


def get_historical_price(symbol, date_str):
    """Fetch historical closing price for a specific date (YYYY-MM-DD format)"""
    try:
        # Convert input date to date object
        target_date = datetime.strptime(date_str, "%Y-%m-%d").date()

        # Fetch data for a range of dates (7 days before and after the target date)
        from_date = target_date - timedelta(days=7)
        to_date = target_date + timedelta(days=7)

        # Fetch historical data
        df = stock_df(symbol, from_date=from_date, to_date=to_date, series="EQ")

        if df.empty:
            print(f"No data found for {symbol} between {from_date} and {to_date}.")
            return None

        # Filter for the exact target date
        target_data = df[df['DATE'] == target_date.strftime("%Y-%m-%d")]

        if target_data.empty:
            print(f"No data found for {symbol} on {target_date}.")
            return None
        print(target_data.iloc[-1]['CLOSE'])

        return target_data.iloc[-1]['CLOSE']

    except Exception as e:
        print(f"Error fetching historical price for {symbol} on {date_str}: {e}")
        return None


class Simulation:
    def __init__(self, name, cash):
        self.name = name
        self.timestamp = datetime.now()
        self.logs = []
        self.images = []  # Store image paths
        self.portfolio = {
            'cash': cash,
            'holdings': {},
            'transactions': [],
            'performance_images': []  # Store backtest result images
        }

    def buy_stock(self, symbol, quantity, price=None, live=True):
        """Buy a stock and add it to the portfolio"""
        if price is None:
            price = get_stock_price(symbol, live=live)
            print(price)
            if price is None:
                print(f"Failed to fetch price for {symbol}. Transaction aborted.")
                self.logs.append(f"Failed to fetch price for {symbol}. Transaction aborted.")
                return

        cost = price * quantity
        if self.portfolio['cash'] >= cost:
            self.portfolio['cash'] -= cost
            if symbol in self.portfolio['holdings']:
                # Update average price and quantity
                total_qty = self.portfolio['holdings'][symbol]['quantity'] + quantity
                total_invested = self.portfolio['holdings'][symbol]['avg_price'] * self.portfolio['holdings'][symbol][
                    'quantity'] + cost
                self.portfolio['holdings'][symbol]['quantity'] = total_qty
                self.portfolio['holdings'][symbol]['avg_price'] = total_invested / total_qty
            else:
                self.portfolio['holdings'][symbol] = {'quantity': quantity, 'avg_price': price}

            # Record transaction
            self.portfolio['transactions'].append({
                'type': 'BUY',
                'symbol': symbol,
                'quantity': quantity,
                'price': price,
                'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            })
            print(f"Bought {quantity} shares of {symbol} at {price:.2f}")
            self.logs.append(f"Bought {quantity} shares of {symbol} at {price:.2f}")
        else:
            print(f"Insufficient cash to buy {quantity} shares of {symbol}.")
            self.logs.append(f"Insufficient cash to buy {quantity} shares of {symbol}.")

    def sell_stock(self, symbol, quantity, price=None, live=True):
        """Sell a stock and update the portfolio"""
        if symbol not in self.portfolio['holdings']:
            print(f"{symbol} not in portfolio.")
            self.logs.append(f"{symbol} not in portfolio.")
            return

        if self.portfolio['holdings'][symbol]['quantity'] < quantity:
            print(f"Not enough {symbol} shares to sell.")
            self.logs.append(f"Not enough {symbol} shares to sell.")
            return

        if price is None:
            price = get_stock_price(symbol, live)
            if price is None:
                print(f"Failed to fetch price for {symbol}. Transaction aborted.")
                self.logs.append(f"Failed to fetch price for {symbol}. Transaction aborted.")
                return

        # Calculate profit/loss
        pl = (price - self.portfolio['holdings'][symbol]['avg_price']) * quantity
        self.portfolio['cash'] += price * quantity
        self.portfolio['holdings'][symbol]['quantity'] -= quantity

        # Record transaction
        self.portfolio['transactions'].append({
            'type': 'SELL',
            'symbol': symbol,
            'quantity': quantity,
            'price': price,
            'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'pl': pl
        })
        print(f"Sold {quantity} shares of {symbol} at {price:.2f}")
        self.logs.append(f"Sold {quantity} shares of {symbol} at {price:.2f}")
        print(f"Profit/Loss: {pl:.2f}")
        self.logs.append(f"Profit/Loss: {pl:.2f}")

        # Remove stock if fully sold
        if self.portfolio['holdings'][symbol]['quantity'] == 0:
            del self.portfolio['holdings'][symbol]

    def add_historical_transaction(self, symbol, quantity, transaction_type, timestamp):
        """Add historical transaction with automatic price detection"""
        try:
            # Extract date from timestamp
            transaction_date = datetime.strptime(timestamp, "%Y-%m-%d %H:%M:%S").strftime("%Y-%m-%d")
            price = get_historical_price(symbol, transaction_date)

            if price is None:
                print(f"Transaction failed: Could not find price for {symbol} on {transaction_date}")
                self.logs.append(f"Transaction failed: Could not find price for {symbol} on {transaction_date}")
                return

            if transaction_type.upper() == 'BUY':
                # Historical buy transaction
                if self.portfolio['cash'] >= price * quantity:
                    if symbol in self.portfolio['holdings']:
                        # Update average price
                        total_qty = self.portfolio['holdings'][symbol]['quantity'] + quantity
                        total_invested = (self.portfolio['holdings'][symbol]['avg_price'] *
                                          self.portfolio['holdings'][symbol]['quantity'] +
                                          price * quantity)
                        self.portfolio['holdings'][symbol]['quantity'] = total_qty
                        self.portfolio['holdings'][symbol]['avg_price'] = total_invested / total_qty
                    else:
                        self.portfolio['holdings'][symbol] = {
                            'quantity': quantity,
                            'avg_price': price
                        }

                    self.portfolio['cash'] -= price * quantity
                    self.portfolio['transactions'].append({
                        'type': 'BUY',
                        'symbol': symbol,
                        'quantity': quantity,
                        'price': price,
                        'timestamp': timestamp
                    })
                    print(f"Added historical BUY: {quantity} {symbol} @ {price:.2f} on {transaction_date}")
                    self.logs.append(f"Added historical BUY: {quantity} {symbol} @ {price:.2f} on {transaction_date}")
                else:
                    print(f"Historical BUY failed: Insufficient cash on {transaction_date}")
                    self.logs.append(f"Historical BUY failed: Insufficient cash on {transaction_date}")

            elif transaction_type.upper() == 'SELL':
                # Historical sell transaction
                if symbol not in self.portfolio['holdings']:
                    print(f"Historical SELL failed: {symbol} not in portfolio on {transaction_date}")
                    self.logs.append(f"Historical SELL failed: {symbol} not in portfolio on {transaction_date}")
                    return

                if self.portfolio['holdings'][symbol]['quantity'] < quantity:
                    print(f"Historical SELL failed: Not enough {symbol} shares on {transaction_date}")
                    self.logs.append(f"Historical SELL failed: Not enough {symbol} shares on {transaction_date}")
                    return

                pl = (price - self.portfolio['holdings'][symbol]['avg_price']) * quantity
                self.portfolio['cash'] += price * quantity
                self.portfolio['holdings'][symbol]['quantity'] -= quantity

                if self.portfolio['holdings'][symbol]['quantity'] == 0:
                    del self.portfolio['holdings'][symbol]

                self.portfolio['transactions'].append({
                    'type': 'SELL',
                    'symbol': symbol,
                    'quantity': quantity,
                    'price': price,
                    'timestamp': timestamp,
                    'pl': pl
                })
                print(f"Added historical SELL: {quantity} {symbol} @ {price:.2f} on {transaction_date}")
                self.logs.append(f"Added historical SELL: {quantity} {symbol} @ {price:.2f} on {transaction_date}")
                print(f"Historical P/L for this transaction: {pl:.2f}")
                self.logs.append(f"Historical P/L for this transaction: {pl:.2f}")

            else:
                print("Invalid transaction type. Use 'BUY' or 'SELL'")
                self.logs.append("Invalid transaction type. Use 'BUY' or 'SELL'")

        except Exception as e:
            print(f"Error processing historical transaction: {str(e)}")
            self.logs.append(f"Error processing historical transaction: {str(e)}")

    def view_portfolio(self):
        """Display portfolio with current valuations"""
        if not self.portfolio['holdings']:
            print("Portfolio is empty.")
            print("LOGS:", self.logs)
            self.logs.append("Portfolio is empty.")
            return

        total_invested = 0
        total_current = 0
        report = []

        for symbol, data in self.portfolio['holdings'].items():
            current_price = nse.stock_quote(symbol)['priceInfo']['lastPrice']
            invested = data['avg_price'] * data['quantity']
            current_value = current_price * data['quantity']
            pl = current_value - invested

            report.append({
                'Symbol': symbol,
                'Quantity': data['quantity'],
                'Avg Price': data['avg_price'],
                'Current Price': current_price,
                'Invested': invested,
                'Current Value': current_value,
                'P/L': pl
            })

            total_invested += invested
            total_current += current_value

        df = pd.DataFrame(report)
        print("\nPortfolio Summary:")
        self.logs.append("\nPortfolio Summary:")
        print(df.to_string(index=False))
        self.logs.append(df.to_string(index=False))
        print(f"\nTotal Invested: {total_invested:.2f}")
        self.logs.append(f"\nTotal Invested: {total_invested:.2f}")
        print(f"Current Value: {total_current:.2f}")
        self.logs.append(f"Current Value: {total_current:.2f}")
        print(f"Net Profit/Loss: {total_current - total_invested:.2f}")
        self.logs.append(f"Net Profit/Loss: {total_current - total_invested:.2f}")
        print(f"Cash Balance: {self.portfolio['cash']:.2f}")
        self.logs.append(f"Cash Balance: {self.portfolio['cash']:.2f}")
        print("\n\nLOGS:", self.logs)

    def buy_and_hold(self, symbol, initial_investment, start_date):
        price = get_historical_price(symbol, start_date)
        if price:
            quantity = initial_investment // price
            self.add_historical_transaction(symbol, quantity, "BUY", f"{start_date} 09:15:00")

    def momentum_strategy(self, symbol, current_date, lookback_days=14, threshold=0.05):
        # Convert current_date to datetime.date if it's a datetime.datetime object
        if isinstance(current_date, datetime):
            current_date = current_date.date()

        # Calculate start and end dates for historical data
        end_date = current_date
        start_date = end_date - timedelta(days=lookback_days * 4)  # Get more data for better analysis

        # Fetch historical data
        df = stock_df(symbol, from_date=start_date, to_date=end_date, series="EQ")
        if len(df) < lookback_days * 2:
            return

        # Calculate multiple timeframe returns
        df['returns_short'] = df['CLOSE'].pct_change(lookback_days)
        df['returns_medium'] = df['CLOSE'].pct_change(lookback_days * 2)
        df['returns_long'] = df['CLOSE'].pct_change(lookback_days * 3)
        
        # Calculate moving averages for trend confirmation
        df['SMA20'] = df['CLOSE'].rolling(window=20).mean()
        
        # Calculate volume indicators
        df['volume_sma'] = df['VOLUME'].rolling(window=lookback_days).mean()
        df['volume_ratio'] = df['VOLUME'] / df['volume_sma']
        
        # Calculate volatility
        df['volatility'] = df['CLOSE'].rolling(window=lookback_days).std() / df['CLOSE'].rolling(window=lookback_days).mean()
        
        # Determine if trend is up
        trend_is_up = df['CLOSE'].iloc[-1] > df['CLOSE'].iloc[-5]  # Price higher than 5 days ago
        
        # Adaptive threshold based on market volatility
        adaptive_threshold = threshold * (1 + df['volatility'].iloc[-1])
        
        # Calculate momentum score (weighted average of returns)
        df['momentum_score'] = (df['returns_short'] * 0.5 + 
                            df['returns_medium'] * 0.3 + 
                            df['returns_long'] * 0.2)
        
        current_momentum = df['momentum_score'].iloc[-1]
        current_volume_ratio = df['volume_ratio'].iloc[-1]
        current_price = df['CLOSE'].iloc[-1]
        if any([
            # Condition 1: Strong momentum with decent volume
            current_momentum > adaptive_threshold and current_volume_ratio > 1.0,
            
            # Condition 2: Very strong momentum even without volume confirmation
            current_momentum > adaptive_threshold * 1.5,
            
            # Condition 3: Positive momentum with strong uptrend
            current_momentum > 0 and trend_is_up and df['CLOSE'].iloc[-1] > df['SMA20'].iloc[-1]
        ]):
            # Calculate position size based on strength of signal
            position_size = 0.05  # Base position size: 5% of portfolio
            
            # Increase position for stronger signals
            if current_momentum > adaptive_threshold * 2:
                position_size = 0.08  # Stronger signal: 8% of portfolio
                
            # Reduce position in high volatility
            if df['volatility'].iloc[-1] > df['volatility'].rolling(window=lookback_days).mean().iloc[-1] * 1.2:
                position_size *= 0.7  # Reduce by 30% in high volatility
                
            quantity = max(1, int(self.portfolio['cash'] * position_size / current_price))
            print(f"BUY SIGNAL: Purchasing {quantity} shares of {symbol}")
            self.add_historical_transaction(symbol, quantity, "BUY", f"{current_date} 09:15:00")

        # SELL SIGNALS
        elif any([
            # Condition 1: Strong negative momentum with volume confirmation
            current_momentum < -adaptive_threshold and current_volume_ratio > 1.0,
            
            # Condition 2: Very strong negative momentum
            current_momentum < -adaptive_threshold * 1.5,
            
            # Condition 3: Price below short-term moving average with negative momentum
            current_momentum < 0 and df['CLOSE'].iloc[-1] < df['SMA20'].iloc[-1] and not trend_is_up
        ]):
            if symbol in self.portfolio['holdings']:
                print(f"SELL SIGNAL: Selling all shares of {symbol}")
                self.add_historical_transaction(symbol, self.portfolio['holdings'][symbol]['quantity'], "SELL",
                                            f"{current_date} 09:15:00")
        
        # Profit taking and stop-loss logic - more adaptive
        elif symbol in self.portfolio['holdings']:
            avg_price = self.portfolio['holdings'][symbol]['avg_price']
            profit_pct = (current_price - avg_price) / avg_price
            
            # Adaptive profit taking based on volatility
            profit_target = max(0.12, 0.10 * (1 + df['volatility'].iloc[-1]))  # Min 12% profit target
            
            # Adaptive stop-loss based on volatility
            stop_loss = min(-0.05, -0.04 * (1 + df['volatility'].iloc[-1]))  # Max 5% loss
            
            # Take profits at target or cut losses at stop-loss
            if profit_pct > profit_target or profit_pct < stop_loss:
                print(f"{'PROFIT TAKING' if profit_pct > 0 else 'STOP LOSS'}: Selling {symbol} at {profit_pct:.2%}")
                self.add_historical_transaction(symbol, self.portfolio['holdings'][symbol]['quantity'], "SELL",
                                            f"{current_date} 09:15:00")
            
            # Partial profit taking at smaller gains
            elif profit_pct > profit_target * 0.7 and current_momentum < 0:
                # Take partial profits if momentum is weakening
                sell_quantity = max(1, self.portfolio['holdings'][symbol]['quantity'] // 2)
                print(f"PARTIAL PROFIT TAKING: Selling {sell_quantity} shares of {symbol} at {profit_pct:.2%}")
                self.add_historical_transaction(symbol, sell_quantity, "SELL", f"{current_date} 09:15:00")

    def bollinger_bands_strategy(self, symbol, current_date, window=20, num_std=2):
        # Get historical data
        # end_date = date.today()
        end_date = current_date
        start_date = end_date - timedelta(days=window * 2)
        df = stock_df(symbol, from_date=start_date, to_date=end_date, series="EQ")

        if len(df) < window:
            return
        
        df['MA'] = df['CLOSE'].rolling(window=window).mean()
        df['STD'] = df['CLOSE'].rolling(window=window).std()
        df['Upper'] = df['MA'] + (df['STD'] * num_std)
        df['Lower'] = df['MA'] - (df['STD'] * num_std)

        df['BB_Width'] = (df['Upper'] - df['Lower']) / df['MA']
        df['%B'] = (df['CLOSE'] - df['Lower']) / (df['Upper'] - df['Lower'])
        
        # Calculate RSI for confirmation
        delta = df['CLOSE'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        rs = gain / loss
        df['RSI'] = 100 - (100 / (1 + rs))
        
        current_price = df['CLOSE'].iloc[-1]
        prev_price = df['CLOSE'].iloc[-2]
        
        # Enhanced decision logic
        if current_price < df['Lower'].iloc[-1] and df['RSI'].iloc[-1] < 30:
            # Strong buy signal: price below lower band and oversold RSI
            quantity = max(1, int(self.portfolio['cash'] * 0.05 / current_price))  # Use 5% of cash
            self.add_historical_transaction(symbol, quantity, "BUY", f"{current_date} 09:15:00")
            
        elif current_price > df['Upper'].iloc[-1] and df['RSI'].iloc[-1] > 70:
            # Strong sell signal: price above upper band and overbought RSI
            if symbol in self.portfolio['holdings']:
                self.add_historical_transaction(symbol, self.portfolio['holdings'][symbol]['quantity'], "SELL", 
                                            f"{current_date} 09:15:00")
        
        # Mean reversion opportunity
        elif df['%B'].iloc[-1] < 0.1 and df['%B'].iloc[-2] < df['%B'].iloc[-1] and df['BB_Width'].iloc[-1] > df['BB_Width'].rolling(window=20).mean().iloc[-1]:
            # Price near lower band, starting to move up, and volatility is high
            quantity = max(1, int(self.portfolio['cash'] * 0.03 / current_price))  # Use 3% of cash
            self.add_historical_transaction(symbol, quantity, "BUY", f"{current_date} 09:15:00")
        
        # Take profit on strength
        elif df['%B'].iloc[-1] > 0.9 and df['%B'].iloc[-2] > df['%B'].iloc[-1]:
            # Price near upper band and starting to turn down
            if symbol in self.portfolio['holdings']:
                # Sell half position to lock in profits
                sell_quantity = max(1, self.portfolio['holdings'][symbol]['quantity'] // 2)
                self.add_historical_transaction(symbol, sell_quantity, "SELL", f"{current_date} 09:15:00")

    def moving_average_crossover(self, symbol, start_date, short_window=50, long_window=200):
        # Get historical data
        end_date = start_date
        start_date = end_date - timedelta(days=long_window * 2)
        df = stock_df(symbol, from_date=start_date, to_date=end_date, series="EQ")
        # Debugging: Check DataFrame
        if df.empty or 'CLOSE' not in df.columns:
            print(f"Error: No 'CLOSE' column found or DataFrame is empty for {symbol}")
            return

        if not isinstance(short_window, int) or not isinstance(long_window,
                                                               int) or short_window <= 0 or long_window <= 0:
            print(f"Error: Invalid window sizes -> short_window: {short_window}, long_window: {long_window}")
            return

        if len(df) < long_window:
            print(f"Not enough data for {symbol}. Required: {long_window}, Available: {len(df)}")
            return

        # Ensure 'CLOSE' is numeric
        df['CLOSE'] = pd.to_numeric(df['CLOSE'], errors='coerce')

        # Calculate MAs
        df['SMA20'] = df['CLOSE'].rolling(window=20).mean()
        df['SMA50'] = df['CLOSE'].rolling(window=short_window).mean()
        df['SMA200'] = df['CLOSE'].rolling(window=long_window).mean()

        df['EMA20'] = df['CLOSE'].ewm(span=20, adjust=False).mean()
        df['EMA50'] = df['CLOSE'].ewm(span=short_window, adjust=False).mean()
        
        # Calculate MACD
        df['MACD'] = df['EMA20'] - df['EMA50']
        df['MACD_Signal'] = df['MACD'].ewm(span=9, adjust=False).mean()
        df['MACD_Hist'] = df['MACD'] - df['MACD_Signal']
        
        # Calculate volume indicators
        df['Volume_SMA'] = df['VOLUME'].rolling(window=20).mean()

        # Ensure enough non-null values exist
        if df[['SMA50', 'SMA200']].isnull().all().iloc[-1]:
            print(f"Insufficient data to compute moving averages for {symbol}")
            return

        # Generate signals
        if (df['SMA50'].iloc[-2] < df['SMA200'].iloc[-2] and df['SMA50'].iloc[-1] > df['SMA200'].iloc[-1] and
            df['MACD_Hist'].iloc[-1] > 0 and df['VOLUME'].iloc[-1] > df['Volume_SMA'].iloc[-1]):
            
            print(f"Strong Golden Cross detected: Buying {symbol}")
            position_size = 0.1  # 10% of portfolio
            quantity = max(1, int(self.portfolio['cash'] * position_size / df['CLOSE'].iloc[-1]))
            self.buy_stock(symbol, quantity, live=True)

        # Death Cross with confirmation
        elif (df['SMA50'].iloc[-2] > df['SMA200'].iloc[-2] and df['SMA50'].iloc[-1] < df['SMA200'].iloc[-1] and
            df['MACD_Hist'].iloc[-1] < 0 and df['VOLUME'].iloc[-1] > df['Volume_SMA'].iloc[-1]):
            
            print(f"Strong Death Cross detected: Selling {symbol}")
            if symbol in self.portfolio['holdings']:
                self.sell_stock(symbol, self.portfolio['holdings'][symbol]['quantity'], live=True)
        
        # Additional buy signal: Price above all MAs with increasing MACD
        elif (df['CLOSE'].iloc[-1] > df['SMA20'].iloc[-1] > df['SMA50'].iloc[-1] and
            df['MACD_Hist'].iloc[-1] > df['MACD_Hist'].iloc[-2] > 0):
            
            print(f"Strong uptrend detected: Adding to position in {symbol}")
            position_size = 0.05  # 5% of portfolio
            quantity = max(1, int(self.portfolio['cash'] * position_size / df['CLOSE'].iloc[-1]))
            self.buy_stock(symbol, quantity, live=True)
        
        # Take profit when price is extended above MAs
        elif (symbol in self.portfolio['holdings'] and
            df['CLOSE'].iloc[-1] > df['SMA20'].iloc[-1] * 1.1 and  # Price 10% above 20-day MA
            df['MACD_Hist'].iloc[-1] < df['MACD_Hist'].iloc[-2]):  # MACD histogram decreasing
            
            print(f"Taking profits on extended move: Selling portion of {symbol}")
            sell_quantity = max(1, self.portfolio['holdings'][symbol]['quantity'] // 3)  # Sell 1/3 of position
            self.sell_stock(symbol, sell_quantity, live=True)
    def adaptive_multi_strategy(self, symbol, current_date):
        """
        Highly optimized adaptive strategy with dynamic parameters and advanced market regime detection
        for maximum returns across different market conditions.
        """
        # Convert current_date to datetime.date if it's a datetime.datetime object
        if isinstance(current_date, datetime):
            current_date = current_date.date()
            
        # Get historical data (200 trading days ~ 10 months)
        end_date = current_date
        start_date = end_date - timedelta(days=250)
        df = stock_df(symbol, from_date=start_date, to_date=end_date, series="EQ")
        
        if len(df) < 30:  # Need at least 30 days of data
            print(f"Insufficient data for {symbol}")
            return
            
        # Ensure data is properly formatted
        df['CLOSE'] = pd.to_numeric(df['CLOSE'], errors='coerce')
        df['VOLUME'] = pd.to_numeric(df['VOLUME'], errors='coerce')
        
        # Print debug info
        print(f"Date: {current_date}, Symbol: {symbol}")
        
        # OPTIMIZATION 1: Dynamic parameter selection based on stock volatility
        # Calculate historical volatility to determine appropriate parameters
        hist_volatility = df['CLOSE'].pct_change().rolling(window=20).std() * np.sqrt(252)  # Annualized
        current_volatility = hist_volatility.iloc[-1]
        
        # Adjust parameters based on volatility
        if current_volatility > 0.4:  # High volatility
            ma_short = 3
            ma_medium = 8
            ma_long = 15
            rsi_period = 5
            bb_period = 8
            atr_period = 5
            profit_take_pct = 0.04  # 4%
            stop_loss_pct = 0.03    # 3%
            print(f"High volatility mode: {current_volatility:.2f}")
        elif current_volatility > 0.25:  # Medium volatility
            ma_short = 5
            ma_medium = 10
            ma_long = 20
            rsi_period = 7
            bb_period = 10
            atr_period = 7
            profit_take_pct = 0.05  # 5%
            stop_loss_pct = 0.04    # 4%
            print(f"Medium volatility mode: {current_volatility:.2f}")
        else:  # Low volatility
            ma_short = 8
            ma_medium = 15
            ma_long = 30
            rsi_period = 10
            bb_period = 15
            atr_period = 10
            profit_take_pct = 0.07  # 7%
            stop_loss_pct = 0.05    # 5%
            print(f"Low volatility mode: {current_volatility:.2f}")
        
        # 1. Calculate trend indicators with dynamic parameters
        # Moving averages
        df[f'SMA{ma_short}'] = df['CLOSE'].rolling(window=ma_short).mean()
        df[f'SMA{ma_medium}'] = df['CLOSE'].rolling(window=ma_medium).mean()
        df[f'SMA{ma_long}'] = df['CLOSE'].rolling(window=ma_long).mean()
        df[f'EMA{ma_short}'] = df['CLOSE'].ewm(span=ma_short, adjust=False).mean()
        df[f'EMA{ma_medium}'] = df['CLOSE'].ewm(span=ma_medium, adjust=False).mean()
        
        # MACD with dynamic settings
        df['MACD'] = df['CLOSE'].ewm(span=ma_short, adjust=False).mean() - df['CLOSE'].ewm(span=ma_long, adjust=False).mean()
        df['MACD_Signal'] = df['MACD'].ewm(span=ma_medium//2, adjust=False).mean()
        df['MACD_Hist'] = df['MACD'] - df['MACD_Signal']
        
        # 2. Calculate volatility indicators
        # Bollinger Bands with dynamic settings
        df['BB_Middle'] = df[f'SMA{bb_period}']
        df['BB_Std'] = df['CLOSE'].rolling(window=bb_period).std()
        df['BB_Upper'] = df['BB_Middle'] + (df['BB_Std'] * 1.8)
        df['BB_Lower'] = df['BB_Middle'] - (df['BB_Std'] * 1.8)
        df['BB_Width'] = (df['BB_Upper'] - df['BB_Lower']) / df['BB_Middle']
        df['%B'] = (df['CLOSE'] - df['BB_Lower']) / (df['BB_Upper'] - df['BB_Lower'])
        
        # ATR (Average True Range) with dynamic period
        df['H-L'] = df['HIGH'] - df['LOW']
        df['H-PC'] = abs(df['HIGH'] - df['CLOSE'].shift(1))
        df['L-PC'] = abs(df['LOW'] - df['CLOSE'].shift(1))
        df['TR'] = df[['H-L', 'H-PC', 'L-PC']].max(axis=1)
        df['ATR'] = df['TR'].rolling(window=atr_period).mean()
        df['ATR_Pct'] = df['ATR'] / df['CLOSE']
        
        # 3. Calculate momentum indicators with dynamic settings
        # RSI with dynamic period
        delta = df['CLOSE'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=rsi_period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=rsi_period).mean()
        rs = gain / loss
        df['RSI'] = 100 - (100 / (1 + rs))
        
        # Stochastic Oscillator - dynamic
        df[f'{rsi_period}-high'] = df['HIGH'].rolling(rsi_period).max()
        df[f'{rsi_period}-low'] = df['LOW'].rolling(rsi_period).min()
        df['%K'] = (df['CLOSE'] - df[f'{rsi_period}-low']) * 100 / (df[f'{rsi_period}-high'] - df[f'{rsi_period}-low'])
        df['%D'] = df['%K'].rolling(3).mean()
        
        # 4. Volume indicators
        df[f'Volume_SMA{ma_medium}'] = df['VOLUME'].rolling(window=ma_medium).mean()
        df['Volume_Ratio'] = df['VOLUME'] / df[f'Volume_SMA{ma_medium}']
        
        # On-Balance Volume (OBV)
        df['OBV'] = (np.sign(df['CLOSE'].diff()) * df['VOLUME']).fillna(0).cumsum()
        df['OBV_SMA'] = df['OBV'].rolling(window=ma_medium).mean()
        
        # OPTIMIZATION 2: Advanced market regime detection
        # Calculate ADX with dynamic period
        df['ADX'] = self._calculate_adx(df, period=ma_medium)
        
        # Calculate rate of change for ADX to detect regime transitions
        df['ADX_ROC'] = df['ADX'].pct_change(5)
        
        # More sophisticated market regime classification
        is_strong_trend = df['ADX'].iloc[-1] > 15
        is_weak_trend = (df['ADX'].iloc[-1] > 10) & (df['ADX'].iloc[-1] <= 15)
        is_ranging = df['ADX'].iloc[-1] <= 10
        is_regime_transition = abs(df['ADX_ROC'].iloc[-1]) > 0.1  # Significant ADX change
        
        # Determine trend direction with multiple confirmations
        is_uptrend = (df['CLOSE'].iloc[-1] > df[f'SMA{ma_medium}'].iloc[-1]) and \
                    (df[f'SMA{ma_short}'].iloc[-1] > df[f'SMA{ma_medium}'].iloc[-1])
        is_downtrend = (df['CLOSE'].iloc[-1] < df[f'SMA{ma_medium}'].iloc[-1]) and \
                    (df[f'SMA{ma_short}'].iloc[-1] < df[f'SMA{ma_medium}'].iloc[-1])
        
        # Print market regime
        print(f"ADX: {df['ADX'].iloc[-1]:.2f}, Market Regime: {'Strong Trend' if is_strong_trend else 'Weak Trend' if is_weak_trend else 'Ranging'}")
        print(f"Trend Direction: {'Uptrend' if is_uptrend else 'Downtrend' if is_downtrend else 'Neutral'}")
        if is_regime_transition:
            print(f"REGIME TRANSITION DETECTED: ADX ROC = {df['ADX_ROC'].iloc[-1]:.2f}")
        
        # OPTIMIZATION 3: Enhanced scoring system with dynamic weights
        # Adjust weights based on market regime
        if is_strong_trend:
            trend_weight = 0.5
            momentum_weight = 0.3
            volatility_weight = 0.05
            volume_weight = 0.15
        elif is_ranging:
            trend_weight = 0.2
            momentum_weight = 0.2
            volatility_weight = 0.4
            volume_weight = 0.2
        else:  # Weak trend
            trend_weight = 0.35
            momentum_weight = 0.35
            volatility_weight = 0.15
            volume_weight = 0.15
        
        # Initialize score components
        trend_score = 0
        momentum_score = 0
        volatility_score = 0
        volume_score = 0
        
        # Trend component - dynamic scoring
        if df['CLOSE'].iloc[-1] > df[f'SMA{ma_long}'].iloc[-1]:
            trend_score += 10
        if df['CLOSE'].iloc[-1] > df[f'SMA{ma_medium}'].iloc[-1]:
            trend_score += 10
        if df['CLOSE'].iloc[-1] > df[f'SMA{ma_short}'].iloc[-1]:
            trend_score += 10
        if df[f'EMA{ma_short}'].iloc[-1] > df[f'EMA{ma_medium}'].iloc[-1]:
            trend_score += 10
        if df['MACD'].iloc[-1] > df['MACD_Signal'].iloc[-1]:
            trend_score += 10
        if df['MACD'].iloc[-1] > 0:
            trend_score += 5
        if df['MACD'].iloc[-1] > df['MACD'].iloc[-2]:
            trend_score += 5
        
        # Momentum component - dynamic scoring
        if df['RSI'].iloc[-1] > 40 and df['RSI'].iloc[-1] < 70:
            momentum_score += 10
        if df['RSI'].iloc[-1] > df['RSI'].iloc[-2]:
            momentum_score += 10
        if df['RSI'].iloc[-1] < 40:
            momentum_score += 10
        if df['%K'].iloc[-1] > df['%D'].iloc[-1]:
            momentum_score += 10
        if df['CLOSE'].iloc[-1] > df['CLOSE'].iloc[-3]:
            momentum_score += 10
        
        # Volatility component - dynamic scoring
        if df['%B'].iloc[-1] < 0.4:
            volatility_score += 10
        if df['%B'].iloc[-1] > 0.6:
            volatility_score -= 10
        if df['ATR_Pct'].iloc[-1] < df['ATR_Pct'].rolling(window=10).mean().iloc[-1]:
            volatility_score += 10
        
        # Volume component - dynamic scoring
        if df['Volume_Ratio'].iloc[-1] > 1.0:
            volume_score += 10
        if df['OBV'].iloc[-1] > df['OBV_SMA'].iloc[-1]:
            volume_score += 10
        
        # Calculate final composite score with dynamic weights
        composite_score = (trend_score * trend_weight) + \
                        (momentum_score * momentum_weight) + \
                        (volatility_score * volatility_weight) + \
                        (volume_score * volume_weight)
        
        # Print scores
        print(f"Composite Score: {composite_score:.2f}")
        print(f"Trend: {trend_score} ({trend_weight:.2f}), Momentum: {momentum_score} ({momentum_weight:.2f}), "
            f"Volatility: {volatility_score} ({volatility_weight:.2f}), Volume: {volume_score} ({volume_weight:.2f})")
        
        # OPTIMIZATION 4: Dynamic position sizing based on conviction and volatility
        # Calculate position size based on volatility and signal strength
        risk_per_trade = 0.03  # Base risk: 3% of portfolio
        
        # Adjust risk based on signal strength
        signal_strength = composite_score / 60  # Normalize to 0-1 range (max score ~60)
        adjusted_risk = risk_per_trade * min(1.5, max(0.5, signal_strength))  # 1.5% to 4.5% risk
        
        # Further adjust based on volatility
        volatility_factor = 1.0
        if current_volatility > 0.4:  # High volatility
            volatility_factor = 0.7  # Reduce position size
        elif current_volatility < 0.25:  # Low volatility
            volatility_factor = 1.2  # Increase position size
        
        final_risk = adjusted_risk * volatility_factor        
        stop_loss_atr_multiple = 2
        current_price = df['CLOSE'].iloc[-1]
        atr = df['ATR'].iloc[-1]
        stop_loss_price = current_price - (atr * stop_loss_atr_multiple)
        risk_per_share = current_price - stop_loss_price
        
        # Calculate position size with dynamic risk
        max_position_value = self.portfolio['cash'] * 0.35  # Max 35% of portfolio in one position
        risk_based_position = (self.portfolio['cash'] * final_risk) / risk_per_share
        position_value = min(risk_based_position * current_price, max_position_value)
        quantity = max(1, int(position_value / current_price))
        
        # OPTIMIZATION 5: Smarter trade frequency control
        # Dynamic holding period based on volatility and market regime
        if is_strong_trend:
            min_holding_days = 3  # Hold longer in strong trends
        elif is_ranging:
            min_holding_days = 1  # Quick in and out in ranging markets
        else:  # Weak trend
            min_holding_days = 2  # Moderate holding period
        
        min_wait_after_sell = 1  # Always wait at least 1 day after selling
        recent_sell = False
        recent_buy = False
        days_held = 0
        
        if symbol in self.portfolio['holdings']:
            recent_buys = [t for t in self.portfolio['transactions'] if t['type'] == 'BUY' and t['symbol'] == symbol]
            if recent_buys:
                last_buy_date = datetime.strptime(recent_buys[-1]['timestamp'], "%Y-%m-%d %H:%M:%S").date()
                days_held = (current_date - last_buy_date).days
                recent_buy = days_held < min_holding_days
                print(f"Holding {symbol} for {days_held} days (min: {min_holding_days})")
        else:
            # Check if we recently sold to avoid immediate repurchase
            recent_sells = [t for t in self.portfolio['transactions'] 
                        if t['type'] == 'SELL' and t['symbol'] == symbol]
            if recent_sells:
                last_sell_date = datetime.strptime(recent_sells[-1]['timestamp'], "%Y-%m-%d %H:%M:%S").date()
                days_since_sell = (current_date - last_sell_date).days
                recent_sell = days_since_sell < min_wait_after_sell
                if recent_sell:
                    print(f"Recently sold {symbol}, waiting {min_wait_after_sell - days_since_sell} more days before buying")
        
        # OPTIMIZATION 6: Market regime-specific entry/exit thresholds
        # Set thresholds based on market regime
        if is_strong_trend:
            buy_threshold = 10
            sell_threshold = -10
        elif is_ranging:
            buy_threshold = 20
            sell_threshold = -20
        else:  # Weak trend
            buy_threshold = 15
            sell_threshold = -15
        
        # Adjust thresholds during regime transitions (be more conservative)
        if is_regime_transition:
            buy_threshold *= 1.3  # 30% higher threshold
            sell_threshold *= 0.7  # 30% lower threshold (more negative)
        
        # BUY LOGIC - Regime-specific with dynamic thresholds
        buy_signal = False
        
        if is_strong_trend and is_uptrend:
            if composite_score > buy_threshold and not recent_sell and not recent_buy:
                buy_signal = True
                print(f"Strong uptrend BUY signal for {symbol} with score {composite_score:.2f} > {buy_threshold}")
        
        elif is_ranging:
            if composite_score > buy_threshold and df['%B'].iloc[-1] < 0.4 and not recent_sell and not recent_buy:
                buy_signal = True
                print(f"Range market BUY signal for {symbol} with score {composite_score:.2f} > {buy_threshold}")
        
        elif is_weak_trend and is_uptrend:
            if composite_score > buy_threshold and not recent_sell and not recent_buy:
                buy_signal = True
                print(f"Weak uptrend BUY signal for {symbol} with score {composite_score:.2f} > {buy_threshold}")
        
        # ADDITIONAL BUY CONDITIONS - With dynamic parameters
        # Buy on RSI oversold condition
        if df['RSI'].iloc[-1] < 35 and df['RSI'].iloc[-1] > df['RSI'].iloc[-2] and not recent_sell and not recent_buy:
            buy_signal = True
            print(f"RSI oversold BUY signal for {symbol} with RSI {df['RSI'].iloc[-1]:.2f}")
        
        # Buy on Bollinger Band bounce
        if df['%B'].iloc[-1] < 0.2 and df['%B'].iloc[-1] > df['%B'].iloc[-2] and not recent_sell and not recent_buy:
            buy_signal = True
            print(f"Bollinger Band bounce BUY signal for {symbol} with %B {df['%B'].iloc[-1]:.2f}")
        
        # Buy on volume spike with price increase
        if df['Volume_Ratio'].iloc[-1] > 1.5 and df['CLOSE'].iloc[-1] > df['CLOSE'].iloc[-2] and not recent_sell and not recent_buy:
            buy_signal = True
            print(f"Volume spike BUY signal for {symbol} with volume ratio {df['Volume_Ratio'].iloc[-1]:.2f}")
        
        # OPTIMIZATION 7: Sector and market trend awareness
        # This would require additional data, but conceptually:
        # if market_is_bullish and sector_is_strong:
        #     buy_signal = buy_signal  # Keep as is
        # elif market_is_bearish and sector_is_weak:
        #     buy_signal = False  # Override to false
        # elif market_is_neutral:
        #     # Require stronger signal
        #     buy_signal = buy_signal and composite_score > buy_threshold * 1.2
        
        # Execute buy if signal is triggered
        if buy_signal:
            self.add_historical_transaction(symbol, quantity, "BUY", f"{current_date} 09:15:00")
        
        # SELL LOGIC - Regime-specific with dynamic thresholds
        sell_signal = False
        
        if symbol in self.portfolio['holdings']:
            # Only consider selling if we've held for minimum period
            if days_held >= min_holding_days:
                if is_strong_trend and is_downtrend:
                    if composite_score < sell_threshold:
                        sell_signal = True
                        print(f"Strong downtrend SELL signal for {symbol} with score {composite_score:.2f} < {sell_threshold}")
                
                elif is_ranging:
                    if composite_score < sell_threshold and df['%B'].iloc[-1] > 0.6:
                        sell_signal = True
                        print(f"Range market SELL signal for {symbol} with score {composite_score:.2f} < {sell_threshold}")
                
                elif is_weak_trend and is_downtrend:
                    if composite_score < sell_threshold:
                        sell_signal = True
                        print(f"Weak downtrend SELL signal for {symbol} with score {composite_score:.2f} < {sell_threshold}")
            
            # ADDITIONAL SELL CONDITIONS - With dynamic parameters
            # Sell on RSI overbought condition
            if df['RSI'].iloc[-1] > 70 and df['RSI'].iloc[-1] < df['RSI'].iloc[-2] and days_held >= min_holding_days:
                sell_signal = True
                print(f"RSI overbought SELL signal for {symbol} with RSI {df['RSI'].iloc[-1]:.2f}")
            
            # Sell on Bollinger Band upper touch
            if df['%B'].iloc[-1] > 0.8 and df['%B'].iloc[-1] < df['%B'].iloc[-2] and days_held >= min_holding_days:
                sell_signal = True
                print(f"Bollinger Band upper SELL signal for {symbol} with %B {df['%B'].iloc[-1]:.2f}")
            
            # Execute sell if signal is triggered
            if sell_signal:
                self.add_historical_transaction(symbol, self.portfolio['holdings'][symbol]['quantity'], "SELL", f"{current_date} 09:15:00")
        
        # OPTIMIZATION 8: Dynamic profit taking and stop loss based on volatility
        if symbol in self.portfolio['holdings'] and days_held >= min_holding_days:
            avg_price = self.portfolio['holdings'][symbol]['avg_price']
            profit_pct = (current_price - avg_price) / avg_price
            
            # Dynamic profit taking levels based on volatility
            partial_profit_threshold = profit_take_pct * 0.7  # 70% of target
            full_profit_threshold = profit_take_pct
            
            # Take partial profits at dynamic threshold
            if profit_pct > partial_profit_threshold:
                sell_quantity = max(1, self.portfolio['holdings'][symbol]['quantity'] // 2)
                print(f"Taking partial profits on {symbol} at {profit_pct:.2%} gain (threshold: {partial_profit_threshold:.2%})")
                self.add_historical_transaction(symbol, sell_quantity, "SELL", f"{current_date} 09:15:00")
            
            # Take full profits at dynamic threshold
            if profit_pct > full_profit_threshold:
                print(f"Taking full profits on {symbol} at {profit_pct:.2%} gain (threshold: {full_profit_threshold:.2%})")
                self.add_historical_transaction(symbol, self.portfolio['holdings'][symbol]['quantity'], "SELL", f"{current_date} 09:15:00")
            
            # Dynamic stop loss based on volatility
            if profit_pct < -stop_loss_pct:
                print(f"Stop loss triggered on {symbol} at {profit_pct:.2%} loss (threshold: {-stop_loss_pct:.2%})")
                self.add_historical_transaction(symbol, self.portfolio['holdings'][symbol]['quantity'], "SELL", f"{current_date} 09:15:00")
            
            # Dynamic trailing stop loss
            if profit_pct > 0.03:  # If we're up more than 3%
                # Calculate trailing stop - tighter for higher profits
                trail_percentage = 0.7 - (profit_pct * 0.5)  # Ranges from 70% down to 60% as profits increase
                trail_percentage = max(0.5, min(0.7, trail_percentage))  # Clamp between 50-70%
                trailing_stop = avg_price * (1 + profit_pct * trail_percentage)
                
                if current_price < trailing_stop:
                    print(f"Trailing stop triggered on {symbol} at {profit_pct:.2%} profit (trail %: {trail_percentage:.2f})")
                    self.add_historical_transaction(symbol, self.portfolio['holdings'][symbol]['quantity'], "SELL", f"{current_date} 09:15:00")
    def _calculate_adx(self, df, period=14):
        """Helper method to calculate Average Directional Index (ADX)"""
        # Calculate +DM, -DM, +DI, -DI, DX, and ADX
        df['UpMove'] = df['HIGH'].diff()
        df['DownMove'] = df['LOW'].diff(-1).abs()
        
        df['+DM'] = np.where((df['UpMove'] > df['DownMove']) & (df['UpMove'] > 0), df['UpMove'], 0)
        df['-DM'] = np.where((df['DownMove'] > df['UpMove']) & (df['DownMove'] > 0), df['DownMove'], 0)
        
        df['TR'] = np.maximum(df['HIGH'] - df['LOW'], 
                            np.maximum(abs(df['HIGH'] - df['CLOSE'].shift(1)), 
                                    abs(df['LOW'] - df['CLOSE'].shift(1))))
        
        df['+DI'] = 100 * (df['+DM'].rolling(window=period).sum() / df['TR'].rolling(window=period).sum())
        df['-DI'] = 100 * (df['-DM'].rolling(window=period).sum() / df['TR'].rolling(window=period).sum())
        
        df['DX'] = 100 * (abs(df['+DI'] - df['-DI']) / (df['+DI'] + df['-DI']))
        df['ADX'] = df['DX'].rolling(window=period).mean()
        df['ADX'] = df['ADX'].fillna(20)
        return df['ADX']
    def run_backtest(self, strategy, symbol, start_date, end_date):
        # Initialize with proper price history structure
        self.portfolio['price_history'] = {}
        initial_cash = self.portfolio['cash']

        # Convert dates
        if isinstance(start_date, str):
            start_date = datetime.strptime(start_date, "%Y-%m-%d").date()
        if isinstance(end_date, str):
            end_date = datetime.strptime(end_date, "%Y-%m-%d").date()

        current_date = start_date
        while current_date <= end_date:
            if current_date.weekday() < 5:  # Skip weekends
                date_str = current_date.strftime("%Y-%m-%d")
                price = get_historical_price(symbol, date_str)
                if price is not None:
                    # Store as string date to avoid serialization issues
                    self.portfolio['price_history'][date_str] = price
                    strategy(symbol, current_date)
                else:
                    print(f"No price data for {symbol} on {date_str}")
            current_date += timedelta(days=1)

        # Debug: Show collected price history
        print(f"\nCollected {len(self.portfolio['price_history'])} price points")
        print("Sample prices:", dict(list(self.portfolio['price_history'].items())[:3]))

        # Calculate returns
        final_value = self.portfolio['cash']
        for s, h in self.portfolio['holdings'].items():
            last_price = get_historical_price(s, end_date.strftime("%Y-%m-%d"))
            if last_price:
                final_value += last_price * h['quantity']

        self.portfolio['return'] = (final_value - initial_cash) / initial_cash

        # Generate plot
        image_path = self.plot_backtest_results(symbol)
        if image_path:
            if 'performance_images' not in self.portfolio:
                self.portfolio['performance_images'] = []
            self.portfolio['performance_images'].append(image_path)

        return {
            'return': self.portfolio['return'],
            'transactions': self.portfolio['transactions'],
            'graph_path': image_path,
            'price_history': self.portfolio['price_history']  # Return for debugging
        }
    
    def plot_backtest_results(self, symbol):
        """Plot price history with buy/sell signals"""
        if not self.portfolio.get('price_history'):
            print("DEBUG - No price history in portfolio:", self.portfolio.keys())
            return None

        try:
            # Convert string dates to datetime objects for plotting
            dates = [datetime.strptime(d, "%Y-%m-%d").date()
                     for d in sorted(self.portfolio['price_history'].keys())]
            prices = [self.portfolio['price_history'][d]
                      for d in sorted(self.portfolio['price_history'].keys())]

            plt.figure(figsize=(14, 7))
            plt.plot(dates, prices, label='Price', color='royalblue', linewidth=2)

            # Plot transactions if they exist
            if 'transactions' in self.portfolio:
                for t in self.portfolio['transactions']:
                    try:
                        trans_date = datetime.strptime(t['timestamp'], "%Y-%m-%d %H:%M:%S").date()
                        trans_type = t['type']
                        price = t['price']

                        if trans_type == 'BUY':
                            plt.scatter(trans_date, price, color='limegreen', marker='^',
                                        s=150, edgecolors='black', label='Buy')
                        elif trans_type == 'SELL':
                            plt.scatter(trans_date, price, color='crimson', marker='v',
                                        s=150, edgecolors='black', label='Sell')
                    except Exception as e:
                        print(f"Error plotting transaction: {e}")
                        continue

            plt.title(f"{symbol} Trading Performance")
            plt.xlabel('Date')
            plt.ylabel('Price ()')
            plt.grid(True, linestyle='--', alpha=0.7)
            plt.legend()

            # Format dates
            plt.gca().xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m-%d'))
            plt.gcf().autofmt_xdate()

            # Save image
            os.makedirs('static/graphs', exist_ok=True)
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            image_path = f"static/graphs/{self.name}_{symbol}_{timestamp}.png"
            plt.savefig(image_path)
            plt.close()

            return image_path

        except Exception as e:
            print(f"Error in plot_backtest_results: {e}")
            return None


################################## PART 1 : STRATEGIES; UNCOMMENT THE BELOW PART TO TRY STRATEGIES. SWITCH THE STRATEGY TO ALL AVAILABLE ONES TO CHECK THEM ########################################3


"""

simobject = Simulation("main1",20000)

results = simobject.run_backtest(
    strategy=simobject.bollinger_bands_strategy,
    symbol="TCS",
    start_date="2023-01-01",
    end_date="2023-12-31",
)

print(f"Strategy Return: {results['return']*100:.2f}%")

for transaction in results['transactions']:
    print(transaction)


"""


############################################

class Watchlist:
    def __init__(self, name):
        self.name = name
        self.watchlist = {}  # This will store symbol data
        self.db_id = None  # To track database ID for updates
        self.created_at = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    def add_to_watchlist(self, symbol, notes="added!"):
        """Add a stock to the watchlist with validation."""
        if symbol in self.watchlist:
            print(f"{symbol} is already in the watchlist.")
            return False

        price = get_stock_price(symbol)
        if price is not None:
            self.watchlist[symbol] = {
                'added_on': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                'last_price': price,
                'notes': notes
            }
            print(f"Added {symbol} to watchlist at {price:.2f}.")
            return True
        else:
            print(f"Failed to add {symbol} to watchlist.")
            return False

    def remove_from_watchlist(self, symbol):
        """Remove a stock from the watchlist."""
        if symbol in self.watchlist:
            del self.watchlist[symbol]
            print(f"Removed {symbol} from watchlist.")
            return True
        else:
            print(f"{symbol} is not in the watchlist.")
            return False

def view_watchlist(self):
    """Display the current watchlist with updated prices."""
    if not self.watchlist:
        print("Watchlist is empty.")
        return []

    report = []
    for symbol, data in self.watchlist.items():
        current_price = get_stock_price(symbol)
        initial_price = data.get('last_price', current_price)
        price_change = current_price - initial_price if current_price else None
        
        report.append({
            'Symbol': symbol,
            'Added On': data.get('added_on', 'N/A'),
            'Initial Price': initial_price,
            'Current Price': current_price if current_price else "N/A",
            'Change': f"{price_change:.2f}" if price_change is not None else "N/A",
            'Notes': data.get('notes', '')
        })

    df = pd.DataFrame(report)
    print("\nWatchlist Summary:")
    print(df.to_string(index=False))
    return report
"""
wtl1 = Watchlist("watchlist1")
wtl1.add_to_watchlist("RELIANCE")
wtl1.add_to_watchlist("TCS")
wtl1.view_watchlist()
wtl1.remove_from_watchlist("RELIANCE")
wtl1.view_watchlist()
"""


def generate_advice_sheet(symbol):
    """
    Generate an advice sheet for a given stock and return as JSON-serializable dict.
    
    Parameters:
        symbol (str): Stock symbol (e.g., "RELIANCE").
    Returns:
        dict: Dictionary containing all advice data
    """
    advice_data = {
        'symbol': symbol,
        'current_price': None,
        'one_year_return': None,
        'recommendations': {},
        'predictions': {},
        'final_recommendation': None,
        'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    }

    # Fetch current stock information
    current_price = get_stock_price(symbol)
    if current_price is None:
        return {'error': f"Failed to fetch data for {symbol}"}
    
    advice_data['current_price'] = current_price

    # Fetch historical data for 1-year return calculation
    end_date = date.today()
    start_date = end_date - timedelta(days=365)
    df = stock_df(symbol, from_date=start_date, to_date=end_date, series="EQ")
    if df.empty:
        return {'error': f"No historical data found for {symbol}"}

    # Calculate 1-year return
    initial_price = df['CLOSE'].iloc[0]
    final_price = df['CLOSE'].iloc[-1]
    one_year_return = ((final_price - initial_price) / initial_price) * 100
    advice_data['one_year_return'] = one_year_return

    # Generate recommendations
    advice_data['recommendations']['buy_and_hold'] = evaluate_buy_and_hold(symbol, df)
    advice_data['recommendations']['momentum'] = evaluate_momentum(symbol, df)
    advice_data['recommendations']['bollinger'] = evaluate_bollinger_bands(symbol, df)
    advice_data['recommendations']['ma_crossover'] = evaluate_moving_average_crossover(symbol, df)
    
    # Generate predictions
    arima_prediction = predict_future_price(symbol, days_ahead=7)
    advice_data['predictions']['arima_7day'] = arima_prediction if arima_prediction else None

    # Generate final recommendation
    advice_data['final_recommendation'] = generate_final_recommendation(
        advice_data['recommendations']['buy_and_hold'],
        advice_data['recommendations']['momentum'],
        advice_data['recommendations']['bollinger'],
        advice_data['recommendations']['ma_crossover'],
        advice_data['predictions']['arima_7day']
    )

    return advice_data
def evaluate_buy_and_hold(symbol, df):
    initial_price = df['CLOSE'].iloc[0]
    final_price = df['CLOSE'].iloc[-1]
    one_year_return = ((final_price - initial_price) / initial_price) * 100

    return {
        'recommendation': 'Recommended' if one_year_return > 10 else 'Not Recommended',
        'reason': f"1-Year Return: {one_year_return:.2f}%",
        'return': one_year_return,
        'signal': 'buy' if one_year_return > 10 else 'hold'
    }

def evaluate_momentum(symbol, df, lookback_days=14, threshold=0.05):
    df['returns'] = df['CLOSE'].pct_change(lookback_days)
    current_return = df['returns'].iloc[-1]

    if current_return > threshold:
        return {
            'recommendation': 'Buy',
            'reason': f"Positive momentum ({current_return * 100:.2f}%)",
            'momentum': current_return * 100,
            'signal': 'buy'
        }
    elif current_return < -threshold:
        return {
            'recommendation': 'Sell',
            'reason': f"Negative momentum ({current_return * 100:.2f}%)",
            'momentum': current_return * 100,
            'signal': 'sell'
        }
    else:
        return {
            'recommendation': 'Hold',
            'reason': 'No significant momentum',
            'momentum': current_return * 100,
            'signal': 'hold'
        }



def evaluate_bollinger_bands(symbol, df, window=20, num_std=2):
    """
    Evaluate Bollinger Bands strategy and return recommendation as dict.
    
    Parameters:
        symbol (str): Stock symbol
        df (pd.DataFrame): Historical data
        window (int): Rolling window size
        num_std (int): Number of standard deviations for bands
        
    Returns:
        dict: Recommendation dictionary with:
            - recommendation (str): Buy/Sell/Hold
            - reason (str): Explanation
            - signal (str): buy/sell/hold
            - current_position (str): Relative to bands
            - bands (dict): Band values
    """
    # Calculate indicators
    df['MA'] = df['CLOSE'].rolling(window=window).mean()
    df['STD'] = df['CLOSE'].rolling(window=window).std()
    df['Upper'] = df['MA'] + (df['STD'] * num_std)
    df['Lower'] = df['MA'] - (df['STD'] * num_std)

    current_price = df['CLOSE'].iloc[-1]
    ma = df['MA'].iloc[-1]
    upper = df['Upper'].iloc[-1]
    lower = df['Lower'].iloc[-1]

    if current_price < lower:
        return {
            'recommendation': 'Buy',
            'reason': 'Stock is oversold (below lower Bollinger Band)',
            'signal': 'buy',
            'current_position': 'below_lower_band',
            'bands': {
                'upper': upper,
                'middle': ma,
                'lower': lower
            },
            'current_price': current_price,
            'distance_from_ma': ((current_price - ma) / ma) * 100  # % from MA
        }
    elif current_price > upper:
        return {
            'recommendation': 'Sell',
            'reason': 'Stock is overbought (above upper Bollinger Band)',
            'signal': 'sell',
            'current_position': 'above_upper_band',
            'bands': {
                'upper': upper,
                'middle': ma,
                'lower': lower
            },
            'current_price': current_price,
            'distance_from_ma': ((current_price - ma) / ma) * 100
        }
    else:
        return {
            'recommendation': 'Hold',
            'reason': 'Stock is within Bollinger Bands',
            'signal': 'hold',
            'current_position': 'within_bands',
            'bands': {
                'upper': upper,
                'middle': ma,
                'lower': lower
            },
            'current_price': current_price,
            'distance_from_ma': ((current_price - ma) / ma) * 100
        }

def evaluate_moving_average_crossover(symbol, df, short_window=50, long_window=200):
    """
    Evaluate Moving Average Crossover strategy and return recommendation as dict.
    
    Parameters:
        symbol (str): Stock symbol
        df (pd.DataFrame): Historical data
        short_window (int): Short-term MA window
        long_window (int): Long-term MA window
        
    Returns:
        dict: Recommendation dictionary with:
            - recommendation (str): Buy/Sell/Hold
            - reason (str): Explanation
            - signal (str): buy/sell/hold
            - moving_averages (dict): MA values
            - crossover_type (str): golden_cross/death_cross/none
    """
    # Calculate MAs
    df['SMA50'] = df['CLOSE'].rolling(short_window).mean()
    df['SMA200'] = df['CLOSE'].rolling(long_window).mean()

    # Get current and previous values
    sma50_current = df['SMA50'].iloc[-1]
    sma200_current = df['SMA200'].iloc[-1]
    sma50_prev = df['SMA50'].iloc[-2] if len(df) > 1 else sma50_current
    sma200_prev = df['SMA200'].iloc[-2] if len(df) > 1 else sma200_current

    # Check for crossovers
    if sma50_prev < sma200_prev and sma50_current > sma200_current:
        return {
            'recommendation': 'Buy',
            'reason': 'Golden Cross detected (50MA crossed above 200MA)',
            'signal': 'buy',
            'moving_averages': {
                'sma50': sma50_current,
                'sma200': sma200_current
            },
            'crossover_type': 'golden_cross',
            'current_price': df['CLOSE'].iloc[-1]
        }
    elif sma50_prev > sma200_prev and sma50_current < sma200_current:
        return {
            'recommendation': 'Sell',
            'reason': 'Death Cross detected (50MA crossed below 200MA)',
            'signal': 'sell',
            'moving_averages': {
                'sma50': sma50_current,
                'sma200': sma200_current
            },
            'crossover_type': 'death_cross',
            'current_price': df['CLOSE'].iloc[-1]
        }
    else:
        return {
            'recommendation': 'Hold',
            'reason': 'No MA crossover detected',
            'signal': 'hold',
            'moving_averages': {
                'sma50': sma50_current,
                'sma200': sma200_current
            },
            'crossover_type': 'none',
            'current_price': df['CLOSE'].iloc[-1]
        }
        
def generate_final_recommendation(*recommendations):
    """
    Generate final recommendation based on all strategy recommendations.
    
    Parameters:
        recommendations: List of recommendation dicts from all strategies
        
    Returns:
        dict: Final recommendation with consensus and details
    """
    # Count signals from all recommendations
    signal_counts = {'buy': 0, 'sell': 0, 'hold': 0}
    strategy_details = []
    
    for rec in recommendations:
        if isinstance(rec, dict) and 'signal' in rec:
            signal = rec['signal']
            signal_counts[signal] += 1
            strategy_details.append({
                'strategy': rec.get('recommendation', 'Unknown'),
                'signal': signal,
                'reason': rec.get('reason', '')
            })
    
    # Determine final recommendation
    if signal_counts['buy'] > signal_counts['sell'] and signal_counts['buy'] > signal_counts['hold']:
        final_signal = 'buy'
        reason = f"Majority ({signal_counts['buy']}/{len(recommendations)}) of strategies recommend buying"
    elif signal_counts['sell'] > signal_counts['buy'] and signal_counts['sell'] > signal_counts['hold']:
        final_signal = 'sell'
        reason = f"Majority ({signal_counts['sell']}/{len(recommendations)}) of strategies recommend selling"
    else:
        final_signal = 'hold'
        reason = f"No clear consensus (Buy: {signal_counts['buy']}, Sell: {signal_counts['sell']}, Hold: {signal_counts['hold']})"
    
    return {
        'recommendation': final_signal.upper(),
        'reason': reason,
        'signal': final_signal,
        'signal_counts': signal_counts,
        'strategy_details': strategy_details
    }
    
    
    
def predict_future_price(symbol, days_ahead=7):
    # Get historical data
    end_date = date.today()
    start_date = end_date - timedelta(days=365)
    df = stock_df(symbol, from_date=start_date, to_date=end_date, series="EQ")

    if len(df) < 30:
        return None

    # Fit ARIMA model
    model = ARIMA(df['CLOSE'], order=(5, 1, 0))
    model_fit = model.fit()

    # Make prediction
    forecast = model_fit.forecast(steps=days_ahead)

    # Check if forecast is empty or not
    if forecast.size > 0:
        if isinstance(forecast, np.ndarray):  # If forecast is a numpy array
            return forecast[-1]
        elif isinstance(forecast, pd.Series):  # If forecast is a pandas Series
            return forecast.iloc[-1]
        else:
            return forecast  # If it's neither, just return the whole forecast
    else:
        return None


"""
generate_advice_sheet("SWIGGY")
"""

import sqlite3
import json
from datetime import datetime


def save_graph_image(fig, simulation_id, graph_name):
    """Save matplotlib figure and return path"""
    os.makedirs('static/graphs', exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{simulation_id}_{graph_name}_{timestamp}.png"
    path = f"static/graphs/{filename}"
    fig.savefig(path)
    plt.close(fig)
    return path


def serialize_simulation(simulation):
    """Convert simulation to JSON-serializable dict"""
    # Convert price_history dates to strings if they exist
    portfolio_data = simulation.portfolio.copy()
    if 'price_history' in portfolio_data:
        portfolio_data['price_history'] = {
            k.strftime("%Y-%m-%d") if isinstance(k, date) else k: v
            for k, v in portfolio_data['price_history'].items()
        }

    data = {
        'name': simulation.name,
        'timestamp': simulation.timestamp,
        'portfolio': portfolio_data,
        'logs': simulation.logs,
        'images': simulation.images,
        'performance_images': simulation.portfolio.get('performance_images', [])
    }
    return json.loads(json.dumps(data, cls=PortfolioEncoder))


# --- Database Setup ---
def create_database():
    conn = sqlite3.connect('trading_system.db')
    c = conn.cursor()

    # Users Table
    c.execute('''CREATE TABLE IF NOT EXISTS users (
                 id INTEGER PRIMARY KEY AUTOINCREMENT,
                 username TEXT UNIQUE NOT NULL,
                 password TEXT NOT NULL,
                 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''')

    # Portfolios Table
    c.execute('''CREATE TABLE IF NOT EXISTS portfolios (
                 id INTEGER PRIMARY KEY AUTOINCREMENT,
                 user_id INTEGER NOT NULL,
                 name TEXT NOT NULL,
                 data TEXT NOT NULL,  
                 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                 FOREIGN KEY(user_id) REFERENCES users(id))''')

    # Watchlists Table
    c.execute('''CREATE TABLE IF NOT EXISTS watchlists (
                 id INTEGER PRIMARY KEY AUTOINCREMENT,
                 user_id INTEGER NOT NULL,
                 name TEXT NOT NULL,
                 symbols TEXT NOT NULL,  
                 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                 FOREIGN KEY(user_id) REFERENCES users(id))''')

    # NEW TABLE for simulation images
    c.execute('''CREATE TABLE IF NOT EXISTS simulation_images (
                 id INTEGER PRIMARY KEY AUTOINCREMENT,
                 simulation_id INTEGER NOT NULL,
                 image_path TEXT NOT NULL,
                 image_type TEXT NOT NULL,
                 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                 FOREIGN KEY(simulation_id) REFERENCES portfolios(id))''')

    c.execute('''CREATE TABLE IF NOT EXISTS strategies (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    portfolio_id INTEGER NOT NULL,
                    name TEXT NOT NULL,
                    symbol TEXT NOT NULL,
                    strategy_type TEXT NOT NULL CHECK(strategy_type IN ('MOMENTUM', 'BOLLINGER', 'MACROSS')),
                    parameters TEXT NOT NULL,
                    is_active BOOLEAN DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_executed TIMESTAMP,
                    FOREIGN KEY(user_id) REFERENCES users(id),
                    FOREIGN KEY(portfolio_id) REFERENCES portfolios(id))''')

    # Execution log table
    c.execute('''CREATE TABLE IF NOT EXISTS strategy_executions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    strategy_id INTEGER NOT NULL,
                    execution_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    action TEXT NOT NULL,
                    quantity INTEGER,
                    price REAL,
                    FOREIGN KEY(strategy_id) REFERENCES strategies(id))''')

    conn.commit()
    conn.close()


create_database()


########## STRATEGIES ###################

class StrategyManager:
    def __init__(self):
        self.conn = sqlite3.connect('trading_system.db')
        self.conn.row_factory = sqlite3.Row

    def create_strategy(self, user_id, portfolio_id, name, symbol, strategy_type, parameters):
        """Create a new trading strategy"""
        try:
            # Validate portfolio belongs to user
            c = self.conn.cursor()
            c.execute('SELECT id FROM portfolios WHERE id=? AND user_id=?',
                      (portfolio_id, user_id))
            if not c.fetchone():
                return False, "Portfolio not found or access denied"

            # Insert new strategy
            c.execute('''INSERT INTO strategies 
                        (user_id, portfolio_id, name, symbol, strategy_type, parameters)
                        VALUES (?, ?, ?, ?, ?, ?)''',
                      (user_id, portfolio_id, name, symbol.upper(),
                       strategy_type.upper(), json.dumps(parameters)))
            self.conn.commit()
            return True, "Strategy created successfully"
        except Exception as e:
            return False, f"Error creating strategy: {str(e)}"

    def delete_strategy(self, user_id, strategy_id):
        """Delete a strategy if it belongs to the user"""
        try:
            c = self.conn.cursor()
            c.execute('DELETE FROM strategies WHERE id=? AND user_id=?',
                      (strategy_id, user_id))
            self.conn.commit()
            return c.rowcount > 0, "Deleted" if c.rowcount else "Strategy not found"
        except Exception as e:
            return False, f"Error deleting strategy: {str(e)}"

    def list_strategies(self, user_id):
        """List all strategies for a user with portfolio info"""
        try:
            c = self.conn.cursor()
            c.execute('''SELECT s.id, s.name, s.symbol, s.strategy_type, s.is_active,
                         p.name as portfolio_name, s.last_executed
                      FROM strategies s
                      JOIN portfolios p ON s.portfolio_id = p.id
                      WHERE s.user_id=?''', (user_id,))
            return True, [dict(row) for row in c.fetchall()]
        except Exception as e:
            return False, f"Error listing strategies: {str(e)}"

    def list_strategies_json(self, user_id):
        """List all strategies for a user with portfolio info"""
        try:
            c = self.conn.cursor()
            c.execute('''SELECT s.id, s.name, s.symbol, s.strategy_type, s.is_active,
                         p.name as portfolio_name, s.last_executed
                      FROM strategies s
                      JOIN portfolios p ON s.portfolio_id = p.id
                      WHERE s.user_id=?''', (user_id,))
            return {"hasStrategies": "True", "data": [dict(row) for row in c.fetchall()]}
        except Exception as e:
            return {"hasStrategies": 'False', "data": [f"Error listing strategies: {str(e)}", ]}

    def toggle_strategy(self, user_id, strategy_id, active):
        """Enable/disable a strategy"""
        try:
            c = self.conn.cursor()
            c.execute('''UPDATE strategies SET is_active=?
                      WHERE id=? AND user_id=?''',
                      (active, strategy_id, user_id))
            self.conn.commit()
            return c.rowcount > 0, "Updated" if c.rowcount else "Strategy not found"
        except Exception as e:
            return False, f"Error updating strategy: {str(e)}"


#####################################################

# --- User Authentication ---
def register_user(username, password):
    conn = sqlite3.connect('trading_system.db')
    try:
        conn.execute("INSERT INTO users (username, password) VALUES (?, ?)",
                     (username, password))
        conn.commit()
        return True
    except sqlite3.IntegrityError:
        print("Username already exists")
        return False
    finally:
        conn.close()


def authenticate_user(username, password):
    conn = sqlite3.connect('trading_system.db')
    c = conn.cursor()
    c.execute("SELECT id FROM users WHERE username=? AND password=?", (username, password))
    user = c.fetchone()
    conn.close()
    return user[0] if user else None


def save_portfolio(user_id, portfolio_obj):
    conn = sqlite3.connect('trading_system.db')
    print("here")
    try:
        # Serialize the portfolio
        json_data = json.dumps(serialize_simulation(portfolio_obj), cls=PortfolioEncoder)

        if hasattr(portfolio_obj, 'db_id'):
            # Update existing portfolio
            conn.execute('''UPDATE portfolios SET name=?, data=? WHERE id=? AND user_id=?''',
                         (portfolio_obj.name, json_data, portfolio_obj.db_id, user_id))
        else:
            # Insert new portfolio
            cursor = conn.cursor()
            cursor.execute('''INSERT INTO portfolios (user_id, name, data) VALUES (?, ?, ?)''',
                           (user_id, portfolio_obj.name, json_data))
            portfolio_obj.db_id = cursor.lastrowid

            # Save images if this is a new portfolio
            for img_path in portfolio_obj.images + portfolio_obj.portfolio.get('performance_images', []):
                img_type = 'performance' if img_path in portfolio_obj.portfolio.get('performance_images',
                                                                                    []) else 'graph'
                conn.execute('''INSERT INTO simulation_images (simulation_id, image_path, image_type)
                              VALUES (?, ?, ?)''', (portfolio_obj.db_id, img_path, img_type))

        conn.commit()
        return True
    except Exception as e:
        print(f"Error saving portfolio: {str(e)}")
        return False
    finally:
        conn.close()


# Update your load_portfolio function
def load_portfolio(user_id, portfolio_id):
    conn = sqlite3.connect('trading_system.db')
    try:
        c = conn.cursor()

        # Load portfolio data
        c.execute('''SELECT id, name, data FROM portfolios 
                   WHERE id=? AND user_id=?''',
                  (portfolio_id, user_id))
        result = c.fetchone()

        if not result:
            return None

        db_id, name, data_str = result
        data = json.loads(data_str)

        # Reconstruct portfolio
        portfolio = Simulation(name, data['portfolio']['cash'])
        portfolio.db_id = db_id
        portfolio.portfolio.update(data['portfolio'])
        portfolio.logs = data.get('logs', [])
        portfolio.images = data.get('images', [])

        # Load associated images
        c.execute('''SELECT image_path, image_type FROM simulation_images
                   WHERE simulation_id=?''', (db_id,))
        images = c.fetchall()

        for img_path, img_type in images:
            if img_type == 'performance':
                if 'performance_images' not in portfolio.portfolio:
                    portfolio.portfolio['performance_images'] = []
                portfolio.portfolio['performance_images'].append(img_path)
            else:
                portfolio.images.append(img_path)

        return portfolio
    except Exception as e:
        print(f"Error loading portfolio: {str(e)}")
        return None
    finally:
        conn.close()


# --- Watchlist Storage ---
def save_watchlist(user_id, watchlist_obj):
    """Save watchlist to database (CREATE or UPDATE)"""
    conn = sqlite3.connect('trading_system.db')
    try:
        # Prepare complete watchlist data including prices and notes
        watchlist_data = {
            'symbols': list(watchlist_obj.watchlist.keys()),  # Maintain list of symbols
            'details': {  # Store all the detailed information
                symbol: {
                    'added_on': data['added_on'],
                    'last_price': data['last_price'],
                    'notes': data.get('notes', '')
                }
                for symbol, data in watchlist_obj.watchlist.items()
            }
        }
        
        if watchlist_obj.db_id:
            # UPDATE existing watchlist
            conn.execute('''UPDATE watchlists 
                         SET name=?, symbols=?
                         WHERE id=? AND user_id=?''',
                       (watchlist_obj.name, 
                        json.dumps(watchlist_data),  # Serialize complete data
                        watchlist_obj.db_id,
                        user_id))
        else:
            # INSERT new watchlist
            cursor = conn.cursor()
            cursor.execute('''INSERT INTO watchlists 
                           (user_id, name, symbols)
                           VALUES (?, ?, ?)''',
                         (user_id,
                          watchlist_obj.name,
                          json.dumps(watchlist_data)))  # Serialize complete data
            watchlist_obj.db_id = cursor.lastrowid
            
        conn.commit()
        return True
    except Exception as e:
        print(f"Error saving watchlist: {e}")
        return False
    finally:
        conn.close()
        
def load_watchlist(user_id, watchlist_id):
    """Load watchlist from database"""
    conn = sqlite3.connect('trading_system.db')
    try:
        c = conn.cursor()
        c.execute('''SELECT id, name, symbols, created_at 
                   FROM watchlists 
                   WHERE id=? AND user_id=?''',
                (watchlist_id, user_id))
        row = c.fetchone()
        
        if not row:
            return None
            
        db_id, name, symbols_str, created_at = row
        watchlist = Watchlist(name)
        watchlist.db_id = db_id
        watchlist.created_at = created_at
        
        try:
            # Parse the serialized data
            data = json.loads(symbols_str) if symbols_str else {}
            
            # Handle both old format (just list) and new format (with details)
            if isinstance(data, dict) and 'symbols' in data:
                # New format with details
                symbols = data.get('symbols', [])
                details = data.get('details', {})
                
                for symbol in symbols:
                    if symbol in details:
                        watchlist.watchlist[symbol] = details[symbol]
                    else:
                        # Fallback for incomplete data
                        watchlist.watchlist[symbol] = {
                            'added_on': created_at,
                            'last_price': get_stock_price(symbol),
                            'notes': ""
                        }
            else:
                # Old format (just list of symbols)
                symbols = data if isinstance(data, list) else []
                for symbol in symbols:
                    watchlist.watchlist[symbol] = {
                        'added_on': created_at,
                        'last_price': get_stock_price(symbol),
                        'notes': ""
                    }
                    
        except json.JSONDecodeError:
            # Handle case where data couldn't be parsed
            print(f"Warning: Could not parse watchlist data for {name}")
            watchlist.watchlist = {}
            
        return watchlist
    except Exception as e:
        print(f"Error loading watchlist: {e}")
        return None
    finally:
        conn.close()
        
def get_user_portfolios(user_id):
    """Get ALL portfolios for a user in a nested structure"""
    conn = sqlite3.connect('trading_system.db')
    try:
        c = conn.cursor()
        c.execute('''SELECT id, name, data, created_at FROM portfolios
                   WHERE user_id=? ORDER BY created_at DESC''',
                  (user_id,))

        portfolios = []
        for row in c.fetchall():
            try:
                portfolio_data = json.loads(row[2])

                portfolio = {
                    'id': row[0],
                    'name': row[1],
                    'created_at': row[3],
                    'type': 'portfolio',
                    'data': portfolio_data,  # Full portfolio data
                    'cash': portfolio_data.get('portfolio', {}).get('cash', 0),
                    'holdings_count': len(portfolio_data.get('portfolio', {}).get('holdings', {})),
                    'transactions_count': len(portfolio_data.get('portfolio', {}).get('transactions', []))
                }

                portfolios.append(portfolio)

            except (json.JSONDecodeError, KeyError) as e:
                print(f"Error processing portfolio {row[0]}: {str(e)}")
                portfolios.append({
                    'id': row[0],
                    'name': row[1],
                    'created_at': row[3],
                    'type': 'portfolio',
                    'error': f"Could not load portfolio data: {str(e)}"
                })

        return {
            'user_id': user_id,
            'count': len(portfolios),
            'portfolios': portfolios  # Nested under 'portfolios' key
        }
    finally:
        conn.close()


def get_user_watchlists(user_id):
    """Get ALL watchlists for a user with detailed information"""
    conn = sqlite3.connect('trading_system.db')
    try:
        c = conn.cursor()
        c.execute('''SELECT id, name, symbols, created_at 
                   FROM watchlists
                   WHERE user_id=? 
                   ORDER BY created_at DESC''',
                  (user_id,))

        watchlists = []
        for row in c.fetchall():
            try:
                db_id, name, data_str, created_at = row
                data = json.loads(data_str) if data_str else {}

                # Handle both old (array) and new (object with symbols/details) formats
                if isinstance(data, dict) and 'symbols' in data:
                    # New format
                    symbols = data['symbols']
                    details = data.get('details', {})
                else:
                    # Old format (just array of symbols)
                    symbols = data if isinstance(data, list) else []
                    details = {}

                # Create summary for each watchlist
                watchlist_summary = []
                for symbol in symbols:
                    symbol_data = details.get(symbol, {})
                    current_price = get_stock_price(symbol)
                    initial_price = symbol_data.get('last_price', current_price)
                    
                    watchlist_summary.append({
                        'Symbol': symbol,
                        'Added On': symbol_data.get('added_on', created_at),
                        'Initial Price': initial_price,
                        'Current Price': current_price if current_price else "N/A",
                        'Change': current_price - initial_price 
                                 if current_price and initial_price and isinstance(initial_price, (int, float)) 
                                 else "N/A",
                        'Notes': symbol_data.get('notes', '')
                    })

                watchlists.append({
                    'id': db_id,
                    'name': name,
                    'created_at': created_at,
                    'symbol_count': len(symbols),
                    'watchlist_summary': watchlist_summary
                })

            except Exception as e:
                print(f"Error processing watchlist {row[0]}: {str(e)}")
                watchlists.append({
                    'id': row[0],
                    'name': row[1],
                    'created_at': row[3],
                    'error': str(e)
                })

        return {
            'user_id': user_id,
            'count': len(watchlists),
            'watchlists': watchlists
        }
    finally:
        conn.close()
        
def get_portfolio_details(portfolio_id):
    """Get full details of a specific portfolio with additional metadata"""
    conn = sqlite3.connect('trading_system.db')
    try:
        c = conn.cursor()

        # Get basic portfolio info
        c.execute('''SELECT id, user_id, name, data, created_at 
                   FROM portfolios WHERE id=?''',
                  (portfolio_id,))
        result = c.fetchone()
        if not result:
            return None

        portfolio_id, user_id, name, data_str, created_at = result
        data = json.loads(data_str)

        # Get associated images
        c.execute('''SELECT image_path, image_type FROM simulation_images
                   WHERE simulation_id=? ORDER BY created_at DESC''',
                  (portfolio_id,))
        images = [{'path': row[0], 'type': row[1]} for row in c.fetchall()]

        # Structure the response
        response = {
            'id': portfolio_id,
            'user_id': user_id,
            'name': name,
            'created_at': created_at,
            'type': 'portfolio',
            'details': {
                'cash': data['portfolio']['cash'],
                'holdings': data['portfolio']['holdings'],
                'transactions': data['portfolio']['transactions'],
                'performance_images': data['portfolio'].get('performance_images', []),
                'logs': data.get('logs', []),
                'return': data['portfolio'].get('return', 0)
            },
            'images': images,
            'raw_data': data  # The complete stored data
        }

        return response
    finally:
        conn.close()


def get_watchlist_details(watchlist_id):
    """Get detailed watchlist information"""
    conn = sqlite3.connect('trading_system.db')
    try:
        c = conn.cursor()
        c.execute('''SELECT id, user_id, name, symbols, created_at 
                   FROM watchlists WHERE id=?''',
                  (watchlist_id,))
        result = c.fetchone()
        if not result:
            return None

        db_id, user_id, name, data_str, created_at = result

        try:
            data = json.loads(data_str) if data_str else {}
            
            # Handle both old and new formats
            if isinstance(data, dict) and 'symbols' in data:
                # New format
                symbols = data['symbols']
                details = data.get('details', {})
            else:
                # Old format
                symbols = data if isinstance(data, list) else []
                details = {}

            watchlist_data = []
            for symbol in symbols:
                symbol_data = details.get(symbol, {})
                current_price = get_stock_price(symbol)
                initial_price = symbol_data.get('last_price', current_price)
                
                watchlist_data.append({
                    'Symbol': symbol,
                    'Added On': symbol_data.get('added_on', created_at),
                    'Initial Price': initial_price,
                    'Current Price': current_price if current_price else "N/A",
                    'Change': current_price - initial_price 
                             if current_price and initial_price and isinstance(initial_price, (int, float))
                             else "N/A",
                    'Change_Percent': ((current_price - initial_price) / initial_price * 100) 
                                     if current_price and initial_price and initial_price != 0
                                     else "N/A",
                    'Notes': symbol_data.get('notes', ''),
                    'Current_Time': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                })

            return {
                'id': db_id,
                'user_id': user_id,
                'name': name,
                'created_at': created_at,
                'watchlist_summary': watchlist_data,
                'symbol_count': len(symbols),
                'total_change': sum(
                    item['Change'] for item in watchlist_data 
                    if isinstance(item['Change'], (int, float))
                ),
                'metadata': {
                    'format': 'enhanced' if isinstance(data, dict) and 'symbols' in data else 'legacy'
                }
            }
        except json.JSONDecodeError as e:
            return {
                'id': db_id,
                'user_id': user_id,
                'name': name,
                'created_at': created_at,
                'error': 'Could not parse watchlist data',
                'raw_data': data_str
            }
    except Exception as e:
        print(f"Error getting watchlist details: {str(e)}")
        return None
    finally:
        conn.close()
        
def get_portfolio_images(portfolio_id):
    """Get all images associated with a portfolio"""
    conn = sqlite3.connect('trading_system.db')
    try:
        c = conn.cursor()
        c.execute('''SELECT id, image_path, image_type, created_at 
                   FROM simulation_images
                   WHERE simulation_id=? ORDER BY created_at DESC''',
                  (portfolio_id,))
        images = []
        for row in c.fetchall():
            images.append({
                'id': row[0],
                'path': row[1],
                'type': row[2],
                'created_at': row[3]
            })
        return images
    finally:
        conn.close()

    # Create user
    # register_user("john_doe", "secure123")

    # Authenticate
    # user_id = authenticate_user("kau", "secure123")

    # if user_id:
    # Create and save portfolio
    """
    my_portfolio = Simulation("Tech Portfolio", 100000)
    my_portfolio.buy_stock("TCS", 10)
    my_portfolio.buy_stock("INFY", 5)
    save_portfolio(user_id, my_portfolio)

    # Create and save watchlist
    tech_watchlist = Watchlist("Tech Stocks")
    tech_watchlist.add_to_watchlist("TCS", "Large cap")
    tech_watchlist.add_to_watchlist("INFY", "Mid cap")
    save_watchlist(user_id, tech_watchlist)

    simobject = Simulation("main1", 20000)

    results = simobject.run_backtest(
        strategy=simobject.bollinger_bands_strategy,
        symbol="TCS",
        start_date="2023-01-01",
        end_date="2023-12-31",
    )

    print(f"Strategy Return: {results['return'] * 100:.2f}%")

    for transaction in results['transactions']:
        print(transaction)

        simobject = Simulation("main1", 20000)

    results = simobject.run_backtest(
        strategy=simobject.bollinger_bands_strategy,
        symbol="TCS",
        start_date="2023-01-01",
        end_date="2023-12-31",
    )

    print(f"Strategy Return: {results['return'] * 100:.2f}%")

    for transaction in results['transactions']:
        print(transaction)
    save_portfolio(user_id, simobject )

    results = loaded_portfolio.run_backtest(
        strategy=loaded_portfolio.bollinger_bands_strategy,
        symbol="WIPRO",
        start_date="2023-01-01",
        end_date="2023-12-31",
    )

    print(f"Strategy Return: {results['return'] * 100:.2f}%")

    for transaction in results['transactions']:
        print(transaction)
    save_portfolio(user_id, loaded_portfolio)



    """


"""
    # Load and display portfolio
    loaded_portfolio = load_portfolio(user_id, 3)


if loaded_portfolio:
        loaded_portfolio.view_portfolio()

    # Load and display watchlist
loaded_watchlist = load_watchlist(user_id, 1)
if loaded_watchlist:
        loaded_watchlist.view_watchlist()


"""

"""
print(get_portfolio_images(14))
# Get all portfolios
portfolios_response = get_user_portfolios(4)
print(json.dumps(portfolios_response, indent=2))
print(f"User has {portfolios_response['count']} portfolios:")
for portfolio in portfolios_response['portfolios']:
    print(f"- {portfolio['name']} (ID: {portfolio['id']}) with {portfolio['holdings_count']} holdings")

# Get all watchlists
watchlists_response = get_user_watchlists(1)
print(json.dumps(watchlists_response, indent=2))
print(f"\nUser has {watchlists_response['count']} watchlists:")
for watchlist in watchlists_response['watchlists']:
    print(f"- {watchlist['name']} (ID: {watchlist['id']}) with {watchlist['count']} symbols")



portfolios_response = get_user_portfolios(6)
print(json.dumps(portfolios_response, indent=2))
sm=StrategyManager()
list_strategies1 = sm.list_strategies_json(2)
print(list_strategies1)

"""