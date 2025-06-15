'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/navigation/Navbar';
import Link from 'next/link';
import LoadingSpinner from '@/src/components/ui/LoadingSpinner';
import BacktestResultCard from '../../components/BacktestResultCard';
import Image from 'next/image';

// Define types for strategy parameters
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

export default function BacktestPage() {
  const [formData, setFormData] = useState({
    symbol: '',
    strategy_type: 'BOLLINGER',
    start_date: '',
    end_date: '',
    initial_cash: '100000'
  });
  const [params, setParams] = useState<{[key: string]: number}>({});
  const [showParams, setShowParams] = useState(false);
  const [backtestResult, setBacktestResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'strategy_type') {
      // Reset params when strategy changes
      const newParams: {[key: string]: number} = {};
      strategyParameters[value as keyof StrategyParams]?.forEach(param => {
        newParams[param.name] = param.defaultValue;
      });
      setParams(newParams);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleParamChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setParams(prev => ({
      ...prev,
      [name]: parseFloat(value)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.symbol || !formData.start_date || !formData.end_date) return;

    setLoading(true);
    setError('');
    
    try {
      const storedToken = localStorage.getItem('quarksFinanceToken');
      if (!storedToken) {
        router.push('/login');
        return;
      }

      const response = await fetch('https://thecodeworks.in/quarksfinance/api/backtest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': storedToken,
        },
        body: JSON.stringify({
          symbol: formData.symbol.toUpperCase(),
          strategy_type: formData.strategy_type,
          start_date: formData.start_date,
          end_date: formData.end_date,
          initial_cash: parseFloat(formData.initial_cash),
          ...params
        })
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      setBacktestResult(data);
    } catch (err: any) {
      setError(err.message || 'Failed to run backtest');
    } finally {
      setLoading(false);
    }
  };

// Initialize params when component mounts
useEffect(() => {
  const initialParams: {[key: string]: number} = {};
  strategyParameters[formData.strategy_type as keyof StrategyParams]?.forEach(param => {
    initialParams[param.name] = param.defaultValue;
  });
  setParams(initialParams);
}, [formData.strategy_type]);

  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      
      {/* Breadcrumb navigation */}
      <nav className="px-6 mt-4 flex items-center gap-4 text-sm">
        <Link href="/home" className="text-black text-2xl" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>Home</Link>
        <span className="text-black text-2xl" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>&gt;</span>
        <Link href="/backtest" className="text-black text-2xl" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>Backtests</Link>
      </nav>
      
      <div className="container mx-auto px-4 md:px-40 py-8">
        <div className="w-full px-4 mt-4">
          {/* Header Section */}
          <div className="flex items-center justify-between mb-24 bg-white rounded-lg p-8 relative overflow-hidden border shadow-sm" style={{ minHeight: '100px' }}>
            <div>
              <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'JetBrains Mono, monospace', color: '#4C555A' }}>
                Strategy~Backtests
              </h1>
              <p className="text-black" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '17px' }}>
                Test automated strategies against historical data for stocks
              </p>
            </div>
            <div className="absolute left-172 w-full h-full">
              <img 
                src="/images/backtests1.svg" 
                alt="Portfolio illustration" 
                className="scale-148"
              />
            </div>
          </div>
          
          <div className="max-w-xl mx-auto mb-12 bg-white p-8 rounded-xl border border-gray-200" style={{ fontFamily: 'Rubik, sans-serif'}}>
            <h2 className="text-xl font-bold mb-6">Configure Backtest</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label htmlFor="symbol" className="block text-sm font-medium text-gray-700 mb-1">Stock Symbol</label>
                  <input
                    type="text"
                    id="symbol"
                    name="symbol"
                    value={formData.symbol}
                    onChange={handleChange}
                    placeholder="Enter stock symbol (e.g., RELIANCE)"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 shadow-sm text-gray-800 bg-gray-50"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="strategy_type" className="block text-sm font-medium text-gray-700 mb-1">Strategy</label>
                  <select
                    id="strategy_type"
                    name="strategy_type"
                    value={formData.strategy_type}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 shadow-sm text-gray-800 bg-gray-50"
                    required
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
                    <option value="BUYHOLD">Buy and Hold</option>
                    <option value="QUARKS">Quarks Algorithm</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      id="start_date"
                      name="start_date"
                      value={formData.start_date}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 shadow-sm text-gray-800 bg-gray-50"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      id="end_date"
                      name="end_date"
                      value={formData.end_date}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 shadow-sm text-gray-800 bg-gray-50"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="initial_cash" className="block text-sm font-medium text-gray-700 mb-1">Initial Investment (₹)</label>
                  <input
                    type="number"
                    id="initial_cash"
                    name="initial_cash"
                    value={formData.initial_cash}
                    onChange={handleChange}
                    min="1000"
                    step="1000"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 shadow-sm text-gray-800 bg-gray-50"
                    required
                  />
                </div>
                
                {/* Strategy Parameters Section */}
                <div>
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
                      {strategyParameters[formData.strategy_type as keyof StrategyParams]?.map((param, index) => (
                        <div key={index}>
                          <label htmlFor={param.name} className="block text-sm font-medium text-gray-700 mb-1">
                            {param.label}
                          </label>
                          <input
                            type={param.type}
                            id={param.name}
                            name={param.name}
                            value={params[param.name] || param.defaultValue}
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
                      {strategyParameters[formData.strategy_type as keyof StrategyParams]?.length === 0 && (
                        <p className="text-sm text-gray-500">No parameters available for this strategy.</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <button 
                type="submit" 
                className="w-full px-6 py-3 text-white rounded-sm bg-[#DC4040] hover:bg-[#b93830] focus:outline-none focus:ring-2 focus:ring-gray-700 focus:ring-offset-2 disabled:opacity-50 shadow-sm transition-colors duration-200" 
                disabled={loading}
              >
                {loading ? 'Running Backtest...' : 'Run Backtest'}
              </button>
              
              <p className="text-xs text-gray-500 mt-2">Backtest results are simulated and should not be considered financial advice.</p>
            </form>
          </div>

          {loading && <LoadingSpinner/>}

          {error && (
            <div className="max-w-3xl mx-auto mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg shadow-sm" style={{ fontFamily: 'Rubik, sans-serif'}}>
              <div className="flex items-center">
                <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            </div>
          )}

          {backtestResult && <BacktestResultCard 
              result={backtestResult} 
              strategyType={formData.strategy_type}
            />}
        </div>
      </div>
    </main>
  );
}