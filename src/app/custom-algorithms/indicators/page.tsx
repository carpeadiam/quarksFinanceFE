"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from '../../../components/navigation/Navbar';
import Link from 'next/link';
import axios from 'axios';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import TerminalManager from '../../../components/ui/TerminalManager';

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

const getAvailableIndicators = async () => {
  const response = await api.get('/algorithms/indicators');
  return response.data;
};

interface IndicatorParameter {
  type: string;
  default: any;
  min?: number;
  max?: number;
  options?: string[];
}

interface Indicator {
  name: string;
  description: string;
  parameters: Record<string, IndicatorParameter>;
}

const IndicatorsPage: React.FC = () => {
  const router = useRouter();
  const [indicators, setIndicators] = useState<Record<string, Indicator>>({});
  const [comparisons, setComparisons] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showTerminal, setShowTerminal] = useState<boolean>(false);

  // Add keyboard event listener for terminal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Shift+T (terminal)
      if (e.shiftKey && e.key === 'T') {
        e.preventDefault();
        setShowTerminal(true);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const storedToken = localStorage.getItem('quarksFinanceToken');
    
    if (storedToken) {
      setIsLoggedIn(true);
      fetchIndicators();
    } else {
      router.push('/home');
    }
  }, [router]);

  const fetchIndicators = async (): Promise<void> => {
    try {
      setLoading(true);
      
      const response = await getAvailableIndicators();
      
      if (response.success) {
        setIndicators(response.indicators || {});
        setComparisons(response.comparisons || {});
      }
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('quarksFinanceToken');
        setIsLoggedIn(false);
        router.push('/login');
        setErrorMessage('Session expired. Please log in again.');
        return;
      }
      setErrorMessage('Error fetching indicators. Please try again.');
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const categorizeIndicators = () => {
    const categories = {
      momentum: ['RSI', 'STOCHASTIC', 'WILLIAMS_R', 'CCI', 'MFI'],
      trend: ['SMA', 'EMA', 'MACD', 'ADX', 'BOLLINGER'],
      volume: ['OBV', 'VWAP', 'VOLUME'],
      other: ['PRICE']
    };

    const categorized: Record<string, Record<string, Indicator>> = {
      momentum: {},
      trend: {},
      volume: {},
      other: {}
    };

    Object.entries(indicators).forEach(([key, indicator]) => {
      let category = 'other';
      for (const [cat, indicators] of Object.entries(categories)) {
        if (indicators.includes(key)) {
          category = cat;
          break;
        }
      }
      categorized[category][key] = indicator;
    });

    return categorized;
  };

  const filterIndicators = (indicators: Record<string, Indicator>) => {
    if (!searchTerm) return indicators;
    
    return Object.fromEntries(
      Object.entries(indicators).filter(([key, indicator]) =>
        key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        indicator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        indicator.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  };

  const renderParameterValue = (param: IndicatorParameter) => {
    if (param.options) {
      return `Options: ${param.options.join(', ')}`;
    }
    
    let value = `Default: ${param.default}`;
    if (param.min !== undefined && param.max !== undefined) {
      value += ` (Range: ${param.min}-${param.max})`;
    }
    return value;
  };

  if (!isLoggedIn) {
    return null;
  }

  const categorizedIndicators = categorizeIndicators();
  const categoryNames = {
    momentum: 'Momentum Indicators',
    trend: 'Trend Indicators', 
    volume: 'Volume Indicators',
    other: 'Other Indicators'
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <nav className="px-6 mt-4 flex items-center gap-4 text-sm">
        <Link href="/home" className="text-black text-2xl" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>Home</Link>
        <span className="text-black text-2xl" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>&gt;</span>
        <Link href="/custom-algorithms" className="text-black text-2xl" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>Custom Algorithms</Link>
        <span className="text-black text-2xl" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>&gt;</span>
        <Link href="/custom-algorithms/indicators" className="text-black text-2xl" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>Indicators</Link>
      </nav>
      
      <div className="container mx-auto px-4 md:px-40 py-8">
        <div className="w-full px-4 mt-4">
          {/* Header Section */}
          <div className="flex items-center justify-between mb-24 bg-white rounded-lg p-8 relative overflow-hidden border shadow-sm" style={{ minHeight: '100px' }}>
            <div>
              <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'JetBrains Mono, monospace', color: '#4C555A' }}>
                Technical~Indicators
              </h1>
              <p className="text-black" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '17px' }}>
                Explore available technical indicators for building your custom algorithms
              </p>
            </div>
            <div className="absolute left-172 w-full h-full">
              <img 
                src="/images/indicators.svg" 
                alt="Indicators illustration" 
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

          {/* Back Button and Search */}
          <div className="mb-8 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <Link href="/custom-algorithms">
              <Button variant="outline">
                ← Back to Algorithms
              </Button>
            </Link>
            
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Search indicators..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="rounded-md border border-zinc-300 bg-blue-50 px-3 py-2 text-zinc-800 placeholder-zinc-500 ring-1 ring-transparent transition-shadow focus:outline-0 focus:ring-blue-700"
              />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="rounded-md border border-zinc-300 bg-blue-50 px-3 py-2 text-zinc-800"
              >
                <option value="all">All Categories</option>
                <option value="momentum">Momentum</option>
                <option value="trend">Trend</option>
                <option value="volume">Volume</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner />
            </div>
          )}

          {/* Indicators Display */}
          {!loading && (
            <div className="space-y-8">
              {/* Comparison Operators Info */}
              <Card>
                <CardHeader>
                  <CardTitle style={{ fontFamily: 'JetBrains Mono, monospace', color: '#4C555A' }}>
                    Available Comparison Operators
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {Object.entries(comparisons).map(([operator, description]) => (
                      <div key={operator} className="text-sm">
                        <code className="bg-gray-100 px-2 py-1 rounded font-mono">{operator}</code>
                        <p className="text-gray-600 mt-1">{description}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Indicators by Category */}
              {Object.entries(categoryNames).map(([categoryKey, categoryName]) => {
                if (selectedCategory !== 'all' && selectedCategory !== categoryKey) return null;
                
                const categoryIndicators = filterIndicators(categorizedIndicators[categoryKey]);
                
                if (Object.keys(categoryIndicators).length === 0) return null;

                return (
                  <div key={categoryKey}>
                    <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'JetBrains Mono, monospace', color: '#4C555A' }}>
                      {categoryName}
                    </h2>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {Object.entries(categoryIndicators).map(([key, indicator]) => (
                        <Card key={key} className="hover:shadow-lg transition-shadow duration-200">
                          <CardHeader>
                            <CardTitle style={{ fontFamily: 'JetBrains Mono, monospace', color: '#4C555A' }}>
                              <code className="bg-gray-100 px-2 py-1 rounded text-sm">{key}</code>
                            </CardTitle>
                            <CardTitle className="text-lg">{indicator.name}</CardTitle>
                            <CardDescription style={{ fontFamily: 'Rubik, sans-serif' }}>
                              {indicator.description}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            {Object.keys(indicator.parameters).length > 0 ? (
                              <div>
                                <h4 className="font-medium mb-3">Parameters:</h4>
                                <div className="space-y-2">
                                  {Object.entries(indicator.parameters).map(([paramKey, param]) => (
                                    <div key={paramKey} className="text-sm">
                                      <div className="font-medium">{paramKey}</div>
                                      <div className="text-gray-600">{renderParameterValue(param)}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm text-gray-600">No parameters required</p>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* No Results */}
              {selectedCategory === 'all' && searchTerm && 
               Object.values(categorizedIndicators).every(category => 
                 Object.keys(filterIndicators(category)).length === 0
               ) && (
                <Card className="p-8 text-center">
                  <CardContent>
                    <h3 className="text-xl font-semibold mb-4" style={{ fontFamily: 'JetBrains Mono, monospace', color: '#4C555A' }}>
                      No Indicators Found
                    </h3>
                    <p className="text-gray-600" style={{ fontFamily: 'Rubik, sans-serif' }}>
                      No indicators match your search term "{searchTerm}". Try a different search.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
      
      <TerminalManager 
        isVisible={showTerminal}
        onClose={() => setShowTerminal(false)}
      />
    </div>
  );
};

export default IndicatorsPage;