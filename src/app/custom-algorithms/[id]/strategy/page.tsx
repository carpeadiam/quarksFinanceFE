"use client";
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../../../components/navigation/Navbar';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import LoadingSpinner from '../../../../components/ui/LoadingSpinner';

// Types
interface Algorithm {
  id: string;
  name: string;
  description: string;
  created_date: string;
  updated_date: string;
}

interface Portfolio {
  id: number;
  name: string;
}

interface Strategy {
  id: number;
  name: string;
  symbol: string;
  strategy_type: string;
  portfolio_name: string;
  portfolio_id: number;
  is_active: number;
  last_executed: string | null;
  algorithm_id?: string; // Add algorithm_id field
  parameters?: any;
}

const AlgorithmStrategyPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const algorithmId = params.id as string;
  const baseURL = 'https://thecodeworks.in/quarksfinance/api';
  
  // State
  const [algorithm, setAlgorithm] = useState<Algorithm | null>(null);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [token, setToken] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  
  // Form state
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [newStrategy, setNewStrategy] = useState({
    portfolio_id: '',
    name: '',
    symbol: ''
  });

  // Check login and fetch data
  useEffect(() => {
    const storedToken = localStorage.getItem('quarksFinanceToken');
    
    if (storedToken) {
      setToken(storedToken);
      setIsLoggedIn(true);
      fetchAlgorithm(storedToken);
      fetchPortfolios(storedToken);
      fetchStrategies(storedToken);
    } else {
      router.push('/login');
    }
  }, [router, algorithmId]);

  const showMessage = (message: string, isError: boolean = false) => {
    if (isError) {
      setErrorMessage(message);
      setSuccessMessage('');
    } else {
      setSuccessMessage(message);
      setErrorMessage('');
    }
    
    setTimeout(() => {
      setErrorMessage('');
      setSuccessMessage('');
    }, 5000);
  };

  const fetchAlgorithm = async (authToken: string) => {
    try {
      const response = await fetch(`${baseURL}/algorithms/${algorithmId}`, {
        method: 'GET',
        headers: {
          'x-access-token': authToken
        }
      });
      
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('quarksFinanceToken');
          setIsLoggedIn(false);
          router.push('/login');
          return;
        }
        throw new Error(`API responded with status ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success) {
        setAlgorithm(data.algorithm);
      } else {
        showMessage('Algorithm not found', true);
      }
    } catch (err) {
      showMessage('Error fetching algorithm details', true);
      console.error("Fetch algorithm error:", err);
    }
  };

  const fetchPortfolios = async (authToken: string) => {
    try {
      const response = await fetch(`${baseURL}/portfolios`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': authToken
        }
      });
      
      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}`);
      }
      
      const data = await response.json();
      if (data && data.portfolios && Array.isArray(data.portfolios)) {
        setPortfolios(data.portfolios);
      } else if (Array.isArray(data)) {
        setPortfolios(data);
      }
    } catch (err) {
      showMessage('Error fetching portfolios', true);
      console.error("Fetch portfolios error:", err);
    }
  };

  const fetchStrategies = async (authToken: string) => {
    try {
      const response = await fetch(`${baseURL}/custom-strategies`, {
        method: 'GET',
        headers: {
          'x-access-token': authToken
        }
      });
      
      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && data.hasStrategies === 'True' && Array.isArray(data.data)) {
        // Filter strategies for this specific algorithm
        const algorithmStrategies = data.data.filter((strategy: Strategy) => 
          strategy.algorithm_id === algorithmId
        );
        setStrategies(algorithmStrategies);
      } else {
        setStrategies([]);
      }
    } catch (err) {
      showMessage('Error fetching strategies', true);
      console.error("Fetch strategies error:", err);
    } finally {
      setLoading(false);
    }
  };

  const createStrategy = async () => {
    try {
      setLoading(true);
      
      // Validation
      if (!newStrategy.portfolio_id || !newStrategy.name || !newStrategy.symbol) {
        showMessage('Please fill in all required fields', true);
        setLoading(false);
        return;
      }

      if (!algorithm) {
        showMessage('Algorithm not found', true);
        setLoading(false);
        return;
      }
      
      const requestData = {
        portfolio_id: parseInt(newStrategy.portfolio_id),
        name: newStrategy.name.trim(),
        symbol: newStrategy.symbol.trim().toUpperCase(),
        algorithm_id: algorithmId,
        parameters: {
          algorithm_id: algorithmId
        }
      };
      
      console.log("Creating custom algorithm strategy:", requestData);
      
      const response = await fetch(`${baseURL}/custom-strategies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': token
        },
        body: JSON.stringify(requestData)
      });
      
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('quarksFinanceToken');
          setIsLoggedIn(false);
          router.push('/login');
          return;
        }
        
        const errorText = await response.text();
        console.error('Error response:', errorText);
        
        let errorMessage = 'Error creating strategy';
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (e) {
          errorMessage = errorText || `HTTP ${response.status}`;
        }
        
        showMessage(errorMessage, true);
        return;
      }
      
      showMessage('Live strategy created successfully!');
      
      // Reset form
      setNewStrategy({
        portfolio_id: '',
        name: '',
        symbol: ''
      });
      setShowCreateForm(false);
      
      // Refresh strategies
      fetchStrategies(token);
    } catch (err) {
      console.error("Create strategy error:", err);
      showMessage('Error creating strategy', true);
    } finally {
      setLoading(false);
    }
  };

  const toggleStrategy = async (strategyId: number, currentActive: boolean) => {
    try {
      setLoading(true);
      
      const response = await fetch(`${baseURL}/custom-strategies/${strategyId}/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': token
        },
        body: JSON.stringify({
          is_active: !currentActive
        })
      });

      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}`);
      }

      showMessage(`Strategy ${!currentActive ? 'activated' : 'deactivated'} successfully`);
      fetchStrategies(token);
    } catch (err) {
      showMessage('Error toggling strategy', true);
      console.error("Toggle strategy error:", err);
    } finally {
      setLoading(false);
    }
  };

  const deleteStrategy = async (strategyId: number) => {
    if (!window.confirm('Are you sure you want to delete this strategy?')) {
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch(`${baseURL}/custom-strategies/${strategyId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': token
        }
      });

      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}`);
      }

      showMessage('Strategy deleted successfully');
      fetchStrategies(token);
    } catch (err) {
      showMessage('Error deleting strategy', true);
      console.error("Delete strategy error:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  if (!isLoggedIn) {
    return null;
  }

  if (loading && !algorithm) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (!algorithm) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="container mx-auto px-4 md:px-40 py-8">
          <Card className="p-8 text-center">
            <CardContent>
              <h3 className="text-xl font-semibold mb-4" style={{ fontFamily: 'JetBrains Mono, monospace', color: '#4C555A' }}>
                Algorithm Not Found
              </h3>
              <p className="text-gray-600 mb-6" style={{ fontFamily: 'Rubik, sans-serif' }}>
                The algorithm you're looking for doesn't exist or you don't have permission to view it.
              </p>
              <Link href="/custom-algorithms">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  Back to Algorithms
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Breadcrumb */}
      <nav className="px-6 mt-4 flex items-center gap-4 text-sm">
        <Link href="/home" className="text-black text-2xl" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>Home</Link>
        <span className="text-black text-2xl" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>&gt;</span>
        <Link href="/custom-algorithms" className="text-black text-2xl" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>Custom Algorithms</Link>
        <span className="text-black text-2xl" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>&gt;</span>
        <Link href={`/custom-algorithms/${algorithmId}`} className="text-black text-2xl" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>{algorithm.name}</Link>
        <span className="text-black text-2xl" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>&gt;</span>
        <span className="text-black text-2xl" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>Live Strategy</span>
      </nav>
      
      <div className="container mx-auto px-4 md:px-40 py-8">
        <div className="w-full px-4 mt-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-12 bg-white rounded-lg p-8 relative overflow-hidden border shadow-sm">
            <div>
              <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'JetBrains Mono, monospace', color: '#4C555A' }}>
                Live Strategy~{algorithm.name}
              </h1>
              <p className="text-black" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '17px' }}>
                Deploy your custom algorithm as a live trading strategy
              </p>
            </div>
            <div className="absolute left-172 w-full h-full">
              <img 
                src="/images/strategies1.svg" 
                alt="Strategy illustration" 
                className="scale-148"
              />
            </div>
          </div>

          {/* Error/Success Messages */}
          {errorMessage && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg">
              {errorMessage}
            </div>
          )}
          
          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg">
              {successMessage}
            </div>
          )}

          {/* Create Strategy Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle style={{ fontFamily: 'JetBrains Mono, monospace', color: '#4C555A' }}>
                Create Live Strategy
              </CardTitle>
              <CardDescription style={{ fontFamily: 'Rubik, sans-serif' }}>
                Deploy this algorithm as an automated trading strategy
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!showCreateForm ? (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">Algorithm Details</h4>
                    <p className="text-sm text-blue-700 mb-2"><strong>Name:</strong> {algorithm.name}</p>
                    <p className="text-sm text-blue-700 mb-2"><strong>Description:</strong> {algorithm.description}</p>
                    <p className="text-sm text-blue-700"><strong>Created:</strong> {new Date(algorithm.created_date).toLocaleDateString()}</p>
                  </div>
                  
                  <Button 
                    onClick={() => setShowCreateForm(true)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Create Live Strategy
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Portfolio *
                      </label>
                      <select
                        value={newStrategy.portfolio_id}
                        onChange={(e) => setNewStrategy({...newStrategy, portfolio_id: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Strategy Name *
                      </label>
                      <input
                        type="text"
                        value={newStrategy.name}
                        onChange={(e) => setNewStrategy({...newStrategy, name: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        placeholder={`${algorithm.name} Live Strategy`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stock Symbol *
                    </label>
                    <input
                      type="text"
                      value={newStrategy.symbol}
                      onChange={(e) => setNewStrategy({...newStrategy, symbol: e.target.value.toUpperCase()})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="e.g., AAPL, GOOGL, TSLA"
                    />
                  </div>

                  <div className="flex gap-4">
                    <Button 
                      onClick={createStrategy}
                      disabled={loading}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {loading ? <LoadingSpinner /> : 'Create Strategy'}
                    </Button>
                    
                    <Button 
                      onClick={() => setShowCreateForm(false)}
                      className="bg-gray-500 hover:bg-gray-600 text-white"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Existing Strategies */}
          <Card>
            <CardHeader>
              <CardTitle style={{ fontFamily: 'JetBrains Mono, monospace', color: '#4C555A' }}>
                Live Strategies ({strategies.length})
              </CardTitle>
              <CardDescription style={{ fontFamily: 'Rubik, sans-serif' }}>
                Active strategies using this algorithm
              </CardDescription>
            </CardHeader>
            <CardContent>
              {strategies.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No live strategies created yet.</p>
                  <p className="text-sm mt-2">Create your first strategy to start automated trading.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left p-4">Strategy Name</th>
                        <th className="text-left p-4">Symbol</th>
                        <th className="text-left p-4">Portfolio</th>
                        <th className="text-left p-4">Status</th>
                        <th className="text-left p-4">Last Executed</th>
                        <th className="text-center p-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {strategies.map((strategy) => (
                        <tr key={strategy.id} className="border-b hover:bg-gray-50">
                          <td className="p-4 font-medium">{strategy.name}</td>
                          <td className="p-4">
                            <span className="bg-gray-100 px-2 py-1 rounded text-sm">
                              {strategy.symbol}
                            </span>
                          </td>
                          <td className="p-4">{strategy.portfolio_name}</td>
                          <td className="p-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              strategy.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {strategy.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="p-4 text-sm text-gray-600">
                            {formatDate(strategy.last_executed)}
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex justify-center gap-2">
                              <Button
                                onClick={() => toggleStrategy(strategy.id, !!strategy.is_active)}
                                disabled={loading}
                                className={`text-xs px-3 py-1 ${
                                  strategy.is_active 
                                    ? 'bg-orange-500 hover:bg-orange-600' 
                                    : 'bg-green-500 hover:bg-green-600'
                                } text-white`}
                              >
                                {strategy.is_active ? 'Pause' : 'Start'}
                              </Button>
                              
                              <Button
                                onClick={() => deleteStrategy(strategy.id)}
                                disabled={loading}
                                className="text-xs px-3 py-1 bg-red-500 hover:bg-red-600 text-white"
                              >
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Info Section */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle style={{ fontFamily: 'JetBrains Mono, monospace', color: '#4C555A' }}>
                How Live Strategies Work
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-green-600 mb-2">🎯 Automated Execution</h4>
                  <p className="text-sm text-gray-600">
                    Your algorithm runs continuously on live market data, generating buy/sell signals automatically.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-blue-600 mb-2">📊 Portfolio Integration</h4>
                  <p className="text-sm text-gray-600">
                    Trades execute directly in your selected portfolio with real-time position tracking.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-purple-600 mb-2">⚡ Real-time Monitoring</h4>
                  <p className="text-sm text-gray-600">
                    Monitor strategy performance, execution history, and adjust parameters as needed.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-orange-600 mb-2">🛡️ Risk Management</h4>
                  <p className="text-sm text-gray-600">
                    Built-in safeguards prevent over-trading and respect your algorithm's risk parameters.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AlgorithmStrategyPage;