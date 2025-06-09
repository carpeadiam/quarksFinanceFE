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
    strategy_type: 'BOLLINGER'
  });
  const [strategyStates, setStrategyStates] = useState<{[key: number]: {isActive: boolean, signal: string}}>({});
  
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
          parameters: {}
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
        strategy_type: 'BOLLINGER'
      });
      setShowCreateForm(false);
      
      // Refresh strategies
      fetchStrategies(token);
    } catch (err) {
      showMessage('Error creating strategy. Please try again.', true);
      console.error("Create strategy error:", err);
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
      case 'TREND_FOLLOWING':
        return 'bg-orange-100 text-orange-800';
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
        </select>
      </div>

      <div>
        <button
          onClick={createStrategy}
          disabled={!newStrategy.portfolio_id || !newStrategy.name || !newStrategy.symbol || loading}
          className="w-full bg-[#61C268] text-white py-2 px-4 rounded hover:bg-[#1C9B24] transition-colors disabled:cursor-not-allowed"
        >
          {loading ? 'Creating...' : 'Create Strategy'}
        </button>
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
                          <th className="text-center p-4">Toggle</th>
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
                              <td className="p-4 text-center">
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