"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../components/navigation/Navbar';

type Strategy = {
  id: number;
  is_active: number;
  last_executed: string | null;
  name: string;
  portfolio_name: string;
  portfolio_id: number;
  strategy_type: string;
  symbol: string;
  parameters?: any;
};

type StrategiesResponse = {
  data: Strategy[];
  hasStrategies: string;
};

type Portfolio = {
  id: number;
  name: string;
};

const LiveStrategiesPage: React.FC = () => {
  const router = useRouter();
  const baseURL = 'https://thecodeworks.in/quarksfinance/api';
  
  const [token, setToken] = useState<string>('');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<number | null>(null);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [filteredStrategies, setFilteredStrategies] = useState<Strategy[]>([]);
  const [hasStrategies, setHasStrategies] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
const [newStrategy, setNewStrategy] = useState({
  portfolio_id: '',
  name: '',
  symbol: '',
  strategy_type: 'BOLLINGER',
  parameters: {} as {[key: string]: number} // Initialize as empty object
});
  const [strategyStates, setStrategyStates] = useState<{[key: number]: {isActive: boolean, signal: string}}>({});

const [showParams, setShowParams] = useState(false);

  type StrategyParams = {
  [key: string]: {
    label: string;
    name: string;
    type: string;
    defaultValue: number;
    min: number;
    max: number;
    step?: number;
  }[];
};

const strategyParameters: StrategyParams = {
  MOMENTUM: [
    { label: 'Lookback Days', name: 'lookback_days', type: 'number', defaultValue: 14, min: 5, max: 100 },
    { label: 'Threshold', name: 'threshold', type: 'number', defaultValue: 0.05, min: 0.01, max: 0.2, step: 0.01 }
  ],
  BOLLINGER: [
    { label: 'Window', name: 'window', type: 'number', defaultValue: 20, min: 10, max: 50 },
    { label: 'Standard Deviations', name: 'num_std', type: 'number', defaultValue: 2, min: 1, max: 3, step: 0.1 }
  ],
  MACROSS: [
    { label: 'Short Window', name: 'short_window', type: 'number', defaultValue: 50, min: 5, max: 100 },
    { label: 'Long Window', name: 'long_window', type: 'number', defaultValue: 200, min: 50, max: 300 }
  ],
  RSI: [
    { label: 'RSI Window', name: 'rsi_window', type: 'number', defaultValue: 14, min: 5, max: 30 },
    { label: 'Overbought Level', name: 'overbought', type: 'number', defaultValue: 70, min: 50, max: 90 },
    { label: 'Oversold Level', name: 'oversold', type: 'number', defaultValue: 30, min: 10, max: 50 }
  ],
  MACD: [
    { label: 'Fast Period', name: 'fast', type: 'number', defaultValue: 12, min: 5, max: 25 },
    { label: 'Slow Period', name: 'slow', type: 'number', defaultValue: 26, min: 15, max: 50 },
    { label: 'Signal Period', name: 'signal', type: 'number', defaultValue: 9, min: 5, max: 20 }
  ],
  MEANREVERSION: [
    { label: 'Window', name: 'window', type: 'number', defaultValue: 20, min: 10, max: 50 },
    { label: 'Z-Score Threshold', name: 'z_threshold', type: 'number', defaultValue: 2, min: 1, max: 3, step: 0.1 }
  ],
  BREAKOUT: [
    { label: 'Window', name: 'window', type: 'number', defaultValue: 20, min: 10, max: 50 },
    { label: 'Multiplier', name: 'multiplier', type: 'number', defaultValue: 1.01, min: 1.001, max: 1.1, step: 0.001 }
  ],
  VOLUMESPIKE: [
    { label: 'Window', name: 'window', type: 'number', defaultValue: 20, min: 10, max: 50 },
    { label: 'Multiplier', name: 'multiplier', type: 'number', defaultValue: 2.5, min: 1.5, max: 5, step: 0.1 }
  ],
  KELTNER: [
    { label: 'Window', name: 'window', type: 'number', defaultValue: 20, min: 10, max: 50 },
    { label: 'ATR Multiplier', name: 'atr_multiplier', type: 'number', defaultValue: 2, min: 1, max: 3, step: 0.1 }
  ],
  STOCHASTIC: [
    { label: '%K Window', name: 'k_window', type: 'number', defaultValue: 14, min: 5, max: 30 },
    { label: '%D Window', name: 'd_window', type: 'number', defaultValue: 3, min: 2, max: 10 },
    { label: 'Overbought Level', name: 'overbought', type: 'number', defaultValue: 80, min: 70, max: 90 },
    { label: 'Oversold Level', name: 'oversold', type: 'number', defaultValue: 20, min: 10, max: 30 }
  ],
  PARABOLICSAR: [
    { label: 'Acceleration', name: 'acceleration', type: 'number', defaultValue: 0.02, min: 0.01, max: 0.1, step: 0.01 },
    { label: 'Maximum', name: 'maximum', type: 'number', defaultValue: 0.2, min: 0.1, max: 0.5, step: 0.01 }
  ],
  BUYHOLD: [],
  QUARKS: []
};

  
  // Check login status on component mount
  useEffect(() => {
    const storedToken = localStorage.getItem('quarksFinanceToken');
    console.log(storedToken);
    
    if (storedToken) {
      setToken(storedToken);
      setIsLoggedIn(true);
      fetchPortfolios(storedToken);
      fetchStrategies(storedToken); // Fetch all strategies initially
    } else {
      // Redirect to home page if not logged in (matching portfolio page)
      router.push('/home');
    }
  }, [router]);
  
  // Removed auto-refresh functionality

  // Filter strategies when portfolio selection changes
  useEffect(() => {
    if (selectedPortfolioId) {
      const filtered = strategies.filter(strategy => strategy.portfolio_id === selectedPortfolioId);
      setFilteredStrategies(filtered);
    } else {
      setFilteredStrategies(strategies);
    }
    // Initialize strategy states based on actual API data
    const states: {[key: number]: {isActive: boolean, signal: string}} = {};
    const strategiesToInit = selectedPortfolioId ? filteredStrategies : strategies;
    strategiesToInit.forEach(strategy => {
      states[strategy.id] = {
        isActive: strategy.is_active === 1, // Use actual API data
        signal: strategy.is_active === 1 ? getRandomSignal() : 'HOLD'
      };
    });
    setStrategyStates(states);
  }, [selectedPortfolioId, strategies]);
  
  const showMessage = (message: string, isError: boolean = false) => {
    if (isError) {
      setErrorMessage(message);
      setSuccessMessage('');
    } else {
      setSuccessMessage(message);
      setErrorMessage('');
    }
    
    // Clear messages after 3 seconds
    setTimeout(() => {
      setErrorMessage('');
      setSuccessMessage('');
    }, 3000);
  };
  
useEffect(() => {
  const initialParams: {[key: string]: number} = {};
  const paramsForStrategy = strategyParameters[newStrategy.strategy_type as keyof StrategyParams] || [];
  
  paramsForStrategy.forEach(param => {
    initialParams[param.name] = param.defaultValue;
  });
  
  setNewStrategy(prev => ({
    ...prev,
    parameters: initialParams
  }));
}, [newStrategy.strategy_type]);

// Add parameter change handler



  const fetchPortfolios = async (authToken: string) => {
    try {
      setLoading(true);
      
      const response = await fetch(`${baseURL}/portfolios`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': authToken
        }
      });
      
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          // Token expired or invalid
          localStorage.removeItem('quarksFinanceToken');
          setIsLoggedIn(false);
          router.push('/login');
          showMessage('Session expired. Please log in again.', true);
          return;
        }
        throw new Error(`API responded with status ${response.status}`);
      }
      
      const data = await response.json();
      console.log("API Response:", data); // Debug logging
      
      // Handle the portfolio data based on API response structure
      if (data && data.portfolios && Array.isArray(data.portfolios)) {
        setPortfolios(data.portfolios);
      } else if (Array.isArray(data)) {
        // Handle case where API directly returns an array
        setPortfolios(data);
      } else {
        console.error("Unexpected API response format:", data);
        showMessage('Failed to load portfolios: Invalid response format', true);
      }
    } catch (err) {
      showMessage('Error fetching portfolios. Please try again.', true);
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

const handleParamChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const { name, value } = e.target;
  setNewStrategy(prev => ({
    ...prev,
    parameters: {
      ...prev.parameters,
      [name]: parseFloat(value)
    }
  }));
};



  const deleteStrategy = async (strategyId: number) => {
  try {
    setLoading(true);
    const response = await fetch(`${baseURL}/strategies/${strategyId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-access-token': token
      }
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('quarksFinanceToken');
        setIsLoggedIn(false);
        router.push('/login');
        showMessage('Session expired. Please log in again.', true);
        return;
      }
      throw new Error(`API responded with status ${response.status}`);
    }

    const data = await response.json();
    
    // Update strategies list from API response
    if (data && data.data && Array.isArray(data.data)) {
      setStrategies(data.data);
      setHasStrategies(data.hasStrategies === "True" || data.data.length > 0);
    }
    
    showMessage('Strategy deleted successfully');
  } catch (err) {
    showMessage('Error deleting strategy. Please try again.', true);
    console.error("Delete strategy error:", err);
  } finally {
    setLoading(false);
  }
};

const confirmDelete = (strategyId: number, strategyName: string) => {
  if (window.confirm(`Are you sure you want to delete the strategy "${strategyName}"?`)) {
    deleteStrategy(strategyId);
  }
};


  
  const fetchStrategies = async (authToken: string) => {
    try {
      setLoading(true);
      // Using the general strategies endpoint as shown in tester file
      const response = await fetch(`${baseURL}/strategies`, {
        method: 'GET',
        headers: {
          'x-access-token': authToken
        }
      });
      
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          // Token expired or invalid
          localStorage.removeItem('quarksFinanceToken');
          setIsLoggedIn(false);
          router.push('/login');
          showMessage('Session expired. Please log in again.', true);
          return;
        }
        throw new Error(`API responded with status ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Strategies API Response:", data); // Debug logging
      
      // Handle different response formats
      if (data && data.data && Array.isArray(data.data)) {
        setStrategies(data.data);
        setHasStrategies(data.hasStrategies === "True" || data.data.length > 0);
      } else if (Array.isArray(data)) {
        // Handle case where API directly returns an array
        setStrategies(data);
        setHasStrategies(data.length > 0);
      } else {
        console.log("No strategies data found:", data);
        setStrategies([]);
        setHasStrategies(false);
      }
    } catch (err) {
      showMessage('Error fetching strategies. Please try again.', true);
      console.error("Fetch strategies error:", err);
      setStrategies([]);
      setHasStrategies(false);
    } finally {
      setLoading(false);
    }
  };
  
  const createStrategy = async () => {
    try {
      setLoading(true);
console.log("Creating strategy with:", {
  portfolio_id: parseInt(newStrategy.portfolio_id),
  name: newStrategy.name,
  symbol: newStrategy.symbol,
  strategy_type: newStrategy.strategy_type,
  parameters: newStrategy.parameters
});


    const response = await fetch(`${baseURL}/strategies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-access-token': token
      },
      body: JSON.stringify({
        portfolio_id: parseInt(newStrategy.portfolio_id),
        name: newStrategy.name,
        symbol: newStrategy.symbol,
        strategy_type: newStrategy.strategy_type,
        parameters: newStrategy.parameters // Include parameters in the request
      })
    });



      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('quarksFinanceToken');
          setIsLoggedIn(false);
          router.push('/login');
          showMessage('Session expired. Please log in again.', true);
          return;
        }
        throw new Error(`API responded with status ${response.status}`);
      }

      const data = await response.json();
      showMessage('Strategy created successfully');
      
      // Reset form and close
      setNewStrategy({
  portfolio_id: '',
  name: '',
  symbol: '',
  strategy_type: 'BOLLINGER',
  parameters: {} // Initialize as empty object
});
setShowCreateForm(false);
      
      // Refresh strategies
      fetchStrategies(token);
    } catch (err) {
      showMessage('Error creating strategy. Please try again.', true);
      console.error("Create strategy error:", err);
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleStrategyState = async (strategyId: number) => {
    try {
      const currentState = strategyStates[strategyId] || { isActive: false, signal: 'HOLD' };
      const newActiveState = !currentState.isActive;
      
      setLoading(true);
      const response = await fetch(`${baseURL}/strategies/${strategyId}/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': token
        },
        body: JSON.stringify({
          is_active: newActiveState
        })
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('quarksFinanceToken');
          setIsLoggedIn(false);
          router.push('/login');
          showMessage('Session expired. Please log in again.', true);
          return;
        }
        throw new Error(`API responded with status ${response.status}`);
      }

      const data = await response.json();
      
      // Update strategies list from API response
      if (data && data.data && Array.isArray(data.data)) {
        setStrategies(data.data);
        setHasStrategies(data.hasStrategies === "True" || data.data.length > 0);
      }
      
      // Update local state for immediate UI feedback
      setStrategyStates(prev => ({
        ...prev,
        [strategyId]: {
          isActive: newActiveState,
          signal: newActiveState ? getRandomSignal() : 'HOLD'
        }
      }));
      
      showMessage(`Strategy ${newActiveState ? 'activated' : 'deactivated'} successfully`);
    } catch (err) {
      showMessage('Error toggling strategy. Please try again.', true);
      console.error("Toggle strategy error:", err);
    } finally {
      setLoading(false);
    }
  };

  const getRandomSignal = () => {
    const signals = ['BUY', 'SELL', 'HOLD'];
    return signals[Math.floor(Math.random() * signals.length)];
  };

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'BUY':
        return 'bg-green-100 text-green-800';
      case 'SELL':
        return 'bg-red-100 text-red-800';
      case 'HOLD':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const handlePortfolioChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const portfolioId = e.target.value ? parseInt(e.target.value) : null;
    setSelectedPortfolioId(portfolioId);
  };
  
  const getStrategyTypeColor = (type: string) => {
  switch (type.toUpperCase()) {
    case 'MOMENTUM':
      return 'bg-blue-100 text-blue-800';
    case 'BOLLINGER':
      return 'bg-green-100 text-green-800';
    case 'MACROSS':
      return 'bg-purple-100 text-purple-800';
    case 'RSI':
      return 'bg-pink-100 text-pink-800';
    case 'MACD':
      return 'bg-indigo-100 text-indigo-800';
    case 'MEANREVERSION':
      return 'bg-yellow-100 text-yellow-800';
    case 'BREAKOUT':
      return 'bg-teal-100 text-teal-800';
    case 'VOLUMESPIKE':
      return 'bg-cyan-100 text-cyan-800';
    case 'KELTNER':
      return 'bg-amber-100 text-amber-800';
    case 'STOCHASTIC':
      return 'bg-lime-100 text-lime-800';
    case 'PARABOLICSAR':
      return 'bg-emerald-100 text-emerald-800';
    case 'TREND_FOLLOWING':
      return 'bg-orange-100 text-orange-800';
    case 'BUYHOLD':
      return 'bg-gray-100 text-gray-800';
    case 'QUARKS':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStrategyTypeDisplayName = (type: string) => {
  switch (type.toUpperCase()) {
    case 'BOLLINGER':
      return 'Bollinger Bands';
    case 'MACROSS':
      return 'Moving Average Crossover';
    case 'MOMENTUM':
      return 'Momentum';
    case 'RSI':
      return 'Relative Strength Index';
    case 'MACD':
      return 'Moving Average Convergence Divergence';
    case 'MEANREVERSION':
      return 'Mean Reversion';
    case 'BREAKOUT':
      return 'Breakout';
    case 'VOLUMESPIKE':
      return 'Volume Spike';
    case 'KELTNER':
      return 'Keltner Channels';
    case 'STOCHASTIC':
      return 'Stochastic Oscillator';
    case 'PARABOLICSAR':
      return 'Parabolic SAR';
    case 'TREND_FOLLOWING':
      return 'Trend Following';
    case 'BUYHOLD':
      return 'Buy and Hold';
    case 'QUARKS':
      return 'Quarks Strategy';
    default:
      return type;
  }
};
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };
  
  if (!isLoggedIn) {
    return null; // Will redirect in useEffect
  }

  const strategiesToShow = selectedPortfolioId ? filteredStrategies : strategies;
  
  return (
    <div className="min-h-screen bg-white text-gray-800">
      <Navbar />
      
      {/* Breadcrumb navigation */}
      <nav className="px-6 mt-4 flex items-center gap-4 text-sm">
        <Link href="/home" className="text-black text-2xl" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>Home</Link>
        <span className="text-black text-2xl" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>&gt;</span>
        <Link href="/strategies" className="text-black text-2xl" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>Live Strategies</Link>
      </nav>

      <div className="container mx-auto px-4 md:px-40 py-8">
      <div className="w-full px-4 mt-4">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-24 bg-white rounded-lg p-8 relative overflow-hidden border shadow-sm" style={{ minHeight: '100px' }}>
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'JetBrains Mono, monospace', color: '#4C555A' }}>
            Live Strategies
          </h1>
          <p className="text-black" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '17px' }}>
            Run live strategies connected to Portfolios and receives updates
          </p>
        </div>
        <div className="absolute left-172 w-full h-full">
          <img 
            src="/images/strategies1.svg" 
            alt="Portfolio illustration" 
            className="scale-148"
          />
        </div>
      </div>
      
      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 py-4" style={{ fontFamily: 'Rubik, sans-serif' }}>
        <div className="mb-8">
          
          
{/* Create Strategy Form - Always Visible, Two-Line Layout */}
<div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 ">
  <h3 className="text-xl font-bold mb-4">Create New Strategy</h3>
  
  <div className="space-y-4">
    {/* First Row */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Portfolio</label>
        <select
          value={newStrategy.portfolio_id}
          onChange={(e) => setNewStrategy({...newStrategy, portfolio_id: e.target.value})}
          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#41748D] focus:border-transparent outline-none"
        >
          <option value="">Select Portfolio</option>
          {portfolios.map((portfolio) => (
            <option key={portfolio.id} value={portfolio.id}>
              {portfolio.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Strategy Name</label>
        <input
          type="text"
          value={newStrategy.name}
          onChange={(e) => setNewStrategy({...newStrategy, name: e.target.value})}
          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#41748D] focus:border-transparent outline-none"
          placeholder="Enter strategy name"
        />
      </div>
    </div>

    {/* Second Row */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Symbol</label>
        <input
          type="text"
          value={newStrategy.symbol}
          onChange={(e) => setNewStrategy({...newStrategy, symbol: e.target.value.toUpperCase()})}
          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#41748D] focus:border-transparent outline-none"
          placeholder="e.g., AAPL, TSLA"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Strategy Type</label>
        <select
          value={newStrategy.strategy_type}
          onChange={(e) => setNewStrategy({...newStrategy, strategy_type: e.target.value})}
          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#41748D] focus:border-transparent outline-none"
        >
          <option value="BOLLINGER">Bollinger Bands</option>
  <option value="MOMENTUM">Momentum</option>
  <option value="MACROSS">Moving Average Crossover</option>
  <option value="RSI">Relative Strength Index (RSI)</option>
  <option value="MACD">Moving Average Convergence Divergence (MACD)</option>
  <option value="MEANREVERSION">Mean Reversion</option>
  <option value="BREAKOUT">Breakout</option>
  <option value="VOLUMESPIKE">Volume Spike</option>
  <option value="KELTNER">Keltner Channels</option>
  <option value="STOCHASTIC">Stochastic Oscillator</option>
  <option value="PARABOLICSAR">Parabolic SAR</option>

        </select>
      </div>

      {/* Add this after the strategy type select in the form */}


      <div>
        <button
          onClick={createStrategy}
          disabled={!newStrategy.portfolio_id || !newStrategy.name || !newStrategy.symbol || loading}
          className="w-full bg-[#61C268] text-white py-2 px-4 rounded hover:bg-[#1C9B24] transition-colors disabled:cursor-not-allowed"
        >
          {loading ? 'Creating...' : 'Create Strategy'}
        </button>
      </div>

      <div className="mt-4">
  <button
    type="button"
    onClick={() => setShowParams(!showParams)}
    className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none"
  >
    <span>Advanced Strategy Parameters</span>
    <svg
      className={`ml-2 h-4 w-4 transition-transform ${showParams ? 'rotate-180' : ''}`}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
        clipRule="evenodd"
      />
    </svg>
  </button>
  
{showParams && (
  <div className="mt-4 space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
    {strategyParameters[newStrategy.strategy_type as keyof StrategyParams]?.map((param, index) => (
      <div key={index}>
        <label htmlFor={param.name} className="block text-sm font-medium text-gray-700 mb-1">
          {param.label}
        </label>
        <input
          type={param.type}
          id={param.name}
          name={param.name}
          value={newStrategy.parameters?.[param.name] ?? param.defaultValue}
          onChange={handleParamChange}
          min={param.min}
          max={param.max}
          step={param.step || 1}
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 shadow-sm text-gray-800 bg-white"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Min: {param.min}</span>
          <span>Default: {param.defaultValue}</span>
          <span>Max: {param.max}</span>
        </div>
      </div>
    ))}
    {strategyParameters[newStrategy.strategy_type as keyof StrategyParams]?.length === 0 && (
      <p className="text-sm text-gray-500">No parameters available for this strategy.</p>
    )}
  </div>
)}
</div>
    </div>
  </div>
</div>
          {/* Portfolio Filter */}
          <div className="bg-white border rounded-lg p-4 mb-6">
            <label htmlFor="portfolio-select" className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Portfolio (Optional)
            </label>
            <select
              id="portfolio-select"
              value={selectedPortfolioId || ''}
              onChange={handlePortfolioChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#41748D] focus:border-transparent outline-none"
            >
              <option value="">All Portfolios</option>
              {portfolios.map((portfolio) => (
                <option key={portfolio.id} value={portfolio.id}>
                  {portfolio.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Loading state */}
          {loading && (
            <div className="text-center py-8">
              <p className="text-gray-600">Loading...</p>
            </div>
          )}
          
          {/* Strategies display */}
          {!loading && (
            <div>
              {hasStrategies && strategiesToShow.length > 0 ? (
                <div>
                  {/* Strategies header with refresh button */}
                  <div className="bg-[#1C9B24] text-white p-4 rounded-t-lg flex justify-between items-center">
                    <h2 className="text-xl font-medium">
                      {selectedPortfolioId ? 'Filtered ' : 'All '}Strategies ({strategiesToShow.length})
                    </h2>
                    <button 
                      onClick={() => fetchStrategies(token)}
                      className="text-white hover:text-gray-200"
                      aria-label="Refresh strategies"
                    >
                      ⟳
                    </button>
                  </div>
                  
                  {/* Strategies table */}
                  <div className="border border-t-0 rounded-b-lg overflow-hidden">
                    <table className="w-full border-collapse">
                      <thead>
  <tr className="border-b bg-gray-50">
    <th className="text-left p-4 border-r">Strategy Name</th>
    <th className="text-left p-4 border-r">Symbol</th>
    <th className="text-left p-4 border-r">Type</th>
    <th className="text-left p-4 border-r">Portfolio</th>
    <th className="text-left p-4 border-r">Status</th>
    <th className="text-left p-4 border-r">Last Executed</th>
    <th className="text-center p-4 border-r">Toggle</th>
    <th className="text-center p-4">Actions</th>
  </tr>
</thead>
                      <tbody>
                        {strategiesToShow.map((strategy) => {
                          const strategyState = strategyStates[strategy.id] || { isActive: false, signal: 'HOLD' };
                          return (
                            <tr key={strategy.id} className="border-b hover:bg-gray-50">
  <td className="p-4 border-r font-medium">{strategy.name}</td>
  <td className="p-4 border-r">
    <span className="bg-gray-100 px-2 py-1 rounded text-sm">
      {strategy.symbol}
    </span>
  </td>
  <td className="p-4 border-r">
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStrategyTypeColor(strategy.strategy_type)}`}>
      {getStrategyTypeDisplayName(strategy.strategy_type)}
    </span>
  </td>
  <td className="p-4 border-r">{strategy.portfolio_name}</td>
  <td className="p-4 border-r">
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
      strategyState.isActive
        ? 'bg-green-100 text-green-800' 
        : 'bg-red-100 text-red-800'
    }`}>
      {strategyState.isActive ? 'Active' : 'Inactive'}
    </span>
  </td>
  <td className="p-4 border-r">
  {formatDate(strategy.last_executed)}
</td>
  <td className="p-4 text-center border-r">
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        checked={strategyState.isActive}
        onChange={() => toggleStrategyState(strategy.id)}
        disabled={loading}
        className="sr-only peer"
      />
      <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#41748D] ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
    </label>
  </td>
  <td className="p-4 text-center">
    <button 
      onClick={() => confirmDelete(strategy.id, strategy.name)}
      className="text-red-500 hover:text-red-700"
      disabled={loading}
      aria-label="Delete strategy"
    >
<svg 
  xmlns="http://www.w3.org/2000/svg" 
  className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors duration-200" 
  viewBox="0 0 20 20" 
  fill="currentColor"
>
  <path 
    fillRule="evenodd" 
    d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" 
    clipRule="evenodd" 
  />
</svg>
    </button>
  </td>
</tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <div className="text-gray-400 text-6xl mb-4">📈</div>
                  <h3 className="text-xl font-medium text-gray-600 mb-2">No Strategies Found</h3>
                  <p className="text-gray-500">
                    {selectedPortfolioId 
                      ? 'No trading strategies are currently configured for this portfolio.'
                      : 'No trading strategies are currently configured.'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      
      {/* Notifications */}
      {errorMessage && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white p-3 rounded shadow-md z-50">
          {errorMessage}
        </div>
      )}
      
      {successMessage && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white p-3 rounded shadow-md z-50">
          {successMessage}
        </div>
      )}
    </div>
    </div>
    </div>
  );
};

export default LiveStrategiesPage;