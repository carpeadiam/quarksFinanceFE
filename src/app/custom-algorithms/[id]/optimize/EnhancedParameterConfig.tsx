import React, { useState, useEffect } from 'react';

// TypeScript interfaces
interface ParameterRange {
  type: 'range' | 'discrete';
  min?: number;
  max?: number;
  step?: number;
  values: number[];
}

interface ParameterConfig {
  name: string;
  displayName: string;
  type: 'numeric' | 'select';
  currentValue: number | string;
  description: string;
  category: string;
  suggestedMin?: number;
  suggestedMax?: number;
  suggestedStep?: number;
}

// Component props interface
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
  const [parameterConfigs, setParameterConfigs] = useState<ParameterConfig[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  // Extract parameters from algorithm configuration
  const extractParametersFromAlgorithm = (algo: any): ParameterConfig[] => {
    if (!algo?.config) return [];
    
    const parameters: ParameterConfig[] = [];
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
                parameters.push({
                  name: uniqueKey,
                  displayName: `${getIndicatorName(indicatorType)} ${paramKey}`,
                  type: 'numeric',
                  currentValue: paramValue,
                  description: `${getParamDescription(paramKey, indicatorType)} (Current: ${paramValue})`,
                  category: `${ruleType.toUpperCase()} Rules`,
                  ...getSuggestedRange(paramKey, indicatorType, paramValue)
                });
              }
            }
          });

          // Process condition values
          if (typeof condition.value === 'number') {
            const valueKey = `${ruleType}_${ruleIndex}_${condIndex}_value`;
            if (!processed.has(valueKey)) {
              processed.add(valueKey);
              parameters.push({
                name: valueKey,
                displayName: `${getIndicatorName(condition.indicator_type)} Threshold`,
                type: 'numeric',
                currentValue: condition.value,
                description: `Threshold value for ${condition.id} (Current: ${condition.value})`,
                category: `${ruleType.toUpperCase()} Rules`,
                ...getSuggestedRange('threshold', condition.indicator_type, condition.value)
              });
            }
          }
        });
      });
    };

    processRules(algo.config.buy_rules, 'buy');
    processRules(algo.config.sell_rules, 'sell');

    // Process risk management parameters
    if (algo.config.risk_management) {
      const riskParams = algo.config.risk_management;
      Object.entries(riskParams).forEach(([key, value]) => {
        if (typeof value === 'number') {
          const riskKey = `risk_${key}`;
          parameters.push({
            name: riskKey,
            displayName: getRiskParamDisplayName(key),
            type: 'numeric',
            currentValue: value,
            description: getRiskParamDescription(key, value),
            category: 'Risk Management',
            ...getSuggestedRange(key, 'risk', value)
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

  const getSuggestedRange = (param: string, indicator: string, currentValue: number) => {
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
  }, {} as Record<string, ParameterConfig[]>);

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

// Default export for use in the main application
export default EnhancedParameterConfig;