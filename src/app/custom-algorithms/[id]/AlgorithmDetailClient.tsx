"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from '../../../components/navigation/Navbar';
import Link from 'next/link';
import axios from 'axios';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';

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

const deleteAlgorithm = async (algorithmId: string) => {
  const response = await api.delete(`/algorithms/${algorithmId}`);
  return response.data;
};

interface IndicatorCondition {
  id: string;
  indicator_type: string;
  indicator_params: Record<string, any>;
  comparison: string;
  value: number;
}

interface StrategyRule {
  id: string;
  name: string;
  signal_type: 'BUY' | 'SELL';
  conditions: IndicatorCondition[];
  logic_operator: 'AND' | 'OR';
}

interface RiskManagement {
  stop_loss_pct: number;
  take_profit_pct: number;
  max_position_size: number;
}

interface Algorithm {
  id: string;
  name: string;
  description: string;
  created_date: string;
  updated_date: string;
  config: {
    buy_rules: StrategyRule[];
    sell_rules: StrategyRule[];
    risk_management: RiskManagement;
  };
}

const AlgorithmDetailClient: React.FC<{ algorithmId: string }> = ({ algorithmId }) => {
  const router = useRouter();
  
  const [algorithm, setAlgorithm] = useState<Algorithm | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const storedToken = localStorage.getItem('quarksFinanceToken');
    
    if (storedToken) {
      setIsLoggedIn(true);
      fetchAlgorithm();
    } else {
      router.push('/home');
    }
  }, [router, algorithmId]);

  const showMessage = (message: string, isError: boolean = false): void => {
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
    }, 3000);
  };

  const fetchAlgorithm = async (): Promise<void> => {
    try {
      setLoading(true);
      
      const response = await getAlgorithm(algorithmId);
      
      if (response.success) {
        setAlgorithm(response.algorithm);
      } else {
        showMessage('Algorithm not found', true);
      }
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('quarksFinanceToken');
        setIsLoggedIn(false);
        router.push('/login');
        showMessage('Session expired. Please log in again.', true);
        return;
      }
      showMessage('Error fetching algorithm. Please try again.', true);
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (!algorithm) return;
    
    if (window.confirm(`Are you sure you want to delete "${algorithm.name}"? This action cannot be undone.`)) {
      try {
        const response = await deleteAlgorithm(algorithm.id);
        
        if (response.success) {
          showMessage('Algorithm deleted successfully');
          setTimeout(() => {
            router.push('/custom-algorithms');
          }, 2000);
        } else {
          showMessage(response.message || 'Failed to delete algorithm', true);
        }
      } catch (err: any) {
        showMessage('Error deleting algorithm. Please try again.', true);
        console.error("Delete error:", err);
      }
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const renderCondition = (condition: IndicatorCondition) => {
    const params = Object.entries(condition.indicator_params || {})
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
    
    return (
      <div key={condition.id} className="bg-gray-50 p-3 rounded border-l-4 border-blue-500">
        <div className="font-medium">
          {condition.indicator_type} {condition.comparison} {condition.value}
        </div>
        {params && (
          <div className="text-sm text-gray-600 mt-1">
            Parameters: {params}
          </div>
        )}
      </div>
    );
  };

  const renderRule = (rule: StrategyRule) => (
    <Card key={rule.id} className="mb-4">
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <span>{rule.name}</span>
          <span className={`px-2 py-1 rounded text-sm ${rule.signal_type === 'BUY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {rule.signal_type}
          </span>
        </CardTitle>
        <CardDescription>
          Logic: {rule.logic_operator} (All conditions must {rule.logic_operator === 'AND' ? 'be true' : 'at least one must be true'})
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {rule.conditions.length === 0 ? (
            <p className="text-gray-500 italic">No conditions defined</p>
          ) : (
            rule.conditions.map(renderCondition)
          )}
        </div>
      </CardContent>
    </Card>
  );

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
        <span className="text-black text-2xl" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>{algorithm.name}</span>
      </nav>
      
      <div className="container mx-auto px-4 md:px-40 py-8">
        <div className="w-full px-4 mt-4">
          {/* Success/Error Messages */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg">
              {successMessage}
            </div>
          )}
          {errorMessage && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg">
              {errorMessage}
            </div>
          )}

          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'JetBrains Mono, monospace', color: '#4C555A' }}>
                  {algorithm.name}
                </h1>
                <p className="text-gray-600" style={{ fontFamily: 'Rubik, sans-serif' }}>
                  {algorithm.description || 'No description provided'}
                </p>
              </div>
              
              <div className="flex gap-2">
                <Link href={`/custom-algorithms/${algorithm.id}/edit`}>
                  <Button variant="outline">
                    Edit
                  </Button>
                </Link>
                <Link href={`/custom-algorithms/${algorithm.id}/backtest`}>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    Backtest
                  </Button>
                </Link>
                <Link href={`/custom-algorithms/${algorithm.id}/optimize`}>
                  <Button variant="outline">
                    Optimize
                  </Button>
                </Link>
                <Button 
                  variant="outline"
                  onClick={handleDelete}
                  className="text-red-600 hover:text-red-700 hover:border-red-300"
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>

          {/* Algorithm Details */}
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Buy Rules */}
              <div>
                <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'JetBrains Mono, monospace', color: '#4C555A' }}>
                  Buy Rules ({algorithm.config.buy_rules?.length || 0})
                </h2>
                {algorithm.config.buy_rules?.length === 0 ? (
                  <Card className="p-6 text-center">
                    <p className="text-gray-500">No buy rules defined</p>
                  </Card>
                ) : (
                  algorithm.config.buy_rules?.map(renderRule)
                )}
              </div>

              {/* Sell Rules */}
              <div>
                <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'JetBrains Mono, monospace', color: '#4C555A' }}>
                  Sell Rules ({algorithm.config.sell_rules?.length || 0})
                </h2>
                {algorithm.config.sell_rules?.length === 0 ? (
                  <Card className="p-6 text-center">
                    <p className="text-gray-500">No sell rules defined</p>
                  </Card>
                ) : (
                  algorithm.config.sell_rules?.map(renderRule)
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Algorithm Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Algorithm Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="text-sm font-medium text-gray-600">Created</div>
                    <div className="text-sm">{formatDate(algorithm.created_date)}</div>
                  </div>
                  {algorithm.updated_date && algorithm.updated_date !== algorithm.created_date && (
                    <div>
                      <div className="text-sm font-medium text-gray-600">Last Updated</div>
                      <div className="text-sm">{formatDate(algorithm.updated_date)}</div>
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-medium text-gray-600">Algorithm ID</div>
                    <div className="text-sm font-mono text-gray-500">{algorithm.id}</div>
                  </div>
                </CardContent>
              </Card>

              {/* Risk Management */}
              <Card>
                <CardHeader>
                  <CardTitle>Risk Management</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="text-sm font-medium text-gray-600">Stop Loss</div>
                    <div className="text-sm">{((algorithm.config.risk_management?.stop_loss_pct || 0) * 100).toFixed(2)}%</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-600">Take Profit</div>
                    <div className="text-sm">{((algorithm.config.risk_management?.take_profit_pct || 0) * 100).toFixed(2)}%</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-600">Max Position Size</div>
                    <div className="text-sm">{((algorithm.config.risk_management?.max_position_size || 0) * 100).toFixed(2)}%</div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href={`/custom-algorithms/${algorithm.id}/backtest`} className="block">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                      Run Backtest
                    </Button>
                  </Link>
                  <Link href={`/custom-algorithms/${algorithm.id}/optimize`} className="block">
                    <Button variant="outline" className="w-full">
                      Optimize Parameters
                    </Button>
                  </Link>
                  <Link href={`/custom-algorithms/${algorithm.id}/walk-forward`} className="block">
                    <Button variant="outline" className="w-full">
                      Walk-Forward Analysis
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlgorithmDetailClient;