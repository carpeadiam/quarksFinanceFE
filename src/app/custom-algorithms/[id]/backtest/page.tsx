"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Navbar from '../../../../components/navigation/Navbar';
import Link from 'next/link';
import axios from 'axios';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import LoadingSpinner from '../../../../components/ui/LoadingSpinner';
import BacktestResultCard from '../../../../components/BacktestResultCard';

// API functions inlined
const API_URL = 'https://thecodeworks.in/quarksfinance/api';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('quarksFinanceToken');
    if (token) {
      config.headers['x-access-token'] = token;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const getAlgorithm = async (algorithmId: string) => {
  const response = await api.get(`/algorithms/${algorithmId}`);
  return response.data;
};

const backtestAlgorithm = async (algorithmId: string, backtestParams: {
  symbol: string;
  start_date: string;
  end_date: string;
  initial_cash: number;
}) => {
  const response = await api.post(`/algorithms/${algorithmId}/backtest`, backtestParams);
  return response.data;
};

interface Algorithm {
  id: string;
  name: string;
  description: string;
  created_date: string;
  updated_date: string;
}

interface BacktestResult {
  success: boolean;
  symbol: string;
  data_points: number;
  period: string;
  result: {
    initial_cash: number;
    final_value: number;
    return: number;
    performance_metrics: {
      total_return: number;
      annualized_return: number;
      volatility: number;
      sharpe_ratio: number;
      sortino_ratio: number;
      max_drawdown: number;
      total_trades: number;
      win_rate: number;
      profit_factor: number;
    };
    price_history: Record<string, number>;
    transactions: Array<{
      date: string;
      timestamp: string;
      type: string;
      symbol: string;
      price: number;
      quantity: number;
    }>;
  };
}

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const AlgorithmBacktestPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const algorithmId = params.id as string;
  
  const [algorithm, setAlgorithm] = useState<Algorithm | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [backtesting, setBacktesting] = useState<boolean>(false);
  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  
  const [formData, setFormData] = useState({
    symbol: '',
    start_date: '',
    end_date: '',
    initial_cash: '100000'
  });

  useEffect(() => {
    const storedToken = localStorage.getItem('quarksFinanceToken');
    
    if (storedToken) {
      setIsLoggedIn(true);
      fetchAlgorithm();
    } else {
      router.push('/home');
    }
  }, [router, algorithmId]);

  const fetchAlgorithm = async (): Promise<void> => {
    try {
      setLoading(true);
      
      const response = await getAlgorithm(algorithmId);
      
      if (response.success) {
        setAlgorithm(response.algorithm);
      } else {
        setErrorMessage('Algorithm not found');
      }
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('quarksFinanceToken');
        setIsLoggedIn(false);
        router.push('/login');
        setErrorMessage('Session expired. Please log in again.');
        return;
      }
      setErrorMessage('Error fetching algorithm. Please try again.');
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.symbol || !formData.start_date || !formData.end_date) {
      setErrorMessage('Please fill in all required fields');
      return;
    }

    setBacktesting(true);
    setErrorMessage('');
    setBacktestResult(null);
    
    try {
      const response = await backtestAlgorithm(algorithmId, {
        symbol: formData.symbol.toUpperCase(),
        start_date: formData.start_date,
        end_date: formData.end_date,
        initial_cash: parseFloat(formData.initial_cash)
      });
      
      if (response.success) {
        setBacktestResult(response);
      } else {
        setErrorMessage(response.message || 'Backtest failed');
      }
    } catch (err: any) {
      setErrorMessage('Error running backtest. Please try again.');
      console.error("Backtest error:", err);
    } finally {
      setBacktesting(false);
    }
  };

  // Add useEffect for debugging raw transaction data
  useEffect(() => {
    if (backtestResult && backtestResult.result.transactions) {
      console.log("Raw Transaction Data:", backtestResult.result.transactions);
    }
  }, [backtestResult]);

  if (!isLoggedIn) {
    return null;
  }

  if (loading) {
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
      <nav className="px-6 mt-4 flex items-center gap-4 text-sm">
        <Link href="/home" className="text-black text-2xl" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>Home</Link>
        <span className="text-black text-2xl" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>&gt;</span>
        <Link href="/custom-algorithms" className="text-black text-2xl" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>Custom Algorithms</Link>
        <span className="text-black text-2xl" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>&gt;</span>
        <Link href={`/custom-algorithms/${algorithmId}`} className="text-black text-2xl" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>{algorithm.name}</Link>
        <span className="text-black text-2xl" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>&gt;</span>
        <span className="text-black text-2xl" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>Backtest</span>
      </nav>
      
      <div className="container mx-auto px-4 md:px-40 py-8">
        <div className="w-full px-4 mt-4">
          {/* Header Section */}
          <div className="flex items-center justify-between mb-24 bg-white rounded-lg p-8 relative overflow-hidden border shadow-sm" style={{ minHeight: '100px' }}>
            <div>
              <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'JetBrains Mono, monospace', color: '#4C555A' }}>
                Backtest~{algorithm.name}
              </h1>
              <p className="text-black" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '17px' }}>
                Test your custom algorithm against historical market data
              </p>
            </div>
            <div className="absolute left-172 w-full h-full">
              <img 
                src="/images/backtests1.svg" 
                alt="Backtest illustration" 
                className="scale-148"
              />
            </div>
          </div>

          {/* Error Messages */}
          {errorMessage && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg">
              {errorMessage}
            </div>
          )}

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Backtest Form */}
            <Card>
              <CardHeader>
                <CardTitle style={{ fontFamily: 'JetBrains Mono, monospace', color: '#4C555A' }}>
                  Backtest Configuration
                </CardTitle>
                <CardDescription style={{ fontFamily: 'Rubik, sans-serif' }}>
                  Configure the parameters for your algorithm backtest
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stock Symbol *
                    </label>
                    <input
                      type="text"
                      name="symbol"
                      value={formData.symbol}
                      onChange={handleInputChange}
                      placeholder="e.g., AAPL, GOOGL, MSFT"
                      className="w-full rounded-md border border-zinc-300 bg-blue-50 px-3 py-2 text-zinc-800 placeholder-zinc-500 ring-1 ring-transparent transition-shadow focus:outline-0 focus:ring-blue-700"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Date *
                      </label>
                      <input
                        type="date"
                        name="start_date"
                        value={formData.start_date}
                        onChange={handleInputChange}
                        className="w-full rounded-md border border-zinc-300 bg-blue-50 px-3 py-2 text-zinc-800 placeholder-zinc-500 ring-1 ring-transparent transition-shadow focus:outline-0 focus:ring-blue-700"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Date *
                      </label>
                      <input
                        type="date"
                        name="end_date"
                        value={formData.end_date}
                        onChange={handleInputChange}
                        className="w-full rounded-md border border-zinc-300 bg-blue-50 px-3 py-2 text-zinc-800 placeholder-zinc-500 ring-1 ring-transparent transition-shadow focus:outline-0 focus:ring-blue-700"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Initial Cash ($)
                    </label>
                    <input
                      type="number"
                      name="initial_cash"
                      value={formData.initial_cash}
                      onChange={handleInputChange}
                      min="1000"
                      step="1000"
                      className="w-full rounded-md border border-zinc-300 bg-blue-50 px-3 py-2 text-zinc-800 placeholder-zinc-500 ring-1 ring-transparent transition-shadow focus:outline-0 focus:ring-blue-700"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={backtesting}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {backtesting ? (
                      <>
                        <LoadingSpinner />
                        Running Backtest...
                      </>
                    ) : (
                      'Run Backtest'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Algorithm Summary */}
            <Card>
              <CardHeader>
                <CardTitle style={{ fontFamily: 'JetBrains Mono, monospace', color: '#4C555A' }}>
                  Algorithm Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-gray-600">Algorithm Name</div>
                  <div className="text-lg font-semibold">{algorithm.name}</div>
                </div>
                
                {algorithm.description && (
                  <div>
                    <div className="text-sm font-medium text-gray-600">Description</div>
                    <div className="text-sm text-gray-800">{algorithm.description}</div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">Buy Rules</div>
                    <div className="text-sm text-gray-600">Available</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">Sell Rules</div>
                    <div className="text-sm text-gray-600">Available</div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="text-sm font-medium text-gray-600 mb-2">Quick Start Tips</div>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Use popular stocks like AAPL, GOOGL, MSFT for better data</li>
                    <li>• Test with at least 1 year of historical data</li>
                    <li>• Start with $100,000 initial cash for realistic results</li>
                    <li>• Compare results across different time periods</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Backtest Results - Fixed to match new API structure */}
          {backtestResult && backtestResult.success && backtestResult.result && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'JetBrains Mono, monospace', color: '#4C555A' }}>
                Backtest Results
              </h2>
              <BacktestResultCard 
                result={{
                  return: backtestResult.result.return,
                  transactions: backtestResult.result.transactions?.map(transaction => {
                    // Calculate P/L for SELL transactions by tracking buy/sell pairs
                    let pl: number | undefined;
                    if (transaction.type === 'SELL') {
                      // Find the corresponding buy transaction
                      const buyTransactions = backtestResult.result.transactions
                        .filter(t => t.type === 'BUY' && new Date(t.date) < new Date(transaction.date))
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                      
                      if (buyTransactions.length > 0) {
                        const correspondingBuy = buyTransactions[0];
                        pl = (transaction.price - correspondingBuy.price) * transaction.quantity;
                      }
                    }
                    
                    return {
                      type: transaction.type,
                      symbol: transaction.symbol,
                      quantity: transaction.quantity,
                      price: transaction.price,
                      timestamp: transaction.timestamp,
                      pl: pl
                    };
                  }) || [],
                  graph_path: '',
                  price_history: backtestResult.result.price_history || {}
                }} 
                strategyType="CUSTOM"
              />
              
              {/* Add debugging for calculated total P/L */}
              {backtestResult.result.transactions && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-bold text-blue-800 mb-2">Debugging Information</h3>
                  <p className="text-sm text-blue-700">
                    API Total Return: {(backtestResult.result.return * 100).toFixed(2)}%
                  </p>
                  <p className="text-sm text-blue-700">
                    Initial Cash: ₹{backtestResult.result.initial_cash.toFixed(2)}
                  </p>
                  <p className="text-sm text-blue-700">
                    Final Value: ₹{backtestResult.result.final_value.toFixed(2)}
                  </p>
                  <details className="mt-2">
                    <summary className="cursor-pointer text-blue-600">Click to see raw data details</summary>
                    <div className="mt-2 text-xs">
                      <p>Price data keys (first 5): {JSON.stringify(Object.keys(backtestResult.result.price_history).slice(0, 5))}</p>
                      <p>Transaction timestamps (first 5): {JSON.stringify(backtestResult.result.transactions.map(t => t.timestamp).slice(0, 5))}</p>
                      <p>Data Points: {backtestResult.data_points}</p>
                      <p>Period: {backtestResult.period}</p>
                    </div>
                  </details>
                </div>
              )}
              
              {/* Additional Results Details */}
              <div className="mt-8 grid gap-6 md:grid-cols-2">
                {/* Trade Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>Trade Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Total Trades:</span>
                        <span className="font-semibold">{backtestResult.result.performance_metrics?.total_trades || backtestResult.result.transactions.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Win Rate:</span>
                        <span className="font-semibold">{((backtestResult.result.performance_metrics?.win_rate || 0) * 100).toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Profit Factor:</span>
                        <span className="font-semibold">{(backtestResult.result.performance_metrics?.profit_factor || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Buy Transactions:</span>
                        <span className="font-semibold text-green-600">{backtestResult.result.transactions.filter(t => t.type === 'BUY').length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Sell Transactions:</span>
                        <span className="font-semibold text-red-600">{backtestResult.result.transactions.filter(t => t.type === 'SELL').length}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Risk Metrics */}
                <Card>
                  <CardHeader>
                    <CardTitle>Risk Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Volatility:</span>
                        <span className="font-semibold">{((backtestResult.result.performance_metrics?.volatility || 0) * 100).toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Sharpe Ratio:</span>
                        <span className="font-semibold">{(backtestResult.result.performance_metrics?.sharpe_ratio || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Sortino Ratio:</span>
                        <span className="font-semibold">{(backtestResult.result.performance_metrics?.sortino_ratio || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Max Drawdown:</span>
                        <span className="font-semibold text-red-600">{((backtestResult.result.performance_metrics?.max_drawdown || 0) * 100).toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Annualized Return:</span>
                        <span className="font-semibold">{((backtestResult.result.performance_metrics?.annualized_return || 0) * 100).toFixed(2)}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Trades - Updated table without Symbol column */}
              {backtestResult.result.transactions && backtestResult.result.transactions.length > 0 && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Transaction History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-2">Date</th>
                            <th className="text-left py-3 px-2">Type</th>
                            <th className="text-right py-3 px-2">Price</th>
                            <th className="text-right py-3 px-2">Quantity</th>
                            <th className="text-right py-3 px-2">Total Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {backtestResult.result.transactions.map((transaction, index) => (
                            <tr key={index} className="border-b hover:bg-gray-50">
                              <td className="py-3 px-2">{new Date(transaction.date).toLocaleDateString()}</td>
                              <td className="py-3 px-2">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  transaction.type === 'BUY' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {transaction.type}
                                </span>
                              </td>
                              <td className="text-right py-3 px-2 font-mono">₹{transaction.price.toFixed(2)}</td>
                              <td className="text-right py-3 px-2 font-mono">{transaction.quantity.toLocaleString()}</td>
                              <td className="text-right py-3 px-2 font-mono font-semibold">
                                ₹{(transaction.price * transaction.quantity).toLocaleString('en-IN', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2
                                })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlgorithmBacktestPage;