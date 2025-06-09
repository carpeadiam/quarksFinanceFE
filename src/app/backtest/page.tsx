'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/navigation/Navbar';
import Link from 'next/link';
import LoadingSpinner from '@/src/components/ui/LoadingSpinner';
import BacktestResultCard from '../../components/BacktestResultCard';
import Image from 'next/image';

export default function BacktestPage() {
  const [formData, setFormData] = useState({
    symbol: '',
    strategy_type: 'BOLLINGER',
    start_date: '',
    end_date: '',
    initial_cash: '100000'
  });
  const [backtestResult, setBacktestResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.symbol || !formData.start_date || !formData.end_date) return;

    setLoading(true);
    setError('');
    
    try {

    const storedToken = localStorage.getItem('quarksFinanceToken');
    console.log(storedToken);
    
    if (!storedToken) {
  router.push('/login');
  return; // Exit early
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
          initial_cash: parseFloat(formData.initial_cash)
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
            Test automated strategies against histroical data for stocks
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

        {loading && (
          <LoadingSpinner/>
        )}

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