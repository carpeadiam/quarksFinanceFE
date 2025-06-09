from flask import Flask, jsonify, request, make_response
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from flask_cors import CORS
from datetime import datetime, timedelta
from functools import wraps
from quarks3 import (
    Simulation, Watchlist,
    register_user, authenticate_user,
    save_portfolio, load_portfolio,
    save_watchlist, load_watchlist,
    get_user_portfolios, get_user_watchlists,
    get_portfolio_details, get_watchlist_details,
    get_portfolio_images, StrategyManager,
    get_stock_price, get_historical_price,
    generate_advice_sheet
)
import json


app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here'
CORS(app) 

# Helper Functions
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None

        if 'x-access-token' in request.headers:
            token = request.headers['x-access-token']

        if not token:
            return jsonify({'message': 'Token is missing!'}), 401

        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = data['user_id']
        except:
            return jsonify({'message': 'Token is invalid!'}), 401

        return f(current_user, *args, **kwargs)

    return decorated


# Authentication Routes
@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    success = register_user(data['username'], data['password'])
    if success:
        return jsonify({'message': 'User created successfully'}), 201
    return jsonify({'message': 'Username already exists'}), 400


@app.route('/api/login', methods=['POST'])
def login():
    auth = request.get_json()
    try:
        response = requests.get(f'https://api.ipgeolocation.io/v2/ipgeo?apiKey= 33a388920bab464ab20c244c5e04fbcf')
        data = response.json()
        if 'country_name' in data and data['country_name'] != 'India':
            return jsonify({
                'message': 'Access denied: This service is only available in India',
                'location': data.get('country_name', 'Unknown')
            }), 403
    except Exception as e:
        # If geolocation check fails, log the error but continue with login
        print(f"Geolocation check failed: {str(e)}")
    
    # Proceed with normal login if geolocation check passes or fails
    user_id = authenticate_user(auth['username'], auth['password'])

    if not user_id:
        return make_response('Could not verify', 401, {'WWW-Authenticate': 'Basic realm="Login required!"'})

    token = jwt.encode({
        'user_id': user_id,
        'exp': datetime.utcnow() + timedelta(minutes=30)
    }, app.config['SECRET_KEY'])

    return jsonify({'token': token, 'user_id': user_id})
    
@app.route('/api/login2', methods=['POST'])
def login2():
    auth = request.get_json()
    user_id = authenticate_user(auth['username'], auth['password'])

    if not user_id:
        return make_response('Could not verify', 401, {'WWW-Authenticate': 'Basic realm="Login required!"'})

    token = jwt.encode({
        'user_id': user_id,
        'exp': datetime.utcnow() + timedelta(minutes=30)
    }, app.config['SECRET_KEY'])

    return jsonify({'token': token, 'user_id': user_id})


# User Routes
@app.route('/api/users/<int:user_id>', methods=['GET'])
@token_required
def get_user(current_user, user_id):
    if current_user != user_id:
        return jsonify({'message': 'Cannot access other user data'}), 403

    # In a real app, you'd have a get_user function in quarks3
    return jsonify({'user_id': user_id})


# Portfolio Routes
@app.route('/api/portfolios', methods=['GET', 'POST'])
@token_required
def portfolios(current_user):
    if request.method == 'GET':
        portfolios_data = get_user_portfolios(current_user)
        return jsonify(portfolios_data)

    elif request.method == 'POST':
        data = request.get_json()
        portfolio = Simulation(data['name'], float(data.get('initial_cash', 100000)))
        success = save_portfolio(current_user, portfolio)
        if success:
            return jsonify({
                'message': 'Portfolio created',
                'portfolio_id': portfolio.db_id
            }), 201
        return jsonify({'message': 'Error creating portfolio'}), 500


@app.route('/api/portfolios/<int:portfolio_id>', methods=['GET', 'PUT', 'DELETE'])
@token_required
def portfolio(current_user, portfolio_id):
    portfolio = load_portfolio(current_user, portfolio_id)
    if not portfolio:
        return jsonify({'message': 'Portfolio not found'}), 404

    if request.method == 'GET':
        details = get_portfolio_details(portfolio_id)
        return jsonify(details)

    elif request.method == 'PUT':
        data = request.get_json()
        # Update portfolio name if provided
        if 'name' in data:
            portfolio.name = data['name']
        # You could add more update logic here
        success = save_portfolio(current_user, portfolio)
        if success:
            return jsonify({'message': 'Portfolio updated'})
        return jsonify({'message': 'Error updating portfolio'}), 500

    elif request.method == 'DELETE':
        # Delete logic would need to be implemented in quarks3
        return jsonify({'message': 'Delete not yet implemented'}), 501


# Portfolio Transactions
@app.route('/api/portfolios/<int:portfolio_id>/buy', methods=['POST'])
@token_required
def buy_stock(current_user, portfolio_id):
    portfolio = load_portfolio(current_user, portfolio_id)
    if not portfolio:
        return jsonify({'message': 'Portfolio not found'}), 404

    data = request.get_json()
    try:
        portfolio.buy_stock(
            data['symbol'],
            int(data['quantity']),
            price=float(data.get('price')) if data.get('price') else None,
            live=data.get('live', True)
        )
        save_portfolio(current_user, portfolio)
        return jsonify({'message': 'Buy order executed'})
    except Exception as e:
        return jsonify({'message': str(e)}), 400


@app.route('/api/portfolios/<int:portfolio_id>/sell', methods=['POST'])
@token_required
def sell_stock(current_user, portfolio_id):
    portfolio = load_portfolio(current_user, portfolio_id)
    if not portfolio:
        return jsonify({'message': 'Portfolio not found'}), 404

    data = request.get_json()
    try:
        portfolio.sell_stock(
            data['symbol'],
            int(data['quantity']),
            price=float(data.get('price')) if data.get('price') else None,
            live=data.get('live', True)
        )
        save_portfolio(current_user, portfolio)
        return jsonify({'message': 'Sell order executed'})
    except Exception as e:
        return jsonify({'message': str(e)}), 400


# Portfolio Views
@app.route('/api/portfolios/<int:portfolio_id>/view', methods=['GET'])
@token_required
def view_portfolio(current_user, portfolio_id):
    portfolio = load_portfolio(current_user, portfolio_id)
    if not portfolio:
        return jsonify({'message': 'Portfolio not found'}), 404

    portfolio.view_portfolio()
    # Since view_portfolio() prints to console, we'll return the portfolio data
    details = get_portfolio_details(portfolio_id)
    return jsonify(details)


# Watchlist Routes
@app.route('/api/watchlists', methods=['GET', 'POST'])
@token_required
def watchlists(current_user):
    if request.method == 'GET':
        watchlists_data = get_user_watchlists(current_user)
        return jsonify(watchlists_data)

    elif request.method == 'POST':
        data = request.get_json()
        watchlist = Watchlist(data['name'])
        for symbol in data.get('symbols', []):
            watchlist.add_to_watchlist(symbol)
        success = save_watchlist(current_user, watchlist)
        if success:
            return jsonify({'message': 'Watchlist created'}), 201
        return jsonify({'message': 'Error creating watchlist'}), 500


@app.route('/api/watchlists/<int:watchlist_id>', methods=['GET', 'PUT', 'DELETE'])
@token_required
def watchlist(current_user, watchlist_id):
    watchlist = load_watchlist(current_user, watchlist_id)
    if not watchlist:
        return jsonify({'message': 'Watchlist not found'}), 404

    if request.method == 'GET':
        details = get_watchlist_details(watchlist_id)
        return jsonify(details)

    elif request.method == 'PUT':
        data = request.get_json()
        if 'name' in data:
            watchlist.name = data['name']
        # Add/remove symbols as needed
        success = save_watchlist(current_user, watchlist)
        if success:
            return jsonify({'message': 'Watchlist updated'})
        return jsonify({'message': 'Error updating watchlist'}), 500

    elif request.method == 'DELETE':
        # Delete logic would need to be implemented in quarks3
        return jsonify({'message': 'Delete not yet implemented'}), 501


# Watchlist Operations
@app.route('/api/watchlists/<int:watchlist_id>/add', methods=['POST'])
@token_required
def add_to_watchlist(current_user, watchlist_id):
    watchlist = load_watchlist(current_user, watchlist_id)
    if not watchlist:
        return jsonify({'message': 'Watchlist not found'}), 404

    data = request.get_json()
    watchlist.add_to_watchlist(data['symbol'], data.get('notes', ''))
    success = save_watchlist(current_user, watchlist)
    if success:
        return jsonify({'message': 'Symbol added to watchlist'})
    return jsonify({'message': 'Error updating watchlist'}), 500


@app.route('/api/watchlists/<int:watchlist_id>/remove', methods=['POST'])
@token_required
def remove_from_watchlist(current_user, watchlist_id):
    watchlist = load_watchlist(current_user, watchlist_id)
    if not watchlist:
        return jsonify({'message': 'Watchlist not found'}), 404

    data = request.get_json()
    watchlist.remove_from_watchlist(data['symbol'])
    success = save_watchlist(current_user, watchlist)
    if success:
        return jsonify({'message': 'Symbol removed from watchlist'})
    return jsonify({'message': 'Error updating watchlist'}), 500


# Strategy Routes
@app.route('/api/strategies', methods=['GET', 'POST'])
@token_required
def strategies(current_user):
    strategy_manager = StrategyManager()

    if request.method == 'GET':
        success, strategies_list = strategy_manager.list_strategies(current_user)
        if success:
            return jsonify(strategies_list)
        return jsonify({'message': strategies_list}), 500

    elif request.method == 'POST':
        data = request.get_json()
        success, message = strategy_manager.create_strategy(
            current_user,
            data['portfolio_id'],
            data['name'],
            data['symbol'],
            data['strategy_type'],
            data['parameters']
        )
        if success:
            return jsonify({'message': message}), 201
        return jsonify({'message': message}), 400


@app.route('/api/strategies/<int:strategy_id>', methods=['GET', 'PUT', 'DELETE'])
@token_required
def strategy(current_user, strategy_id):
    strategy_manager = StrategyManager()

    if request.method == 'GET':
        # Would need a get_strategy function in StrategyManager
        return jsonify({'message': 'Not implemented yet'}), 501

    elif request.method == 'PUT':
        data = request.get_json()
        # Would need an update_strategy function in StrategyManager
        return jsonify({'message': 'Not implemented yet'}), 501

    elif request.method == 'DELETE':
        success, message = strategy_manager.delete_strategy(current_user, strategy_id)
        if success:
            return jsonify({'message': message})
        return jsonify({'message': message}), 400


# Strategy Execution
@app.route('/api/strategies/<int:strategy_id>/execute', methods=['POST'])
@token_required
def execute_strategy(current_user, strategy_id):
    strategy_manager = StrategyManager()
    # Would need an execute_strategy function in StrategyManager
    return jsonify({'message': 'Not implemented yet'}), 501


# Market Data Routes
@app.route('/api/market/price/<symbol>', methods=['GET'])
@token_required
def get_price(current_user, symbol):
    price = get_stock_price(symbol, live=True)
    if price is None:
        return jsonify({'message': 'Could not fetch price'}), 404
    return jsonify({'symbol': symbol, 'price': price})


@app.route('/api/market/historical/<symbol>/<date>', methods=['GET'])
def get_historical_price_route(symbol, date):
    price = get_historical_price(symbol, date)
    if price is None:
        return jsonify({'message': 'Could not fetch historical price'}), 404
    return jsonify({'symbol': symbol, 'date': date, 'price': price})


# Advice Routes
@app.route('/api/advice/<symbol>', methods=['GET'])
def get_advice(symbol):
    try:
        advice_data = generate_advice_sheet(symbol)
        if 'error' in advice_data:
            return jsonify(advice_data), 404
        return jsonify(advice_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Backtest Routes
@app.route('/api/backtest', methods=['POST'])
def run_backtest():
    data = request.get_json()
    portfolio = Simulation(data.get('name', 'Backtest'), data.get('initial_cash', 100000))

    try:
        strategy_type = data['strategy_type']
        if strategy_type == 'MOMENTUM':
            results = portfolio.run_backtest(
                strategy=portfolio.momentum_strategy,
                symbol=data['symbol'],
                start_date=data['start_date'],
                end_date=data['end_date']
            )
        elif strategy_type == 'BOLLINGER':
            results = portfolio.run_backtest(
                strategy=portfolio.bollinger_bands_strategy,
                symbol=data['symbol'],
                start_date=data['start_date'],
                end_date=data['end_date']
            )
        elif strategy_type == 'MACROSS':
            results = portfolio.run_backtest(
                strategy=portfolio.moving_average_crossover,
                symbol=data['symbol'],
                start_date=data['start_date'],
                end_date=data['end_date']
            )
        elif strategy_type == 'QUARKS':
            results = portfolio.run_backtest(
                strategy=portfolio.adaptive_multi_strategy,  # Using the renamed adaptive_multi_strategy
                symbol=data['symbol'],
                start_date=data['start_date'],
                end_date=data['end_date']
            )
        else:
            return jsonify({'message': 'Invalid strategy type'}), 400

        return jsonify(results)
    except Exception as e:
        return jsonify({'message': str(e)}), 400


if __name__ == '__main__':
    app.run(debug=True)