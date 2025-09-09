"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Navbar from '../../../../components/navigation/Navbar';
import Link from 'next/link';
import axios from 'axios';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import LoadingSpinner from '../../../../components/ui/LoadingSpinner';

// API functions
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

const optimizeAlgorithm = async (algorithmId: string, optimizationParams: {
  symbol: string;
  parameter_grid: any;
  optimization_metric: string;
}) => {
  const response = await api.post(`/algorithms/${algorithmId}/optimize`, optimizationParams);
  return response.data;
};

const walkForwardAnalysis = async (algorithmId: string, analysisParams: {
  symbol: string;
  train_periods: number;
  test_periods: number;
}) => {
  const response = await api.post(`/algorithms/${algorithmId}/walk-forward`, analysisParams);
  return response.data;
};

// Enhanced interfaces
interface Algorithm {
  id: string;
  name: string;
  description: string;
  created_date: string;
  updated_date: string;
  algorithm_type?: string;
  parameters?: Record<string, any>;
}

interface OptimizationResult {
  success: boolean;
  optimization_results: {
    best_parameters: Record<string, any>;
    best_score: number;
    best_result: {
      total_return: number;
      sharpe_ratio: number;
      max_drawdown: number;
      win_rate: number;
    };
    optimization_metric: string;
    all_results?: Array<{
      parameters: Record<string, any>;
      score: number;
      metrics: Record<string, number>;
    }>;
  };
}
interface ExtractedParameter {
  name: string;
  displayName: string;
  type: string;
  currentValue: number;
  description: string;
  category: string;
  suggestedMin?: number;
  suggestedMax?: number;
  suggestedStep?: number;
}


interface WalkForwardResult {
  success: boolean;
  walk_forward_results: {
    period_results: Array<{
      period_start: string;
      period_end: string;
      total_return: number;
      sharpe_ratio: number;
      max_drawdown: number;
    }>;
    average_return: number;
    average_sharpe: number;
    return_std: number;
    sharpe_std: number;
    win_rate: number;
  };
}

interface ParameterConfig {
  name: string;
  displayName: string;
  type: 'number' | 'select';
  values: number[] | string[];
  description: string;
}

const PARAMETER_CONFIGS: Record<string, ParameterConfig[]> = {
  'RSI': [
    { name: 'rsi_period', displayName: 'RSI Period', type: 'number', values: [7, 14, 21, 28], description: 'Period for RSI calculation' },
    { name: 'rsi_oversold', displayName: 'Oversold Level', type: 'number', values: [20, 25, 30, 35], description: 'Buy signal threshold' },
    { name: 'rsi_overbought', displayName: 'Overbought Level', type: 'number', values: [65, 70, 75, 80], description: 'Sell signal threshold' },
  ],
  'MACD': [
    { name: 'macd_fast', displayName: 'Fast Period', type: 'number', values: [8, 12, 16, 20], description: 'Fast EMA period' },
    { name: 'macd_slow', displayName: 'Slow Period', type: 'number', values: [21, 26, 30, 35], description: 'Slow EMA period' },
    { name: 'macd_signal', displayName: 'Signal Period', type: 'number', values: [7, 9, 12, 14], description: 'Signal line EMA period' },
  ],
  'BOLLINGER': [
    { name: 'bb_period', displayName: 'Period', type: 'number', values: [15, 20, 25, 30], description: 'Bollinger Bands period' },
    { name: 'bb_std', displayName: 'Standard Deviations', type: 'number', values: [1.5, 2.0, 2.5, 3.0], description: 'Standard deviation multiplier' },
  ],
  'MOVING_AVERAGE': [
    { name: 'ma_period', displayName: 'MA Period', type: 'number', values: [10, 20, 50, 100], description: 'Moving average period' },
    { name: 'ma_type', displayName: 'MA Type', type: 'select', values: ['SMA', 'EMA', 'WMA'], description: 'Moving average calculation type' },
  ],
  'ADX': [
    { name: 'adx_period', displayName: 'ADX Period', type: 'number', values: [10, 14, 20, 25], description: 'ADX calculation period' },
    { name: 'adx_level', displayName: 'ADX Level', type: 'number', values: [20, 25, 30, 35], description: 'Trend strength threshold' },
  ],
  'VOLUME': [
    { name: 'volume_lookback', displayName: 'Lookback Period', type: 'number', values: [10, 20, 30, 50], description: 'Volume comparison period' },
    { name: 'volume_multiplier', displayName: 'Volume Multiplier', type: 'number', values: [1.2, 1.5, 2.0, 2.5], description: 'Volume surge threshold' },
  ],
  'OBV': [
    { name: 'obv_lookback', displayName: 'OBV Lookback', type: 'number', values: [10, 20, 30, 50], description: 'OBV trend period' },
    { name: 'obv_multiplier', displayName: 'OBV Multiplier', type: 'number', values: [1.05, 1.1, 1.2, 1.5], description: 'OBV trend strength' },
  ],
  'MFI': [
    { name: 'mfi_period', displayName: 'MFI Period', type: 'number', values: [10, 14, 20, 25], description: 'Money Flow Index period' },
    { name: 'mfi_level', displayName: 'MFI Level', type: 'number', values: [20, 30, 40, 50, 60, 70, 80], description: 'MFI threshold level' },
  ],
  'STOCHASTIC': [
    { name: 'stoch_k', displayName: 'Stochastic %K', type: 'number', values: [10, 14, 20], description: 'Stochastic %K period' },
    { name: 'stoch_d', displayName: 'Stochastic %D', type: 'number', values: [3, 5, 7], description: 'Stochastic %D period' },
    { name: 'stoch_overbought', displayName: 'Overbought Level', type: 'number', values: [70, 75, 80], description: 'Stochastic overbought level' },
    { name: 'stoch_oversold', displayName: 'Oversold Level', type: 'number', values: [20, 25, 30], description: 'Stochastic oversold level' },
  ],
  'PARABOLIC_SAR': [
    { name: 'sar_acceleration', displayName: 'Acceleration', type: 'number', values: [0.01, 0.02, 0.03], description: 'SAR acceleration factor' },
    { name: 'sar_maximum', displayName: 'Maximum', type: 'number', values: [0.1, 0.2, 0.3], description: 'SAR maximum acceleration' },
  ],
  'ATR': [
    { name: 'atr_period', displayName: 'ATR Period', type: 'number', values: [10, 14, 20, 25], description: 'Average True Range period' },
    { name: 'atr_multiplier', displayName: 'ATR Multiplier', type: 'number', values: [1.5, 2.0, 2.5, 3.0], description: 'ATR multiplier for stops' },
  ],
  'VWAP': [
    { name: 'vwap_period', displayName: 'VWAP Period', type: 'number', values: [1, 5, 10, 20], description: 'VWAP calculation period' },
    { name: 'vwap_multiplier', displayName: 'VWAP Multiplier', type: 'number', values: [1.01, 1.02, 1.03, 1.05], description: 'VWAP deviation threshold' },
  ]
};

// Optimization presets
const OPTIMIZATION_PRESETS = {
  conservative: { name: 'Conservative', metric: 'sharpe_ratio', description: 'Focus on risk-adjusted returns' },
  aggressive: { name: 'Aggressive', metric: 'total_return', description: 'Maximize total returns' },
  balanced: { name: 'Balanced', metric: 'sortino_ratio', description: 'Balance return and downside risk' },
  consistent: { name: 'Consistent', metric: 'win_rate', description: 'Prioritize win percentage' }
};

// EnhancedParameterConfig component interfaces and implementation
interface ParameterRange {
  type: 'range' | 'discrete';
  min?: number;
  max?: number;
  step?: number;
  values: number[];
}

interface EnhancedParameterConfigProps {
  algorithm?: any;
  parameterGrid: Record<string, any>;
  updateParameterRange: (paramName: string, values: any[]) => void;
}

const EnhancedParameterConfig: React.FC<EnhancedParameterConfigProps> = ({ 
  algorithm, 
  parameterGrid, 
  updateParameterRange 
}) => {
  const [parameterRanges, setParameterRanges] = useState<Record<string, ParameterRange>>({});
  const [parameterConfigs, setParameterConfigs] = useState<ExtractedParameter[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  // Extract parameters from algorithm configuration
  const extractParametersFromAlgorithm = (algo: any): ExtractedParameter[] => {
    if (!algo?.parameters) return [];
    
    const parameters: ExtractedParameter[] = [];
    const processed = new Set<string>();

    const processRules = (rules: any[], ruleType: 'buy' | 'sell') => {
      if (!rules) return;
      
      rules.forEach((rule: any, ruleIndex: number) => {
        if (!rule.conditions) return;
        
        rule.conditions.forEach((condition: any, condIndex: number) => {
          const indicatorType = condition.indicator_type;
          const indicatorParams = condition.indicator_params || {};
          
          // Process indicator parameters
          Object.entries(indicatorParams).forEach(([paramKey, paramValue]) => {
            if (typeof paramValue === 'number') {
              const uniqueKey = `${ruleType}_${ruleIndex}_${condIndex}_${paramKey}`;
              if (!processed.has(uniqueKey)) {
                processed.add(uniqueKey);
                const range = getSuggestedRange(paramKey, indicatorType, paramValue);
                parameters.push({
                  name: uniqueKey,
                  displayName: `${getIndicatorName(indicatorType)} ${paramKey}`,
                  type: 'numeric',
                  currentValue: paramValue,
                  description: `${getParamDescription(paramKey, indicatorType)} (Current: ${paramValue})`,
                  category: `${ruleType.toUpperCase()} Rules`,
                  suggestedMin: range.suggestedMin,
                  suggestedMax: range.suggestedMax,
                  suggestedStep: range.suggestedStep
                });
              }
            }
          });

          // Process condition values
          if (typeof condition.value === 'number') {
            const valueKey = `${ruleType}_${ruleIndex}_${condIndex}_value`;
            if (!processed.has(valueKey)) {
              processed.add(valueKey);
              const range = getSuggestedRange('threshold', condition.indicator_type, condition.value);
              parameters.push({
                name: valueKey,
                displayName: `${getIndicatorName(condition.indicator_type)} Threshold`,
                type: 'numeric',
                currentValue: condition.value,
                description: `Threshold value for ${condition.id} (Current: ${condition.value})`,
                category: `${ruleType.toUpperCase()} Rules`,
                suggestedMin: range.suggestedMin,
                suggestedMax: range.suggestedMax,
                suggestedStep: range.suggestedStep
              });
            }
          }
        });
      });
    };

  processRules(algo.parameters.buy_rules || [], 'buy');
  processRules(algo.parameters.sell_rules || [], 'sell');

  // Process risk management parameters
  if (algo.parameters.risk_management) {
    const riskParams = algo.parameters.risk_management;
    Object.entries(riskParams).forEach(([key, value]) => {
      if (typeof value === 'number') {
        const riskKey = `risk_${key}`;
        const range = getSuggestedRange(key, 'risk', value);
        parameters.push({
          name: riskKey,
          displayName: getRiskParamDisplayName(key),
          type: 'numeric',
          currentValue: value,
          description: getRiskParamDescription(key, value),
          category: 'Risk Management',
          suggestedMin: range.suggestedMin,
          suggestedMax: range.suggestedMax,
          suggestedStep: range.suggestedStep
        });
      }
    });
  }

  return parameters;
};

  // Helper functions
  const getIndicatorName = (type: string): string => {
    const names: Record<string, string> = {
      'RSI': 'RSI',
      'MACD': 'MACD', 
      'BOLLINGER': 'Bollinger Bands',
      'VOLUME': 'Volume',
      'PRICE': 'Price',
      'ADX': 'ADX',
      'ATR': 'ATR',
      'SMA': 'SMA',
      'EMA': 'EMA'
    };
    return names[type] || type;
  };

  const getParamDescription = (param: string, indicator: string): string => {
    const descriptions: Record<string, string> = {
      'period': 'Calculation period/lookback',
      'lookback': 'Lookback period',
      'fast': 'Fast period',
      'slow': 'Slow period',
      'signal': 'Signal period',
      'std': 'Standard deviation multiplier',
      'component': 'Component selection'
    };
    return descriptions[param] || `${param} parameter`;
  };

  const getRiskParamDisplayName = (key: string): string => {
    const names: Record<string, string> = {
      'stop_loss_pct': 'Stop Loss %',
      'take_profit_pct': 'Take Profit %',
      'max_position_size': 'Max Position Size',
      'max_daily_loss': 'Max Daily Loss',
      'max_drawdown': 'Max Drawdown'
    };
    return names[key] || key;
  };

  const getRiskParamDescription = (key: string, value: number): string => {
    const descriptions: Record<string, string> = {
      'stop_loss_pct': 'Stop loss percentage',
      'take_profit_pct': 'Take profit percentage',
      'max_position_size': 'Maximum position size',
      'max_daily_loss': 'Maximum daily loss',
      'max_drawdown': 'Maximum drawdown'
    };
    return `${descriptions[key] || key} (Current: ${value})`;
  };

  const getSuggestedRange = (param: string, indicator: string, currentValue: number): { 
    suggestedMin: number; 
    suggestedMax: number; 
    suggestedStep: number 
  } => {
    const ranges: Record<string, any> = {
      'period': { suggestedMin: Math.max(5, Math.floor(currentValue * 0.5)), suggestedMax: Math.ceil(currentValue * 2), suggestedStep: 1 },
      'lookback': { suggestedMin: Math.max(5, Math.floor(currentValue * 0.5)), suggestedMax: Math.ceil(currentValue * 2), suggestedStep: 1 },
      'fast': { suggestedMin: 5, suggestedMax: 25, suggestedStep: 1 },
      'slow': { suggestedMin: 20, suggestedMax: 50, suggestedStep: 1 },
      'signal': { suggestedMin: 5, suggestedMax: 15, suggestedStep: 1 },
      'std': { suggestedMin: 1.0, suggestedMax: 3.0, suggestedStep: 0.1 },
      'stop_loss_pct': { suggestedMin: 0.005, suggestedMax: 0.05, suggestedStep: 0.002 },
      'take_profit_pct': { suggestedMin: 0.01, suggestedMax: 0.1, suggestedStep: 0.005 },
      'threshold': { suggestedMin: currentValue * 0.8, suggestedMax: currentValue * 1.2, suggestedStep: currentValue * 0.01 }
    };
    
    return ranges[param] || { suggestedMin: currentValue * 0.8, suggestedMax: currentValue * 1.2, suggestedStep: 0.1 };
  };

  // Initialize parameters when algorithm changes
  useEffect(() => {
    if (algorithm) {
      const configs = extractParametersFromAlgorithm(algorithm);
      setParameterConfigs(configs);
      
      // Initialize parameter ranges
      const initialRanges: Record<string, ParameterRange> = {};
      configs.forEach(config => {
        initialRanges[config.name] = {
          type: 'discrete',
          values: [config.currentValue as number]
        };
      });
      setParameterRanges(initialRanges);
      
      // Initialize expanded categories
      const categories = [...new Set(configs.map(c => c.category))];
      const initialExpanded: Record<string, boolean> = {};
      categories.forEach(cat => initialExpanded[cat] = true);
      setExpandedCategories(initialExpanded);
    }
  }, [algorithm]);

  // Update parameter range
  const updateRange = (paramName: string, rangeData: ParameterRange) => {
    setParameterRanges(prev => ({ ...prev, [paramName]: rangeData }));
    updateParameterRange(paramName, rangeData.values);
  };

  // Generate values from range
  const generateRangeValues = (min: number, max: number, step: number): number[] => {
    const values: number[] = [];
    for (let i = min; i <= max; i += step) {
      values.push(Math.round(i * 1000) / 1000); // Round to 3 decimal places
    }
    return values;
  };

  // Handle range mode change
  const handleRangeModeChange = (paramName: string, mode: 'range' | 'discrete') => {
    const config = parameterConfigs.find(c => c.name === paramName);
    if (!config) return;

    if (mode === 'range') {
      updateRange(paramName, {
        type: 'range',
        min: config.suggestedMin || config.currentValue as number * 0.8,
        max: config.suggestedMax || config.currentValue as number * 1.2,
        step: config.suggestedStep || 0.1,
        values: []
      });
    } else {
      updateRange(paramName, {
        type: 'discrete',
        values: [config.currentValue as number]
      });
    }
  };

  // Calculate total combinations
  const calculateTotalCombinations = (): number => {
    return Object.values(parameterRanges).reduce((total, range) => {
      if (range.type === 'range' && range.min !== undefined && range.max !== undefined && range.step !== undefined) {
        const rangeValues = generateRangeValues(range.min, range.max, range.step);
        return total * Math.max(1, rangeValues.length);
      }
      return total * Math.max(1, range.values.length);
    }, 1);
  };

  // Add custom value
  const addCustomValue = (paramName: string, value: number) => {
    const currentRange = parameterRanges[paramName];
    if (currentRange && !currentRange.values.includes(value)) {
      const newValues = [...currentRange.values, value].sort((a, b) => a - b);
      updateRange(paramName, { ...currentRange, values: newValues });
    }
  };

  // Remove custom value
  const removeCustomValue = (paramName: string, value: number) => {
    const currentRange = parameterRanges[paramName];
    if (currentRange) {
      const newValues = currentRange.values.filter(v => v !== value);
      updateRange(paramName, { ...currentRange, values: newValues });
    }
  };

  // Group parameters by category
  const groupedParameters = parameterConfigs.reduce((groups, config) => {
    if (!groups[config.category]) groups[config.category] = [];
    groups[config.category].push(config);
    return groups;
  }, {} as Record<string, ExtractedParameter[]>);

  const totalCombinations = calculateTotalCombinations();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Parameter Ranges
        </label>
        <span className="text-xs text-gray-500 px-3 py-1 bg-blue-50 rounded-full">
          {totalCombinations.toLocaleString()} total combinations
        </span>
      </div>

      {Object.keys(groupedParameters).length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <p className="text-yellow-800 text-sm">
            No optimizable parameters found in this algorithm.
            <br />
            Make sure your algorithm has numeric parameters in indicators or risk management settings.
          </p>
        </div>
      )}

      <div className="space-y-6">
        {Object.entries(groupedParameters).map(([category, configs]) => (
          <div key={category} className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setExpandedCategories(prev => ({ ...prev, [category]: !prev[category] }))}
              className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between text-left"
            >
              <h3 className="font-medium text-gray-900">{category}</h3>
              <span className="text-gray-500">
                {expandedCategories[category] ? '−' : '+'}
              </span>
            </button>
            
            {expandedCategories[category] && (
              <div className="p-4 space-y-6 bg-white">
                {configs.map((config) => {
                  const currentRange = parameterRanges[config.name] || { type: 'discrete', values: [] };
                  
                  return (
                    <div key={config.name} className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-4 border border-gray-100 rounded-lg bg-gray-50">
                      {/* Parameter Info */}
                      <div className="space-y-2">
                        <h4 className="font-medium text-gray-900">{config.displayName}</h4>
                        <p className="text-sm text-gray-600">{config.description}</p>
                        
                        {/* Mode Toggle */}
                        <div className="flex space-x-2 mt-3">
                          <button
                            onClick={() => handleRangeModeChange(config.name, 'discrete')}
                            className={`px-3 py-1 text-xs rounded-full transition-colors ${
                              currentRange.type === 'discrete'
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                            }`}
                          >
                            Discrete Values
                          </button>
                          <button
                            onClick={() => handleRangeModeChange(config.name, 'range')}
                            className={`px-3 py-1 text-xs rounded-full transition-colors ${
                              currentRange.type === 'range'
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                            }`}
                          >
                            Range
                          </button>
                        </div>
                      </div>

                      {/* Range Configuration */}
                      <div className="lg:col-span-2 space-y-4">
                        {currentRange.type === 'range' ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Min</label>
                                <input
                                  type="number"
                                  step="any"
                                  value={currentRange.min || ''}
                                  onChange={(e) => {
                                    const min = parseFloat(e.target.value);
                                    if (!isNaN(min)) {
                                      const max = currentRange.max || min + 1;
                                      const step = currentRange.step || 0.1;
                                      const values = generateRangeValues(min, max, step);
                                      updateRange(config.name, { ...currentRange, min, values });
                                    }
                                  }}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Max</label>
                                <input
                                  type="number"
                                  step="any"
                                  value={currentRange.max || ''}
                                  onChange={(e) => {
                                    const max = parseFloat(e.target.value);
                                    if (!isNaN(max)) {
                                      const min = currentRange.min || 0;
                                      const step = currentRange.step || 0.1;
                                      const values = generateRangeValues(min, max, step);
                                      updateRange(config.name, { ...currentRange, max, values });
                                    }
                                  }}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Step</label>
                                <input
                                  type="number"
                                  step="any"
                                  min="0.001"
                                  value={currentRange.step || ''}
                                  onChange={(e) => {
                                    const step = parseFloat(e.target.value);
                                    if (!isNaN(step) && step > 0) {
                                      const min = currentRange.min || 0;
                                      const max = currentRange.max || 1;
                                      const values = generateRangeValues(min, max, step);
                                      updateRange(config.name, { ...currentRange, step, values });
                                    }
                                  }}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                              </div>
                            </div>
                            
                            {currentRange.min !== undefined && currentRange.max !== undefined && currentRange.step !== undefined && (
                              <div className="bg-white p-3 rounded border">
                                <p className="text-xs text-gray-600 mb-2">
                                  Generated values ({generateRangeValues(currentRange.min, currentRange.max, currentRange.step).length}):
                                </p>
                                <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                                  {generateRangeValues(currentRange.min, currentRange.max, currentRange.step).slice(0, 20).map((value, idx) => (
                                    <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                      {value}
                                    </span>
                                  ))}
                                  {generateRangeValues(currentRange.min, currentRange.max, currentRange.step).length > 20 && (
                                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                                      +{generateRangeValues(currentRange.min, currentRange.max, currentRange.step).length - 20} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {/* Custom value input */}
                            <div className="flex gap-2">
                              <input
                                type="number"
                                step="any"
                                placeholder="Add custom value"
                                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    const input = e.target as HTMLInputElement;
                                    const value = parseFloat(input.value);
                                    if (!isNaN(value)) {
                                      addCustomValue(config.name, value);
                                      input.value = '';
                                    }
                                  }
                                }}
                              />
                              <button
                                onClick={(e) => {
                                  const input = (e.target as HTMLButtonElement).previousElementSibling as HTMLInputElement;
                                  const value = parseFloat(input.value);
                                  if (!isNaN(value)) {
                                    addCustomValue(config.name, value);
                                    input.value = '';
                                  }
                                }}
                                className="px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
                              >
                                Add
                              </button>
                            </div>

                            {/* Current values */}
                            {currentRange.values.length > 0 && (
                              <div className="bg-white p-3 rounded border">
                                <p className="text-xs text-gray-600 mb-2">Selected values ({currentRange.values.length}):</p>
                                <div className="flex flex-wrap gap-1">
                                  {currentRange.values.map((value, idx) => (
                                    <span key={idx} className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                      {value}
                                      <button
                                        onClick={() => removeCustomValue(config.name, value)}
                                        className="ml-1 text-blue-600 hover:text-blue-800 focus:outline-none"
                                      >
                                        ×
                                      </button>
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Quick add suggested values */}
                            <div className="bg-white p-3 rounded border">
                              <p className="text-xs text-gray-600 mb-2">Quick add suggested values:</p>
                              <div className="flex flex-wrap gap-1">
                                {[
                                  config.currentValue as number * 0.8,
                                  config.currentValue as number * 0.9,
                                  config.currentValue as number,
                                  config.currentValue as number * 1.1,
                                  config.currentValue as number * 1.2
                                ].filter(v => !currentRange.values.includes(v)).map((value, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => addCustomValue(config.name, Math.round(value * 1000) / 1000)}
                                    className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded hover:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-400"
                                  >
                                    {Math.round(value * 1000) / 1000}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {totalCombinations > 1000 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-yellow-400">⚠️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                High number of combinations
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  With {totalCombinations.toLocaleString()} combinations, optimization may take a long time. 
                  Consider reducing parameter ranges or using fewer parameters.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const extractIndicatorsFromAlgorithm = (algorithm: Algorithm): string[] => {
  const indicators: Set<string> = new Set();
  
  if (!algorithm.parameters) return Array.from(indicators);
  
  // Extract indicators from buy rules
  if (algorithm.parameters.buy_rules) {
    algorithm.parameters.buy_rules.forEach((rule: any) => {
      if (rule.conditions) {
        rule.conditions.forEach((condition: any) => {
          if (condition.indicator_type) {
            indicators.add(condition.indicator_type);
          }
        });
      }
    });
  }
  
  // Extract indicators from sell rules
  if (algorithm.parameters.sell_rules) {
    algorithm.parameters.sell_rules.forEach((rule: any) => {
      if (rule.conditions) {
        rule.conditions.forEach((condition: any) => {
          if (condition.indicator_type) {
            indicators.add(condition.indicator_type);
          }
        });
      }
    });
  }
  
  return Array.from(indicators);
};

const getParametersForIndicators = (indicators: string[]): ParameterConfig[] => {
  const parameters: ParameterConfig[] = [];
  const addedParams = new Set<string>();
  
  indicators.forEach(indicator => {
    const indicatorKey = indicator.toUpperCase().replace(/-/g, '_');
    if (PARAMETER_CONFIGS[indicatorKey]) {
      PARAMETER_CONFIGS[indicatorKey].forEach(param => {
        if (!addedParams.has(param.name)) {
          parameters.push(param);
          addedParams.add(param.name);
        }
      });
    }
  });
  
  return parameters;
};

const AlgorithmOptimizePage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const algorithmId = params.id as string;
  
  const [algorithm, setAlgorithm] = useState<Algorithm | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [optimizing, setOptimizing] = useState<boolean>(false);
  const [walkForwarding, setWalkForwarding] = useState<boolean>(false);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [walkForwardResult, setWalkForwardResult] = useState<WalkForwardResult | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [optimizationProgress, setOptimizationProgress] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'optimize' | 'walkforward'>('optimize');
  
  // Dynamic parameter grid based on algorithm type
  const [parameterGrid, setParameterGrid] = useState<Record<string, any>>({});
  
  const [optimizationForm, setOptimizationForm] = useState({
    symbol: '',
    optimization_metric: 'sharpe_ratio',
    preset: 'balanced'
  });

  const [walkForwardForm, setWalkForwardForm] = useState({
    symbol: '',
    train_periods: 252,
    test_periods: 63
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

  // Initialize parameter grid when algorithm is loaded
  useEffect(() => {
    if (algorithm) {
      // First, try to get the full algorithm details from API to get the complete configuration
      const fetchAlgorithmDetails = async () => {
        try {
          const response = await getAlgorithm(algorithmId);
          if (response.success && response.algorithm) {
            const fullAlgorithm = response.algorithm;
            setAlgorithm(fullAlgorithm);
            
            // Extract indicators from the algorithm configuration
            const indicators = extractIndicatorsFromAlgorithm(fullAlgorithm);
            
            // Get parameters for those indicators
            const parameterConfigs = getParametersForIndicators(indicators);
            
            const initialGrid: Record<string, any> = {};
            parameterConfigs.forEach(config => {
              initialGrid[config.name] = config.values;
            });
            
            setParameterGrid(initialGrid);
          }
        } catch (error) {
          console.error("Error fetching algorithm details:", error);
          setErrorMessage("Failed to load algorithm details");
        }
      };
      
      fetchAlgorithmDetails();
    }
  }, [algorithmId]);

  const fetchAlgorithm = async () => {
    try {
      const response = await getAlgorithm(algorithmId);
      if (response.success) {
        setAlgorithm(response.algorithm);
      } else {
        setErrorMessage("Failed to load algorithm");
      }
    } catch (error) {
      console.error("Error fetching algorithm:", error);
      setErrorMessage("Error loading algorithm");
    } finally {
      setLoading(false);
    }
  };

  const handleOptimize = async (e: React.FormEvent) => {
    e.preventDefault();
    setOptimizing(true);
    setOptimizationProgress(0);
    setErrorMessage("");
    setSuccessMessage("");
    
    try {
      const result = await optimizeAlgorithm(algorithmId, {
        symbol: optimizationForm.symbol,
        parameter_grid: parameterGrid,
        optimization_metric: optimizationForm.optimization_metric
      });
      
      if (result.success) {
        setOptimizationResult(result);
        setSuccessMessage("Optimization completed successfully!");
      } else {
        setErrorMessage("Optimization failed: " + (result.message || "Unknown error"));
      }
    } catch (error: any) {
      console.error("Optimization error:", error);
      setErrorMessage("Optimization error: " + (error.response?.data?.message || error.message));
    } finally {
      setOptimizing(false);
      setOptimizationProgress(0);
    }
  };

  const handleWalkForward = async (e: React.FormEvent) => {
    e.preventDefault();
    setWalkForwarding(true);
    setErrorMessage("");
    setSuccessMessage("");
    
    try {
      const result = await walkForwardAnalysis(algorithmId, {
        symbol: walkForwardForm.symbol,
        train_periods: walkForwardForm.train_periods,
        test_periods: walkForwardForm.test_periods
      });
      
      if (result.success) {
        setWalkForwardResult(result);
        setSuccessMessage("Walk-forward analysis completed successfully!");
      } else {
        setErrorMessage("Walk-forward analysis failed: " + (result.message || "Unknown error"));
      }
    } catch (error: any) {
      console.error("Walk-forward error:", error);
      setErrorMessage("Walk-forward error: " + (error.response?.data?.message || error.message));
    } finally {
      setWalkForwarding(false);
    }
  };

  const updateParameterRange = (paramName: string, values: any[]) => {
    setParameterGrid(prev => ({
      ...prev,
      [paramName]: values
    }));
  };

  const handlePresetChange = (presetKey: string) => {
    const preset = OPTIMIZATION_PRESETS[presetKey as keyof typeof OPTIMIZATION_PRESETS];
    if (preset) {
      setOptimizationForm(prev => ({
        ...prev,
        optimization_metric: preset.metric,
        preset: presetKey
      }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link 
            href={`/algorithms/${algorithmId}`}
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            ← Back to Algorithm
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Optimize Algorithm</h1>
          <p className="text-gray-600 mt-2">
            Optimize parameters for: {algorithm?.name}
          </p>
        </div>

        {errorMessage && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-red-400">⚠️</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{errorMessage}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-green-400">✅</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Success</h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>{successMessage}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Forms */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Optimization Settings</CardTitle>
                <CardDescription>
                  Configure optimization parameters and metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleOptimize} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Symbol
                    </label>
                    <input
                      type="text"
                      value={optimizationForm.symbol}
                      onChange={(e) => setOptimizationForm(prev => ({ ...prev, symbol: e.target.value }))}
                      placeholder="e.g., AAPL, MSFT"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Optimization Preset
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(OPTIMIZATION_PRESETS).map(([key, preset]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => handlePresetChange(key)}
                          className={`p-3 text-left rounded-lg border transition-colors ${
                            optimizationForm.preset === key
                              ? 'border-blue-500 bg-blue-50 text-blue-800'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="font-medium text-sm">{preset.name}</div>
                          <div className="text-xs text-gray-600 mt-1">{preset.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Optimization Metric
                    </label>
                    <select
                      value={optimizationForm.optimization_metric}
                      onChange={(e) => setOptimizationForm(prev => ({ ...prev, optimization_metric: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="sharpe_ratio">Sharpe Ratio</option>
                      <option value="sortino_ratio">Sortino Ratio</option>
                      <option value="total_return">Total Return</option>
                      <option value="win_rate">Win Rate</option>
                      <option value="calmar_ratio">Calmar Ratio</option>
                    </select>
                  </div>

                  <Button
                    type="submit"
                    disabled={optimizing}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {optimizing ? (
                      <div className="flex items-center justify-center">
                        <LoadingSpinner size={16} className="mr-2" />
                        Optimizing... {optimizationProgress > 0 && `${optimizationProgress}%`}
                      </div>
                    ) : (
                      'Start Optimization'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Walk-Forward Analysis</CardTitle>
                <CardDescription>
                  Test algorithm robustness across different time periods
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleWalkForward} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Symbol
                    </label>
                    <input
                      type="text"
                      value={walkForwardForm.symbol}
                      onChange={(e) => setWalkForwardForm(prev => ({ ...prev, symbol: e.target.value }))}
                      placeholder="e.g., AAPL, MSFT"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Training Periods
                      </label>
                      <input
                        type="number"
                        value={walkForwardForm.train_periods}
                        onChange={(e) => setWalkForwardForm(prev => ({ ...prev, train_periods: parseInt(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="1"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Testing Periods
                      </label>
                      <input
                        type="number"
                        value={walkForwardForm.test_periods}
                        onChange={(e) => setWalkForwardForm(prev => ({ ...prev, test_periods: parseInt(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="1"
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={walkForwarding}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    {walkForwarding ? (
                      <div className="flex items-center justify-center">
                        <LoadingSpinner size={16} className="mr-2" />
                        Analyzing...
                      </div>
                    ) : (
                      'Run Walk-Forward Analysis'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Parameter Configuration and Results */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Parameter Configuration</CardTitle>
                <CardDescription>
                  Configure the parameter ranges for optimization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EnhancedParameterConfig
                  algorithm={algorithm}
                  parameterGrid={parameterGrid}
                  updateParameterRange={updateParameterRange}
                />
              </CardContent>
            </Card>

            {/* Optimization Results */}
            {optimizationResult && (
              <Card>
                <CardHeader>
                  <CardTitle>Optimization Results</CardTitle>
                  <CardDescription>
                    Best parameters found during optimization
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-medium text-blue-900">Best Score</h4>
                        <p className="text-2xl font-bold text-blue-700">
                          {optimizationResult.optimization_results.best_score.toFixed(3)}
                        </p>
                        <p className="text-sm text-blue-600">
                          {optimizationForm.optimization_metric.replace(/_/g, ' ')}
                        </p>
                      </div>
                      
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="font-medium text-green-900">Total Return</h4>
                        <p className="text-2xl font-bold text-green-700">
                          {(optimizationResult.optimization_results.best_result.total_return * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Best Parameters</h4>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <pre className="text-sm text-gray-800">
                          {JSON.stringify(optimizationResult.optimization_results.best_parameters, null, 2)}
                        </pre>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-purple-50 p-3 rounded-lg">
                        <h4 className="font-medium text-purple-900 text-sm">Sharpe Ratio</h4>
                        <p className="text-lg font-bold text-purple-700">
                          {optimizationResult.optimization_results.best_result.sharpe_ratio.toFixed(2)}
                        </p>
                      </div>
                      
                      <div className="bg-orange-50 p-3 rounded-lg">
                        <h4 className="font-medium text-orange-900 text-sm">Win Rate</h4>
                        <p className="text-lg font-bold text-orange-700">
                          {(optimizationResult.optimization_results.best_result.win_rate * 100).toFixed(1)}%
                        </p>
                      </div>
                      
                      <div className="bg-red-50 p-3 rounded-lg">
                        <h4 className="font-medium text-red-900 text-sm">Max Drawdown</h4>
                        <p className="text-lg font-bold text-red-700">
                          {(optimizationResult.optimization_results.best_result.max_drawdown * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Walk-Forward Results */}
            {walkForwardResult && (
              <Card>
                <CardHeader>
                  <CardTitle>Walk-Forward Analysis Results</CardTitle>
                  <CardDescription>
                    Performance across different time periods
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-medium text-blue-900">Average Return</h4>
                        <p className="text-2xl font-bold text-blue-700">
                          {(walkForwardResult.walk_forward_results.average_return * 100).toFixed(1)}%
                        </p>
                      </div>
                      
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="font-medium text-green-900">Average Sharpe</h4>
                        <p className="text-2xl font-bold text-green-700">
                          {walkForwardResult.walk_forward_results.average_sharpe.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-purple-50 p-3 rounded-lg">
                        <h4 className="font-medium text-purple-900 text-sm">Win Rate</h4>
                        <p className="text-lg font-bold text-purple-700">
                          {(walkForwardResult.walk_forward_results.win_rate * 100).toFixed(1)}%
                        </p>
                      </div>
                      
                      <div className="bg-orange-50 p-3 rounded-lg">
                        <h4 className="font-medium text-orange-900 text-sm">Return Std Dev</h4>
                        <p className="text-lg font-bold text-orange-700">
                          {(walkForwardResult.walk_forward_results.return_std * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Period Results</h4>
                      <div className="bg-gray-50 p-4 rounded-lg max-h-60 overflow-y-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2">Period</th>
                              <th className="text-right py-2">Return</th>
                              <th className="text-right py-2">Sharpe</th>
                              <th className="text-right py-2">Drawdown</th>
                            </tr>
                          </thead>
                          <tbody>
                            {walkForwardResult.walk_forward_results.period_results.map((period, index) => (
                              <tr key={index} className="border-b">
                                <td className="py-2">
                                  {new Date(period.period_start).toLocaleDateString()} - {new Date(period.period_end).toLocaleDateString()}
                                </td>
                                <td className="text-right py-2">
                                  {(period.total_return * 100).toFixed(1)}%
                                </td>
                                <td className="text-right py-2">
                                  {period.sharpe_ratio.toFixed(2)}
                                </td>
                                <td className="text-right py-2">
                                  {(period.max_drawdown * 100).toFixed(1)}%
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlgorithmOptimizePage;