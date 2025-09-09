import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

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

const createAlgorithm = async (algorithmData: any) => {
  const response = await api.post('/algorithms', algorithmData);
  return response.data;
};

const createFromTemplate = async (templateData: any) => {
  const response = await api.post('/algorithms/from-template', templateData);
  return response.data;
};

const TEMPLATES: Record<string, any> = {
  quantum_momentum: {
    name: "Quantum Momentum Matrix",
    description: "Multi-timeframe momentum with RSI 55+ and ADX 25+ trend strength",
    buy_rules: [
      {
        id: "multi_timeframe_momentum",
        name: "3-Timeframe Momentum Alignment",
        signal_type: "BUY",
        conditions: [
          {
            id: "daily_macd_bullish",
            indicator_type: "MACD",
            indicator_params: { fast: 12, slow: 26, signal: 9, component: "histogram" },
            comparison: ">",
            value: 0
          },
          {
            id: "rsi_daily_strong",
            indicator_type: "RSI",
            indicator_params: { period: 14 },
            comparison: ">",
            value: 55
          },
          {
            id: "volume_confirmation",
            indicator_type: "VOLUME",
            comparison: ">",
            value: 1.5
          },
          {
            id: "adx_trend_strength",
            indicator_type: "ADX",
            indicator_params: { period: 14, component: "adx" },
            comparison: ">",
            value: 25
          }
        ],
        logic_operator: "AND"
      }
    ],
    sell_rules: [
      {
        id: "momentum_divergence",
        name: "Momentum Divergence Signal",
        signal_type: "SELL",
        conditions: [
          {
            id: "macd_histogram_divergence",
            indicator_type: "MACD",
            indicator_params: { fast: 12, slow: 26, signal: 9, component: "histogram" },
            comparison: "crosses_below",
            value: 0
          }
        ],
        logic_operator: "OR"
      },
      {
        id: "rsi_overbought",
        name: "RSI Overbought Exit",
        signal_type: "SELL",
        conditions: [
          {
            id: "rsi_extreme",
            indicator_type: "RSI",
            indicator_params: { period: 14 },
            comparison: ">",
            value: 70
          }
        ],
        logic_operator: "OR"
      }
    ],
    risk_management: {
      stop_loss_pct: 0.02,
      take_profit_pct: 0.06,
      max_position_size: 0.12,
      max_daily_loss: 0.03,
      max_drawdown: 0.12,
      position_sizing_method: "volatility"
    }
  },

  alpha_convergence_system: {
    name: "Alpha Convergence System",
    description: "Mean reversion + momentum hybrid. Buys at RSI oversold, sells at BB target",
    buy_rules: [
      {
        id: "mean_reversion_entry",
        name: "Oversold Bounce Setup",
        signal_type: "BUY",
        conditions: [
          {
            id: "bollinger_extreme_oversold",
            indicator_type: "BOLLINGER",
            indicator_params: { period: 20, std: 2, component: "bb_percent" },
            comparison: "<",
            value: 15
          },
          {
            id: "rsi_oversold",
            indicator_type: "RSI",
            indicator_params: { period: 14 },
            comparison: "<",
            value: 32
          },
          {
            id: "macd_positive",
            indicator_type: "MACD",
            indicator_params: { fast: 12, slow: 26, signal: 9, component: "histogram" },
            comparison: ">",
            value: 0
          }
        ],
        logic_operator: "AND"
      }
    ],
    sell_rules: [
      {
        id: "target_reached",
        name: "Profit Target Achievement",
        signal_type: "SELL",
        conditions: [
          {
            id: "bollinger_upper_band",
            indicator_type: "BOLLINGER",
            indicator_params: { period: 20, std: 2, component: "bb_percent" },
            comparison: ">",
            value: 85
          }
        ],
        logic_operator: "OR"
      }
    ],
    risk_management: {
      stop_loss_pct: 0.015,
      take_profit_pct: 0.045,
      max_position_size: 0.15,
      max_daily_loss: 0.025,
      max_drawdown: 0.1,
      position_sizing_method: "kelly"
    }
  },

  volatility_breakout_system: {
    name: "Volatility Breakout System",
    description: "Identifies low-volatility consolidation followed by high-volume breakouts",
    buy_rules: [
      {
        id: "breakout_confirmation",
        name: "Volume Breakout Signal",
        signal_type: "BUY",
        conditions: [
          {
            id: "price_breakout_high",
            indicator_type: "PRICE",
            comparison: ">",
            value: 1.02
          },
          {
            id: "volume_surge",
            indicator_type: "VOLUME",
            comparison: ">",
            value: 1.5
          },
          {
            id: "low_volatility_setup",
            indicator_type: "BOLLINGER",
            indicator_params: { period: 20, std: 1.5, component: "bb_percent" },
            comparison: "<",
            value: 40
          }
        ],
        logic_operator: "AND"
      }
    ],
    sell_rules: [
      {
        id: "atr_trailing_stop",
        name: "ATR Trailing Stop",
        signal_type: "SELL",
        conditions: [
          {
            id: "price_below_atr_stop",
            indicator_type: "PRICE",
            comparison: "<",
            value: 0.97
          }
        ],
        logic_operator: "OR"
      }
    ],
    risk_management: {
      stop_loss_pct: 0.01,
      take_profit_pct: 0.04,
      max_position_size: 0.18,
      max_daily_loss: 0.02,
      max_drawdown: 0.08,
      position_sizing_method: "volatility"
    }
  },

  smart_money_flow: {
    name: "Smart Money Flow Strategy",
    description: "Follows institutional money flow using OBV, MFI, and VWAP",
    buy_rules: [
      {
        id: "smart_money_accumulation",
        name: "Institutional Accumulation Signal",
        signal_type: "BUY",
        conditions: [
          { id: "obv_uptrend", indicator_type: "OBV", comparison: ">", value: 1.05 },
          { id: "mfi_strong", indicator_type: "MFI", indicator_params: { period: 14 }, comparison: ">", value: 60 },
          { id: "price_above_vwap", indicator_type: "PRICE", comparison: ">", value: 1.01 }
        ],
        logic_operator: "AND"
      }
    ],
    sell_rules: [
      {
        id: "smart_money_distribution",
        name: "Institutional Distribution",
        signal_type: "SELL",
        conditions: [
          { id: "obv_divergence", indicator_type: "OBV", comparison: "<", value: 0.95 }
        ],
        logic_operator: "OR"
      }
    ],
    risk_management: {
      stop_loss_pct: 0.018,
      take_profit_pct: 0.055,
      max_position_size: 0.1,
      max_daily_loss: 0.022,
      max_drawdown: 0.09,
      position_sizing_method: "kelly"
    }
  }
};

// Enhanced indicator definitions with complete parameters
const INDICATOR_OPTIONS = {
  "RSI": {
    "parameters": {"period": 14},
    "comparisons": [">", "<", ">=", "<=", "==", "crosses_above", "crosses_below"],
    "value_range": [0, 100],
    "description": "Relative Strength Index - momentum oscillator"
  },
  "MACD": {
    "parameters": {"fast": 12, "slow": 26, "signal": 9, "component": "macd"},
    "components": ["macd", "signal", "histogram"],
    "comparisons": [">", "<", ">=", "<=", "==", "crosses_above", "crosses_below"],
    "value_range": "any",
    "description": "Moving Average Convergence Divergence"
  },
  "BOLLINGER": {
    "parameters": {"period": 20, "std": 2, "component": "middle"},
    "components": ["upper", "lower", "middle", "bb_percent"],
    "comparisons": [">", "<", ">=", "<=", "==", "crosses_above", "crosses_below"],
    "value_range": "any",
    "description": "Bollinger Bands - volatility indicator"
  },
  "SMA": {
    "parameters": {"period": 20},
    "comparisons": [">", "<", ">=", "<=", "==", "crosses_above", "crosses_below"],
    "value_range": "any",
    "description": "Simple Moving Average"
  },
  "EMA": {
    "parameters": {"period": 20},
    "comparisons": [">", "<", ">=", "<=", "==", "crosses_above", "crosses_below"],
    "value_range": "any",
    "description": "Exponential Moving Average"
  },
  "STOCHASTIC": {
    "parameters": {"k_period": 14, "d_period": 3, "component": "k_percent"},
    "components": ["k_percent", "d_percent"],
    "comparisons": [">", "<", ">=", "<=", "==", "crosses_above", "crosses_below"],
    "value_range": [0, 100],
    "description": "Stochastic Oscillator"
  },
  "ADX": {
    "parameters": {"period": 14, "component": "adx"},
    "components": ["adx", "plus_di", "minus_di"],
    "comparisons": [">", "<", ">=", "<=", "==", "crosses_above", "crosses_below"],
    "value_range": [0, 100],
    "description": "Average Directional Index"
  },
  "CCI": {
    "parameters": {"period": 20},
    "comparisons": [">", "<", ">=", "<=", "==", "crosses_above", "crosses_below"],
    "value_range": "any",
    "description": "Commodity Channel Index"
  },
  "PRICE": {
    "parameters": {},
    "comparisons": [">", "<", ">=", "<=", "==", "crosses_above", "crosses_below"],
    "value_range": "any",
    "description": "Current price"
  },
  "VOLUME": {
    "parameters": {},
    "comparisons": [">", "<", ">=", "<=", "==", "crosses_above", "crosses_below"],
    "value_range": "any",
    "description": "Trading volume"
  }
};

interface Template {
  name: string;
  description: string;
  config: any;
}

interface CreateAlgorithmModalProps {
  onClose: () => void;
  onSuccess: () => void;
  templates: Record<string, Template>;
}

interface IndicatorCondition {
  id: string;
  indicator_type: string;
  indicator_params: Record<string, any>;
  comparison: string;
  value: number | string;
  timeframe: number;
}

interface StrategyRule {
  id: string;
  name: string;
  signal_type: 'BUY' | 'SELL';
  conditions: IndicatorCondition[];
  logic_operator: 'AND' | 'OR' | 'MAJORITY';
  weight: number;
}

interface ToastNotification {
  type: 'success' | 'error' | 'info';
  message: string;
  show: boolean;
}

const Toast: React.FC<ToastNotification & { onClose: () => void }> = ({ type, message, show, onClose }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';

  return (
    <div className={`fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-[60] transform transition-all duration-300 ${show ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
      <div className="flex items-center justify-between">
        <span>{message}</span>
        <button onClick={onClose} className="ml-4 text-white hover:text-gray-200">
          ×
        </button>
      </div>
    </div>
  );
};

const CreateAlgorithmModal: React.FC<CreateAlgorithmModalProps> = ({ onClose, onSuccess, templates }) => {
  const [activeTab, setActiveTab] = useState<'scratch' | 'template'>('scratch');
  const [loading, setLoading] = useState(false);
  const [showJsonPreview, setShowJsonPreview] = useState(false);
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);
  const [toast, setToast] = useState<ToastNotification>({ type: 'info', message: '', show: false });
  
  // Form data for creating from scratch
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    buy_rules: [] as StrategyRule[],
    sell_rules: [] as StrategyRule[],
    risk_management: {
      stop_loss_pct: 0.03,
      take_profit_pct: 0.08,
      max_position_size: 0.15,
      max_daily_loss: 0.05,
      max_drawdown: 0.15,
      position_sizing_method: 'fixed',
      volatility_lookback: 20
    },
    multi_strategy_config: {
      strategy_weights: {},
      decision_threshold: 0.6,
      require_unanimous: false
    }
  });

  // Template form data - now includes full template configuration
  const [templateData, setTemplateData] = useState({
    template_name: '',
    name: '',
    description: '',
    parameters: {} as Record<string, number>, // ADD TYPE HERE
    buy_rules: [] as any[],
    sell_rules: [] as any[],
    risk_management: {},
    multi_strategy_config: {
      strategy_weights: {},
      decision_threshold: 0.6,
      require_unanimous: false
    }
  });

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message, show: true });
  };

  const validateCondition = (condition: IndicatorCondition): string | null => {
    const indicator = INDICATOR_OPTIONS[condition.indicator_type as keyof typeof INDICATOR_OPTIONS];
    if (!indicator) return 'Invalid indicator type';

    if (indicator.value_range !== 'any') {
      const [min, max] = indicator.value_range as [number, number];
      const value = parseFloat(condition.value.toString());
      if (value < min || value > max) {
        return `${condition.indicator_type} value must be between ${min} and ${max}`;
      }
    }

    return null;
  };

  const handleTemplateSelect = (templateKey: string) => {
  if (!templateKey) {
    setTemplateData({
      template_name: '',
      name: '',
      description: '',
      parameters: {},
      buy_rules: [],
      sell_rules: [],
      risk_management: {},
      multi_strategy_config: {
        strategy_weights: {},
        decision_threshold: 0.6,
        require_unanimous: false
      }
    });
    return;
  }

  const selectedTemplate = TEMPLATES[templateKey];
  if (selectedTemplate) {
    // Initialize parameters with defaults
    const templateParams = getTemplateParameters(templateKey);
    const initialParameters: Record<string, number> = {};
    
    Object.entries(templateParams).forEach(([key, param]: [string, any]) => {
      initialParameters[key] = param.default;
    });

    setTemplateData({
      template_name: templateKey,
      name: selectedTemplate.name,
      description: selectedTemplate.description,
      parameters: initialParameters, // Set initial parameters
      buy_rules: selectedTemplate.buy_rules || [],
      sell_rules: selectedTemplate.sell_rules || [],
      risk_management: selectedTemplate.risk_management || {},
      multi_strategy_config: {
        strategy_weights: {},
        decision_threshold: 0.6,
        require_unanimous: false
      }
    });
  }
};

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
      if (activeTab === 'template') {
      if (name === 'template_name') {
        handleTemplateSelect(value);
      } else if (name.startsWith('param_')) {
        // Handle parameter changes
        const paramName = name.replace('param_', '');
        setTemplateData(prev => ({
          ...prev,
          parameters: {
            ...prev.parameters,
            [paramName]: parseFloat(value) || 0
          }
        }));
      } else {
        setTemplateData(prev => ({
          ...prev,
          [name]: value
        }));
      }
    } else {
      if (name.startsWith('risk_')) {
        const riskField = name.replace('risk_', '');
        setFormData(prev => ({
          ...prev,
          risk_management: {
            ...prev.risk_management,
            [riskField]: name === 'risk_position_sizing_method' ? value : parseFloat(value) || 0
          }
        }));
      } else if (name.startsWith('multi_')) {
        const multiField = name.replace('multi_', '');
        setFormData(prev => ({
          ...prev,
          multi_strategy_config: {
            ...prev.multi_strategy_config,
            [multiField]: multiField === 'require_unanimous' ? value === 'true' : parseFloat(value) || 0
          }
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
      }
    }
  };

  const addBuyRule = () => {
    const newRule: StrategyRule = {
      id: `buy_rule_${Date.now()}`,
      name: 'New Buy Rule',
      signal_type: 'BUY',
      conditions: [],
      logic_operator: 'AND',
      weight: 1.0
    };
    setFormData(prev => ({
      ...prev,
      buy_rules: [...prev.buy_rules, newRule]
    }));
  };

  const addSellRule = () => {
    const newRule: StrategyRule = {
      id: `sell_rule_${Date.now()}`,
      name: 'New Sell Rule',
      signal_type: 'SELL',
      conditions: [],
      logic_operator: 'AND',
      weight: 1.0
    };
    setFormData(prev => ({
      ...prev,
      sell_rules: [...prev.sell_rules, newRule]
    }));
  };

  const addCondition = (ruleId: string, signalType: 'BUY' | 'SELL') => {
    const newCondition: IndicatorCondition = {
      id: `condition_${Date.now()}`,
      indicator_type: 'RSI',
      indicator_params: { period: 14 },
      comparison: '<',
      value: 30,
      timeframe: 0
    };

    setFormData(prev => ({
      ...prev,
      [signalType === 'BUY' ? 'buy_rules' : 'sell_rules']: prev[signalType === 'BUY' ? 'buy_rules' : 'sell_rules'].map(rule =>
        rule.id === ruleId 
          ? { ...rule, conditions: [...rule.conditions, newCondition] }
          : rule
      )
    }));
  };

  const updateCondition = (ruleId: string, conditionId: string, signalType: 'BUY' | 'SELL', updates: Partial<IndicatorCondition>) => {
    setFormData(prev => ({
      ...prev,
      [signalType === 'BUY' ? 'buy_rules' : 'sell_rules']: prev[signalType === 'BUY' ? 'buy_rules' : 'sell_rules'].map(rule =>
        rule.id === ruleId 
          ? {
              ...rule,
              conditions: rule.conditions.map(condition => {
                if (condition.id === conditionId) {
                  const newCondition = { ...condition, ...updates };
                  
                  // Update indicator parameters when indicator type changes
                  if (updates.indicator_type) {
                    const indicator = INDICATOR_OPTIONS[updates.indicator_type as keyof typeof INDICATOR_OPTIONS];
                    newCondition.indicator_params = { ...indicator.parameters };
                  }
                  
                  return newCondition;
                }
                return condition;
              })
            }
          : rule
      )
    }));
  };

  const updateRule = (ruleId: string, signalType: 'BUY' | 'SELL', updates: Partial<StrategyRule>) => {
    setFormData(prev => ({
      ...prev,
      [signalType === 'BUY' ? 'buy_rules' : 'sell_rules']: prev[signalType === 'BUY' ? 'buy_rules' : 'sell_rules'].map(rule =>
        rule.id === ruleId ? { ...rule, ...updates } : rule
      )
    }));
  };

  const removeRule = (ruleId: string, signalType: 'BUY' | 'SELL') => {
    setFormData(prev => ({
      ...prev,
      [signalType === 'BUY' ? 'buy_rules' : 'sell_rules']: prev[signalType === 'BUY' ? 'buy_rules' : 'sell_rules'].filter(rule => rule.id !== ruleId)
    }));
  };

  const removeCondition = (ruleId: string, conditionId: string, signalType: 'BUY' | 'SELL') => {
    setFormData(prev => ({
      ...prev,
      [signalType === 'BUY' ? 'buy_rules' : 'sell_rules']: prev[signalType === 'BUY' ? 'buy_rules' : 'sell_rules'].map(rule =>
        rule.id === ruleId 
          ? { ...rule, conditions: rule.conditions.filter(condition => condition.id !== conditionId) }
          : rule
      )
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let response;
      
      if (activeTab === 'template') {
        if (!templateData.template_name || !templateData.name) {
          showToast('error', 'Please select a template and provide a name');
          return;
        }
        const templateRequestData = {
          template_name: templateData.template_name,
          name: templateData.name,
          description: templateData.description,
          parameters: templateData.parameters
        };
        
        response = await createFromTemplate(templateRequestData);
      } else {
        if (!formData.name || formData.buy_rules.length === 0 || formData.sell_rules.length === 0) {
          showToast('error', 'Please provide algorithm name and at least one buy and sell rule');
          return;
        }

        // Validate all conditions
        const allConditions = [
          ...formData.buy_rules.flatMap(rule => rule.conditions),
          ...formData.sell_rules.flatMap(rule => rule.conditions)
        ];

        for (const condition of allConditions) {
          const error = validateCondition(condition);
          if (error) {
            showToast('error', error);
            return;
          }
        }

        response = await createAlgorithm(formData);
      }

      if (response.success) {
        showToast('success', 'Algorithm created successfully!');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } else {
        showToast('error', response.message || 'Failed to create algorithm');
      }
    } catch (err: any) {
      console.error('Error creating algorithm:', err);
      showToast('error', err.response?.data?.error || 'Error creating algorithm. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  // Add this function to get template parameters
  const getTemplateParameters = (templateName: string) => {
    const templateParams: Record<string, any> = {
      quantum_momentum: {
        macd_fast: { label: 'MACD Fast Period', type: 'number', default: 12, min: 5, max: 50 },
        macd_slow: { label: 'MACD Slow Period', type: 'number', default: 26, min: 10, max: 100 },
        macd_signal: { label: 'MACD Signal Period', type: 'number', default: 9, min: 5, max: 30 },
        rsi_period: { label: 'RSI Period', type: 'number', default: 14, min: 5, max: 30 },
        rsi_level: { label: 'RSI Level', type: 'number', default: 55, min: 30, max: 80 },
        adx_period: { label: 'ADX Period', type: 'number', default: 14, min: 5, max: 30 },
        adx_level: { label: 'ADX Level', type: 'number', default: 25, min: 10, max: 50 },
        stop_loss_pct: { label: 'Stop Loss %', type: 'percent', default: 0.02, min: 0.005, max: 0.1, step: 0.001 },
        take_profit_pct: { label: 'Take Profit %', type: 'percent', default: 0.06, min: 0.01, max: 0.2, step: 0.001 },
        position_size: { label: 'Position Size %', type: 'percent', default: 0.12, min: 0.05, max: 0.3, step: 0.01 }
      },
      alpha_convergence_system: {
        bb_period: { label: 'Bollinger Band Period', type: 'number', default: 20, min: 10, max: 50 },
        bb_std: { label: 'Bollinger Band Std Dev', type: 'number', default: 2, min: 1, max: 3, step: 0.1 },
        rsi_period: { label: 'RSI Period', type: 'number', default: 14, min: 5, max: 30 },
        oversold_level: { label: 'RSI Oversold Level', type: 'number', default: 32, min: 20, max: 40 },
        macd_fast: { label: 'MACD Fast Period', type: 'number', default: 12, min: 5, max: 50 },
        macd_slow: { label: 'MACD Slow Period', type: 'number', default: 26, min: 10, max: 100 },
        macd_signal: { label: 'MACD Signal Period', type: 'number', default: 9, min: 5, max: 30 },
        target_level: { label: 'Bollinger Target Level', type: 'number', default: 85, min: 70, max: 95 },
        stop_loss_pct: { label: 'Stop Loss %', type: 'percent', default: 0.015, min: 0.005, max: 0.1, step: 0.001 },
        take_profit_pct: { label: 'Take Profit %', type: 'percent', default: 0.045, min: 0.01, max: 0.2, step: 0.001 },
        position_size: { label: 'Position Size %', type: 'percent', default: 0.15, min: 0.05, max: 0.3, step: 0.01 }
      },
      volatility_breakout_system: {
        breakout_period: { label: 'Breakout Period', type: 'number', default: 20, min: 10, max: 50 },
        consolidation_level: { label: 'Consolidation Level', type: 'number', default: 40, min: 20, max: 60 },
        stop_loss_pct: { label: 'Stop Loss %', type: 'percent', default: 0.01, min: 0.005, max: 0.1, step: 0.001 },
        take_profit_pct: { label: 'Take Profit %', type: 'percent', default: 0.04, min: 0.01, max: 0.2, step: 0.001 },
        position_size: { label: 'Position Size %', type: 'percent', default: 0.18, min: 0.05, max: 0.3, step: 0.01 }
      },
      smart_money_flow: {
        mfi_period: { label: 'MFI Period', type: 'number', default: 14, min: 5, max: 30 },
        mfi_level: { label: 'MFI Level', type: 'number', default: 60, min: 40, max: 80 },
        stop_loss_pct: { label: 'Stop Loss %', type: 'percent', default: 0.018, min: 0.005, max: 0.1, step: 0.001 },
        take_profit_pct: { label: 'Take Profit %', type: 'percent', default: 0.055, min: 0.01, max: 0.2, step: 0.001 },
        position_size: { label: 'Position Size %', type: 'percent', default: 0.1, min: 0.05, max: 0.3, step: 0.01 }
      }
    };
    return templateParams[templateName] || {};
  };
  const getJsonPreview = () => {
    return JSON.stringify(formData, null, 2);
  };

  const getTemplatePreview = () => {
    if (!templateData.template_name) return '';
    
    // Show the actual data that will be sent to the backend
    const previewData = {
      template_name: templateData.template_name,
      name: templateData.name,
      description: templateData.description,
      parameters: templateData.parameters
    };
    
    return JSON.stringify(previewData, null, 2);
  };

  const renderCondition = (condition: IndicatorCondition, rule: StrategyRule, signalType: 'BUY' | 'SELL') => {
    const indicator = INDICATOR_OPTIONS[condition.indicator_type as keyof typeof INDICATOR_OPTIONS];
    const hasComponents = indicator && 'components' in indicator;

    return (
      <div key={condition.id} className="bg-gray-50 rounded-lg p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Indicator Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Indicator
              <span className="ml-1 text-blue-500 cursor-help" title={indicator?.description}>ⓘ</span>
            </label>
            <select
              value={condition.indicator_type}
              onChange={(e) => updateCondition(rule.id, condition.id, signalType, { indicator_type: e.target.value })}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {Object.keys(INDICATOR_OPTIONS).map(indicator => (
                <option key={indicator} value={indicator}>
                  {indicator}
                </option>
              ))}
            </select>
          </div>

          {/* Component selector for indicators that have components */}
          {hasComponents && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Component
              </label>
              <select
                value={condition.indicator_params.component || (indicator as any).components[0]}
                onChange={(e) => updateCondition(rule.id, condition.id, signalType, { 
                  indicator_params: { ...condition.indicator_params, component: e.target.value }
                })}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {(indicator as any).components.map((comp: string) => (
                  <option key={comp} value={comp}>
                    {comp.replace('_', ' ').toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Comparison */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Comparison
            </label>
            <select
              value={condition.comparison}
              onChange={(e) => updateCondition(rule.id, condition.id, signalType, { comparison: e.target.value })}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {indicator?.comparisons.map(comp => (
                <option key={comp} value={comp}>
                  {comp === 'crosses_above' ? 'Crosses Above' : 
                   comp === 'crosses_below' ? 'Crosses Below' :
                   comp === '>=' ? 'Greater or Equal' :
                   comp === '<=' ? 'Less or Equal' :
                   comp === '==' ? 'Equal To' :
                   comp === '>' ? 'Greater Than' :
                   comp === '<' ? 'Less Than' : comp}
                </option>
              ))}
            </select>
          </div>

          {/* Value */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Value
              {indicator?.value_range !== 'any' && (
                <span className="text-xs text-gray-500 ml-1">
                  ({(indicator?.value_range as [number, number])[0]}-{(indicator?.value_range as [number, number])[1]})
                </span>
              )}
            </label>
            <input
              type="number"
              value={condition.value}
              onChange={(e) => updateCondition(rule.id, condition.id, signalType, { value: parseFloat(e.target.value) || 0 })}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              step="0.01"
            />
          </div>
        </div>

        {/* Indicator Parameters */}
        {Object.keys(condition.indicator_params).filter(key => key !== 'component').length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Parameters</label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {Object.entries(condition.indicator_params).filter(([key]) => key !== 'component').map(([key, value]) => (
                <div key={key}>
                  <label className="block text-xs text-gray-600 mb-1">{key}</label>
                  <input
                    type="number"
                    value={value as number}
                    onChange={(e) => updateCondition(rule.id, condition.id, signalType, {
                      indicator_params: {
                        ...condition.indicator_params,
                        [key]: parseInt(e.target.value) || 0
                      }
                    })}
                    className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => removeCondition(rule.id, condition.id, signalType)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            Remove Condition
          </Button>
        </div>
      </div>
    );
  };

  const renderRuleSection = (rules: StrategyRule[], signalType: 'BUY' | 'SELL', addRuleFunction: () => void) => (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold">
            {signalType} Rules ({rules.length})
          </CardTitle>
          <Button type="button" onClick={addRuleFunction} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
            Add {signalType} Rule
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {rules.length === 0 ? (
          <p className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg">
            No {signalType.toLowerCase()} rules defined. Add at least one rule.
          </p>
        ) : (
          <div className="space-y-6">
            {rules.map((rule) => (
              <div key={rule.id} className="border rounded-lg p-4 bg-white shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-4 flex-1">
                    <input
                      type="text"
                      value={rule.name}
                      onChange={(e) => updateRule(rule.id, signalType, { name: e.target.value })}
                      className="font-medium text-lg bg-transparent border-none outline-none focus:bg-gray-50 px-2 py-1 rounded"
                      placeholder="Rule name"
                    />
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600">Logic:</label>
                      <select
                        value={rule.logic_operator}
                        onChange={(e) => updateRule(rule.id, signalType, { logic_operator: e.target.value as 'AND' | 'OR' | 'MAJORITY' })}
                        className="rounded border px-2 py-1 text-sm"
                      >
                        <option value="AND">AND</option>
                        <option value="OR">OR</option>
                        <option value="MAJORITY">MAJORITY</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600">Weight:</label>
                      <input
                        type="number"
                        value={rule.weight}
                        onChange={(e) => updateRule(rule.id, signalType, { weight: parseFloat(e.target.value) || 1.0 })}
                        className="w-16 rounded border px-2 py-1 text-sm"
                        step="0.1"
                        min="0.1"
                        max="2.0"
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeRule(rule.id, signalType)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Remove Rule
                  </Button>
                </div>
                
                <div className="space-y-4 mb-4">
                  {rule.conditions.map((condition) => renderCondition(condition, rule, signalType))}
                </div>
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addCondition(rule.id, signalType)}
                  className="bg-green-50 text-green-700 hover:bg-green-100"
                >
                  Add Condition
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <>
      <Toast {...toast} onClose={() => setToast(prev => ({ ...prev, show: false }))} />
      
      {/* Blurred Background */}
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl max-w-6xl w-full max-h-[95vh] overflow-y-auto shadow-2xl border border-white/20">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Create Trading Algorithm
              </h2>
              <div className="flex gap-2">
                {(activeTab === 'scratch' || (activeTab === 'template' && templateData.template_name)) && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => activeTab === 'scratch' ? setShowJsonPreview(!showJsonPreview) : setShowTemplatePreview(!showTemplatePreview)}
                    className="text-blue-600 border-blue-600 hover:bg-blue-50"
                  >
                    {(activeTab === 'scratch' ? showJsonPreview : showTemplatePreview) ? 'Hide' : 'Show'} Preview
                  </Button>
                )}
                <Button variant="outline" onClick={onClose} className="text-2xl leading-none p-2">
                  ×
                </Button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b mb-6 bg-gray-50 rounded-lg p-1">
              <button
                className={`flex-1 px-4 py-3 font-medium rounded-md transition-all ${
                  activeTab === 'scratch' 
                    ? 'bg-white text-blue-600 shadow-sm border border-blue-200' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                onClick={() => setActiveTab('scratch')}
              >
                Create from Scratch
              </button>
              <button
                className={`flex-1 px-4 py-3 font-medium rounded-md transition-all ${
                  activeTab === 'template' 
                    ? 'bg-white text-blue-600 shadow-sm border border-blue-200' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                onClick={() => setActiveTab('template')}
              >
                Use Template
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Form */}
              <div className={`${((showJsonPreview && activeTab === 'scratch') || (showTemplatePreview && activeTab === 'template' && templateData.template_name)) ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {activeTab === 'template' ? (
                    // Template Creation Form
                    <div className="space-y-6">
                      <Card>
                        <CardHeader>
                          <CardTitle>Template Selection</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Choose Template *
                            </label>
                            <select
                              name="template_name"
                              value={templateData.template_name}
                              onChange={handleInputChange}
                              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                              required
                            >
                              <option value="">Select a template...</option>
                              {Object.entries(TEMPLATES).map(([key, template]) => (
                                <option key={key} value={key}>
                                  {template.name}
                                </option>
                              ))}
                            </select>
                            {templateData.template_name && TEMPLATES[templateData.template_name] && (
                              <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <h4 className="font-semibold text-blue-900 mb-2">
                                  {TEMPLATES[templateData.template_name].name}
                                </h4>
                                <p className="text-sm text-blue-800 mb-3">
                                  {TEMPLATES[templateData.template_name].description}
                                </p>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div className="bg-green-50 p-3 rounded border border-green-200">
                                    <div className="font-medium text-green-800 mb-1">Buy Rules</div>
                                    <div className="text-green-700">
                                      {TEMPLATES[templateData.template_name].buy_rules?.length || 0} rule(s)
                                    </div>
                                  </div>
                                  <div className="bg-red-50 p-3 rounded border border-red-200">
                                    <div className="font-medium text-red-800 mb-1">Sell Rules</div>
                                    <div className="text-red-700">
                                      {TEMPLATES[templateData.template_name].sell_rules?.length || 0} rule(s)
                                    </div>
                                  </div>
                                </div>
                                {TEMPLATES[templateData.template_name].risk_management && (
                                  <div className="mt-3 bg-yellow-50 p-3 rounded border border-yellow-200">
                                    <div className="font-medium text-yellow-800 mb-1">Risk Management</div>
                                    <div className="text-yellow-700 text-xs grid grid-cols-2 gap-2">
                                      <span>Stop Loss: {(TEMPLATES[templateData.template_name].risk_management.stop_loss_pct * 100).toFixed(1)}%</span>
                                      <span>Take Profit: {(TEMPLATES[templateData.template_name].risk_management.take_profit_pct * 100).toFixed(1)}%</span>
                                      <span>Max Position: {(TEMPLATES[templateData.template_name].risk_management.max_position_size * 100).toFixed(1)}%</span>
                                      <span>Max Drawdown: {(TEMPLATES[templateData.template_name].risk_management.max_drawdown * 100).toFixed(1)}%</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Algorithm Name *
                            </label>
                            <input
                              type="text"
                              name="name"
                              value={templateData.name}
                              onChange={handleInputChange}
                              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                              placeholder="My Custom Algorithm"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Description
                            </label>
                            <textarea
                              name="description"
                              value={templateData.description}
                              onChange={handleInputChange}
                              rows={3}
                              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                              placeholder="Describe your algorithm..."
                            />
                               {/* Template Parameters */}
                          {templateData.template_name && (
                            <div className="mt-6">
                              <h4 className="font-semibold text-gray-900 mb-4">Template Parameters</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {Object.entries(getTemplateParameters(templateData.template_name)).map(([paramKey, paramConfig]: [string, any]) => (
                                  <div key={paramKey} className="bg-gray-50 p-4 rounded-lg border">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      {paramConfig.label}
                                    </label>
                                    <input
                                      type="number"
                                      name={`param_${paramKey}`}
                                      value={templateData.parameters[paramKey] || paramConfig.default}
                                      onChange={handleInputChange}
                                      min={paramConfig.min}
                                      max={paramConfig.max}
                                      step={paramConfig.step || 1}
                                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                    <div className="text-xs text-gray-500 mt-1">
                                      Default: {paramConfig.default} 
                                      {paramConfig.type === 'percent' && '%'}
                                      {paramConfig.type === 'number' && ' periods'}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    // Custom Creation Form
                    <div className="space-y-6">
                      {/* Basic Info */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Algorithm Information</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Algorithm Name *
                              </label>
                              <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                placeholder="My Custom Algorithm"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Description
                              </label>
                              <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                rows={3}
                                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                placeholder="Describe your algorithm strategy..."
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Risk Management */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Risk Management</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Stop Loss %
                                <span className="ml-1 text-blue-500 cursor-help" title="Percentage loss to trigger stop loss">ⓘ</span>
                              </label>
                              <input
                                type="number"
                                name="risk_stop_loss_pct"
                                value={formData.risk_management.stop_loss_pct}
                                onChange={handleInputChange}
                                step="0.001"
                                min="0"
                                max="1"
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Take Profit %
                                <span className="ml-1 text-blue-500 cursor-help" title="Percentage gain to trigger take profit">ⓘ</span>
                              </label>
                              <input
                                type="number"
                                name="risk_take_profit_pct"
                                value={formData.risk_management.take_profit_pct}
                                onChange={handleInputChange}
                                step="0.001"
                                min="0"
                                max="1"
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Max Position %
                                <span className="ml-1 text-blue-500 cursor-help" title="Maximum position size as percentage of portfolio">ⓘ</span>
                              </label>
                              <input
                                type="number"
                                name="risk_max_position_size"
                                value={formData.risk_management.max_position_size}
                                onChange={handleInputChange}
                                step="0.001"
                                min="0"
                                max="1"
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Max Daily Loss %
                                <span className="ml-1 text-blue-500 cursor-help" title="Maximum daily loss percentage">ⓘ</span>
                              </label>
                              <input
                                type="number"
                                name="risk_max_daily_loss"
                                value={formData.risk_management.max_daily_loss}
                                onChange={handleInputChange}
                                step="0.001"
                                min="0"
                                max="1"
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Max Drawdown %
                                <span className="ml-1 text-blue-500 cursor-help" title="Maximum drawdown percentage">ⓘ</span>
                              </label>
                              <input
                                type="number"
                                name="risk_max_drawdown"
                                value={formData.risk_management.max_drawdown}
                                onChange={handleInputChange}
                                step="0.001"
                                min="0"
                                max="1"
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Position Sizing
                                <span className="ml-1 text-blue-500 cursor-help" title="Method for calculating position sizes">ⓘ</span>
                              </label>
                              <select
                                name="risk_position_sizing_method"
                                value={formData.risk_management.position_sizing_method}
                                onChange={handleInputChange}
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                              >
                                <option value="fixed">Fixed</option>
                                <option value="percent_risk">Percent Risk</option>
                                <option value="volatility_adjusted">Volatility Adjusted</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Volatility Lookback
                                <span className="ml-1 text-blue-500 cursor-help" title="Number of periods for volatility calculation">ⓘ</span>
                              </label>
                              <input
                                type="number"
                                name="risk_volatility_lookback"
                                value={formData.risk_management.volatility_lookback}
                                onChange={handleInputChange}
                                min="1"
                                max="100"
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Multi-Strategy Config */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Multi-Strategy Configuration</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Decision Threshold
                                <span className="ml-1 text-blue-500 cursor-help" title="Minimum score required for signal generation">ⓘ</span>
                              </label>
                              <input
                                type="number"
                                name="multi_decision_threshold"
                                value={formData.multi_strategy_config.decision_threshold}
                                onChange={handleInputChange}
                                step="0.1"
                                min="0"
                                max="1"
                                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Require Unanimous
                                <span className="ml-1 text-blue-500 cursor-help" title="All conditions must agree for signal">ⓘ</span>
                              </label>
                              <select
                                name="multi_require_unanimous"
                                value={formData.multi_strategy_config.require_unanimous.toString()}
                                onChange={handleInputChange}
                                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                              >
                                <option value="false">No</option>
                                <option value="true">Yes</option>
                              </select>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Buy Rules */}
                      {renderRuleSection(formData.buy_rules, 'BUY', addBuyRule)}

                      {/* Sell Rules */}
                      {renderRuleSection(formData.sell_rules, 'SELL', addSellRule)}
                    </div>
                  )}

                  {/* Submit Buttons */}
                  <div className="flex justify-end gap-4 pt-6 border-t bg-gray-50/50 -mx-6 px-6 -mb-6 pb-6 rounded-b-2xl">
                    <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={loading} 
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8"
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Creating...
                        </div>
                      ) : (
                        'Create Algorithm'
                      )}
                    </Button>
                  </div>
                </form>
              </div>

              {/* JSON Preview */}
              {showJsonPreview && activeTab === 'scratch' && (
                <div className="lg:col-span-1">
                  <Card className="sticky top-4 max-h-[calc(100vh-8rem)] overflow-hidden">
                    <CardHeader>
                      <CardTitle className="text-sm font-medium text-gray-700">Live Preview</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <pre className="text-xs bg-gray-900 text-green-400 p-4 overflow-auto max-h-[70vh] font-mono">
                        {getJsonPreview()}
                      </pre>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Template Preview */}
              {showTemplatePreview && activeTab === 'template' && templateData.template_name && (
                <div className="lg:col-span-1">
                  <Card className="sticky top-4 max-h-[calc(100vh-8rem)] overflow-hidden">
                    <CardHeader>
                      <CardTitle className="text-sm font-medium text-gray-700">Template Preview</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <pre className="text-xs bg-gray-900 text-green-400 p-4 overflow-auto max-h-[70vh] font-mono">
                        {getTemplatePreview()}
                      </pre>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreateAlgorithmModal;