import { useState } from 'react';
//
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

type AdviceData = {
  symbol: string;
  current_price: number;
  one_year_return: number;
  recommendations: {
    buy_and_hold: {
      recommendation: string;
      reason: string;
      return: number;
      signal: string;
    };
    momentum: {
      recommendation: string;
      reason: string;
      momentum: number;
      signal: string;
    };
    bollinger: {
      recommendation: string;
      reason: string;
      signal: string;
      current_position: string;
      bands: {
        upper: number;
        middle: number;
        lower: number;
      };
      current_price: number;
      distance_from_ma: number;
    };
    ma_crossover: {
      recommendation: string;
      reason: string;
      signal: string;
      crossover_type?: 'none' | 'bullish' | 'bearish';
      moving_averages: {
        sma200: number;
        sma50: number;
      };
    };
    breakout: {
      recommendation: string;
      reason: string;
      signal: string;
      support: number;
      resistance: number;
    };
    keltner: {
      recommendation: string;
      reason: string;
      signal: string;
      lower_band: number;
      upper_band: number;
    };
    macd: {
      recommendation: string;
      reason: string;
      signal: string;
      macd: number;
      signal_line: number;
    };
    mean_reversion: {
      recommendation: string;
      reason: string;
      signal: string;
      z_score: number;
    };
    parabolic_sar: {
      recommendation: string;
      reason: string;
      signal: string;
      sar_value: number;
    };
    rsi: {
      recommendation: string;
      reason: string;
      signal: string;
      rsi_value: number;
    };
    stochastic: {
      recommendation: string;
      reason: string;
      signal: string;
      d_percent: number;
      k_percent: number;
    };
    volume_spike: {
      recommendation: string;
      reason: string;
      signal: string;
      volume_ratio: number;
    };
  };
  predictions: {
    arima_7day: number | null;
  };
  final_recommendation: {
    recommendation: string;
    reason: string;
    signal: string;
    signal_counts: {
      buy: number;
      hold: number;
      sell: number;
    };
    strategy_details: Array<{
      strategy: string;
      signal: string;
      reason: string;
    }>;
  };
  timestamp: string;
};

type AdviceCardProps = {
  advice: AdviceData;
};

export default function AdviceCard({ advice }: AdviceCardProps) {
  const [activeTab, setActiveTab] = useState('summary');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalChartType, setModalChartType] = useState<'bollinger' | 'strategy' | null>(null);


  const tabOptions = [
    { value: 'summary', label: 'Summary' },
    { value: 'buyhold', label: 'Buy & Hold' },
    { value: 'momentum', label: 'Momentum' },
    { value: 'bollinger', label: 'Bollinger Bands' },
    { value: 'ma', label: 'MA Crossover' },
    { value: 'breakout', label: 'Breakout' },
    { value: 'keltner', label: 'Keltner' },
    { value: 'macd', label: 'MACD' },
    { value: 'meanreversion', label: 'Mean Reversion' },
    { value: 'parabolic', label: 'Parabolic SAR' },
    { value: 'rsi', label: 'RSI' },
    { value: 'stochastic', label: 'Stochastic' },
    { value: 'volume', label: 'Volume' },
    { value: 'prediction', label: 'Predictions' }
  ];



  const getSignalColor = (signal: string) => {
    switch (signal.toLowerCase()) {
      case 'buy':
        return 'text-green-600';
      case 'sell':
        return 'text-red-600';
      default:
        return 'text-yellow-600';
    }
  };

  const getSignalBgColor = (signal: string) => {
    switch (signal.toLowerCase()) {
      case 'buy':
        return 'bg-green-100';
      case 'sell':
        return 'bg-red-100';
      default:
        return 'bg-yellow-100';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Prepare data for recommendation distribution chart
  const recommendationData = {
    labels: ['Buy', 'Hold', 'Sell'],
    datasets: [
      {
        data: [
          advice.final_recommendation.signal_counts.buy,
          advice.final_recommendation.signal_counts.hold,
          advice.final_recommendation.signal_counts.sell,
        ],
        backgroundColor: ['#10B981', '#FBBF24', '#EF4444'],
        borderWidth: 0,
      },
    ],
  };

  // Prepare data for price prediction chart
  const predictionData = {
    labels: ['Current', '7-Day Prediction'],
    datasets: [
      {
        label: 'Price (₹)',
        data: [advice.current_price, advice.predictions.arima_7day || advice.current_price],
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
      },
    ],
  };

  // Prepare data for Bollinger Bands visualization
  const bollingerData = {
    labels: ['Lower Band', 'Current Price', 'Middle Band', 'Upper Band'],
    datasets: [
      {
        label: 'Price (₹)',
        data: [
          advice.recommendations.bollinger.bands.lower,
          advice.recommendations.bollinger.current_price,
          advice.recommendations.bollinger.bands.middle,
          advice.recommendations.bollinger.bands.upper,
        ],
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
      },
    ],
  };

  // Prepare data for strategy comparison
const strategyComparisonData = {
  labels: [
    'Buy & Hold', 
    'Momentum', 
    'Bollinger', 
    'MA Crossover',
    'Breakout',
    'Keltner',
    'MACD',
    'Mean Reversion',
    'Parabolic SAR',
    'RSI',
    'Stochastic',
    'Volume Spike'
  ],
  datasets: [{
    label: 'Strategy Signals',
    data: [
      // Convert signals to numerical values (buy: 1, hold: 0, sell: -1)
      advice.recommendations.buy_and_hold.signal.toLowerCase() === 'buy' ? 1 : 
        advice.recommendations.buy_and_hold.signal.toLowerCase() === 'sell' ? -1 : 0,
      advice.recommendations.momentum.signal.toLowerCase() === 'buy' ? 1 : 
        advice.recommendations.momentum.signal.toLowerCase() === 'sell' ? -1 : 0,
      advice.recommendations.bollinger.signal.toLowerCase() === 'buy' ? 1 : 
        advice.recommendations.bollinger.signal.toLowerCase() === 'sell' ? -1 : 0,
      advice.recommendations.ma_crossover.signal.toLowerCase() === 'buy' ? 1 : 
        advice.recommendations.ma_crossover.signal.toLowerCase() === 'sell' ? -1 : 0,
      advice.recommendations.breakout.signal.toLowerCase() === 'buy' ? 1 : 
        advice.recommendations.breakout.signal.toLowerCase() === 'sell' ? -1 : 0,
      advice.recommendations.keltner.signal.toLowerCase() === 'buy' ? 1 : 
        advice.recommendations.keltner.signal.toLowerCase() === 'sell' ? -1 : 0,
      advice.recommendations.macd.signal.toLowerCase() === 'buy' ? 1 : 
        advice.recommendations.macd.signal.toLowerCase() === 'sell' ? -1 : 0,
      advice.recommendations.mean_reversion.signal.toLowerCase() === 'buy' ? 1 : 
        advice.recommendations.mean_reversion.signal.toLowerCase() === 'sell' ? -1 : 0,
      advice.recommendations.parabolic_sar.signal.toLowerCase() === 'buy' ? 1 : 
        advice.recommendations.parabolic_sar.signal.toLowerCase() === 'sell' ? -1 : 0,
      advice.recommendations.rsi.signal.toLowerCase() === 'buy' ? 1 : 
        advice.recommendations.rsi.signal.toLowerCase() === 'sell' ? -1 : 0,
      advice.recommendations.stochastic.signal.toLowerCase() === 'buy' ? 1 : 
        advice.recommendations.stochastic.signal.toLowerCase() === 'sell' ? -1 : 0,
      advice.recommendations.volume_spike.signal.toLowerCase() === 'buy' ? 1 : 
        advice.recommendations.volume_spike.signal.toLowerCase() === 'sell' ? -1 : 0
    ],
    backgroundColor: [
      advice.recommendations.buy_and_hold.signal.toLowerCase() === 'buy' ? 'rgba(16, 185, 129, 0.7)' : 
        advice.recommendations.buy_and_hold.signal.toLowerCase() === 'sell' ? 'rgba(239, 68, 68, 0.7)' : 'rgba(245, 158, 11, 0.7)',
      advice.recommendations.momentum.signal.toLowerCase() === 'buy' ? 'rgba(16, 185, 129, 0.7)' : 
        advice.recommendations.momentum.signal.toLowerCase() === 'sell' ? 'rgba(239, 68, 68, 0.7)' : 'rgba(245, 158, 11, 0.7)',
      advice.recommendations.bollinger.signal.toLowerCase() === 'buy' ? 'rgba(16, 185, 129, 0.7)' : 
        advice.recommendations.bollinger.signal.toLowerCase() === 'sell' ? 'rgba(239, 68, 68, 0.7)' : 'rgba(245, 158, 11, 0.7)',
      advice.recommendations.ma_crossover.signal.toLowerCase() === 'buy' ? 'rgba(16, 185, 129, 0.7)' : 
        advice.recommendations.ma_crossover.signal.toLowerCase() === 'sell' ? 'rgba(239, 68, 68, 0.7)' : 'rgba(245, 158, 11, 0.7)',
      advice.recommendations.breakout.signal.toLowerCase() === 'buy' ? 'rgba(16, 185, 129, 0.7)' : 
        advice.recommendations.breakout.signal.toLowerCase() === 'sell' ? 'rgba(239, 68, 68, 0.7)' : 'rgba(245, 158, 11, 0.7)',
      advice.recommendations.keltner.signal.toLowerCase() === 'buy' ? 'rgba(16, 185, 129, 0.7)' : 
        advice.recommendations.keltner.signal.toLowerCase() === 'sell' ? 'rgba(239, 68, 68, 0.7)' : 'rgba(245, 158, 11, 0.7)',
      advice.recommendations.macd.signal.toLowerCase() === 'buy' ? 'rgba(16, 185, 129, 0.7)' : 
        advice.recommendations.macd.signal.toLowerCase() === 'sell' ? 'rgba(239, 68, 68, 0.7)' : 'rgba(245, 158, 11, 0.7)',
      advice.recommendations.mean_reversion.signal.toLowerCase() === 'buy' ? 'rgba(16, 185, 129, 0.7)' : 
        advice.recommendations.mean_reversion.signal.toLowerCase() === 'sell' ? 'rgba(239, 68, 68, 0.7)' : 'rgba(245, 158, 11, 0.7)',
      advice.recommendations.parabolic_sar.signal.toLowerCase() === 'buy' ? 'rgba(16, 185, 129, 0.7)' : 
        advice.recommendations.parabolic_sar.signal.toLowerCase() === 'sell' ? 'rgba(239, 68, 68, 0.7)' : 'rgba(245, 158, 11, 0.7)',
      advice.recommendations.rsi.signal.toLowerCase() === 'buy' ? 'rgba(16, 185, 129, 0.7)' : 
        advice.recommendations.rsi.signal.toLowerCase() === 'sell' ? 'rgba(239, 68, 68, 0.7)' : 'rgba(245, 158, 11, 0.7)',
      advice.recommendations.stochastic.signal.toLowerCase() === 'buy' ? 'rgba(16, 185, 129, 0.7)' : 
        advice.recommendations.stochastic.signal.toLowerCase() === 'sell' ? 'rgba(239, 68, 68, 0.7)' : 'rgba(245, 158, 11, 0.7)',
      advice.recommendations.volume_spike.signal.toLowerCase() === 'buy' ? 'rgba(16, 185, 129, 0.7)' : 
        advice.recommendations.volume_spike.signal.toLowerCase() === 'sell' ? 'rgba(239, 68, 68, 0.7)' : 'rgba(245, 158, 11, 0.7)'
    ]
  }]
};

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl border border-gray-200 overflow-hidden" style={{ fontFamily: 'Rubik, sans-serif' }}>
    <div className="p-8 border-b bg-white">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">{advice.symbol}</h2>
        <div className="text-sm text-gray-500">
          Generated on: {formatDate(advice.timestamp)}
        </div>
      </div>
        
        {/* Recommendation Badge */}
        <div className="mt-6 flex justify-center">
        <div className={`inline-flex items-center px-8 py-4 rounded-full ${getSignalBgColor(advice.final_recommendation.signal)} border ${advice.final_recommendation.signal.toLowerCase() === 'buy' ? 'border-green-400' : advice.final_recommendation.signal.toLowerCase() === 'sell' ? 'border-red-400' : 'border-yellow-400'}`}>
          <span className={`text-2xl font-bold ${getSignalColor(advice.final_recommendation.signal)}`}>
            {advice.final_recommendation.recommendation}
          </span>
        </div>
      </div>
      
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-50 p-5 rounded-lg shadow-sm">
          <div className="text-sm text-gray-600 mb-1">Current Price</div>
          <div className="text-2xl font-semibold text-gray-900">₹{advice.current_price.toFixed(2)}</div>
        </div>
        <div className="bg-gray-50 p-5 rounded-lg shadow-sm">
          <div className="text-sm text-gray-600 mb-1">1-Year Return</div>
          <div className={`text-2xl font-semibold ${advice.one_year_return >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {advice.one_year_return.toFixed(2)}%
          </div>
        </div>
        <div className="bg-gray-50 p-5 rounded-lg shadow-sm">
          <div className="text-sm text-gray-600 mb-1">7-Day Prediction</div>
          <div className="text-2xl font-semibold text-gray-900">
            ₹{advice.predictions.arima_7day ? advice.predictions.arima_7day.toFixed(2) : 'N/A'}
          </div>
        </div>
      </div>
    </div>
<div className="border-b bg-white sticky top-0 z-10 px-4 py-3">
        <div className="relative">
          <select
            className="block w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
          >
            {tabOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>


      <div className="p-6">
        {activeTab === 'summary' && (
          <div>
            <h3 className="text-2xl font-semibold mb-6 text-gray-900">Strategy Overview</h3>
            
            {/* Recommendation Distribution Chart */}
            <div className="mb-10 bg-gray-50 p-6 rounded-lg shadow-sm">
              <h4 className="text-lg font-medium mb-4 text-gray-800">Recommendation Distribution</h4>
              <div className="h-64 flex justify-center">
                <div className="w-64">
                  <Doughnut 
                    data={{
                      ...recommendationData,
                      datasets: [{
                        ...recommendationData.datasets[0],
                        backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
                      }]
                    }} 
                    options={{
                      plugins: {
                        legend: {
                          position: 'bottom',
                        },
                        title: {
                          display: true,
                          text: 'Signal Distribution',
                          color: '#1F2937',
                          font: {
                            size: 14,
                            weight: 'normal'
                          }
                        },
                      },
                    }}
                  />
                </div>
              </div>
              <div className="text-center mt-4 text-gray-700">
                {advice.final_recommendation.reason}
              </div>
            </div>
            
            {/* Strategy Details */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
  {[
    { name: 'Buy & Hold', data: advice.recommendations.buy_and_hold },
    { name: 'Momentum', data: advice.recommendations.momentum },
    { name: 'Bollinger Bands', data: advice.recommendations.bollinger },
    { name: 'MA Crossover', data: advice.recommendations.ma_crossover },
    { name: 'Breakout', data: advice.recommendations.breakout },
    { name: 'Keltner Channels', data: advice.recommendations.keltner },
    { name: 'MACD', data: advice.recommendations.macd },
    { name: 'Mean Reversion', data: advice.recommendations.mean_reversion },
    { name: 'Parabolic SAR', data: advice.recommendations.parabolic_sar },
    { name: 'RSI', data: advice.recommendations.rsi },
    { name: 'Stochastic', data: advice.recommendations.stochastic },
    { name: 'Volume Spike', data: advice.recommendations.volume_spike }
  ].map((strategy, index) => (
    <div key={index} className={`border rounded-lg p-5 ${getSignalBgColor(strategy.data.signal)}`}>
      <div className="font-medium text-gray-800 mb-2">{strategy.name}</div>
      <div className={`text-lg font-semibold mb-3 ${getSignalColor(strategy.data.signal)}`}>
        {strategy.data.signal.toUpperCase()}
      </div>
      <div className="text-sm text-gray-700">{strategy.data.recommendation}</div>
    </div>
  ))}
</div>
          </div>
        )}

        {/* Keep your existing tab content but enhance with charts where appropriate */}
        {activeTab === 'buyhold' && (
          <div>
            <h3 className="text-xl font-semibold mb-4 text-black">Buy & Hold Strategy</h3>
            <div className="bg-gray-50 p-4 rounded-md shadow">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-700">Recommendation</div>
                  <div className={`text-xl font-semibold ${getSignalColor(advice.recommendations.buy_and_hold.signal)}`}>
                    {advice.recommendations.buy_and_hold.recommendation}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-700">1-Year Return</div>
                  <div className={`text-xl font-semibold ${advice.recommendations.buy_and_hold.return >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {advice.recommendations.buy_and_hold.return.toFixed(2)}%
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <div className="text-sm text-gray-700">Reasoning</div>
                <div className="text-base text-black">{advice.recommendations.buy_and_hold.reason}</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'bollinger' && (
          <div>
            <h3 className="text-xl font-semibold mb-4 text-black">Bollinger Bands Strategy</h3>
            
            {/* Bollinger Bands Visualization */}
            <div className="mb-6 h-64">
              <Bar 
                data={bollingerData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      display: false,
                    },
                    title: {
                      display: true,
                      text: 'Bollinger Bands Analysis',
                    },
                  },
                }}
              />
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md shadow">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-700">Recommendation</div>
                  <div className={`text-xl font-semibold ${getSignalColor(advice.recommendations.bollinger.signal)}`}>
                    {advice.recommendations.bollinger.recommendation}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-700">Current Position</div>
                  <div className="text-xl font-semibold text-black">
                    {advice.recommendations.bollinger.current_position?.replace(/_/g, ' ') || 'N/A'}
                  </div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-gray-700">Upper Band</div>
                  <div className="text-base font-medium text-black">₹{advice.recommendations.bollinger.bands.upper.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-700">Middle Band (MA)</div>
                  <div className="text-base font-medium text-black">₹{advice.recommendations.bollinger.bands.middle.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-700">Lower Band</div>
                  <div className="text-base font-medium text-black">₹{advice.recommendations.bollinger.bands.lower.toFixed(2)}</div>
                </div>
              </div>
              <div className="mt-4">
                <div className="text-sm text-gray-700">Distance from MA</div>
                <div className={`text-base font-medium ${advice.recommendations.bollinger.distance_from_ma >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {advice.recommendations.bollinger.distance_from_ma.toFixed(2)}%
                </div>
              </div>
              <div className="mt-4">
                <div className="text-sm text-gray-700">Reasoning</div>
                <div className="text-base text-black">{advice.recommendations.bollinger.reason}</div>
              </div>
            </div>
          </div>
        )}

{activeTab === 'breakout' && (
  <div>
    <h3 className="text-xl font-semibold mb-4 text-black">Breakout Strategy</h3>
    <div className="bg-gray-50 p-4 rounded-md shadow">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="text-sm text-gray-700">Recommendation</div>
          <div className={`text-xl font-semibold ${getSignalColor(advice.recommendations.breakout.signal)}`}>
            {advice.recommendations.breakout.recommendation}
          </div>
        </div>

      </div>
      
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="text-sm text-gray-700">Support Level</div>
          <div className="text-base font-medium text-black">
            ₹{advice.recommendations.breakout.support?.toFixed(2) || 'N/A'}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-700">Resistance Level</div>
          <div className="text-base font-medium text-black">
            ₹{advice.recommendations.breakout.resistance?.toFixed(2) || 'N/A'}
          </div>
        </div>
      </div>
      
      <div className="mt-4">
        <div className="text-sm text-gray-700">Current Price</div>
        <div className="text-base font-medium text-black">
          ₹{advice.current_price.toFixed(2)}
        </div>
      </div>
      
      <div className="mt-4">
        <div className="text-sm text-gray-700">Reasoning</div>
        <div className="text-base text-black">{advice.recommendations.breakout.reason}</div>
      </div>
    </div>
  </div>
)}

{activeTab === 'keltner' && (
  <div>
    <h3 className="text-xl font-semibold mb-4 text-black">Keltner Channels Strategy</h3>
    <div className="bg-gray-50 p-4 rounded-md shadow">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="text-sm text-gray-700">Recommendation</div>
          <div className={`text-xl font-semibold ${getSignalColor(advice.recommendations.keltner.signal)}`}>
            {advice.recommendations.keltner.recommendation}
          </div>
        </div>

      </div>
      
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="text-sm text-gray-700">Upper Band</div>
          <div className="text-base font-medium text-black">
            ₹{advice.recommendations.keltner.upper_band?.toFixed(2) || 'N/A'}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-700">Lower Band</div>
          <div className="text-base font-medium text-black">
            ₹{advice.recommendations.keltner.lower_band?.toFixed(2) || 'N/A'}
          </div>
        </div>
      </div>
      
      <div className="mt-4">
        <div className="text-sm text-gray-700">Current Price</div>
        <div className="text-base font-medium text-black">
          ₹{advice.current_price.toFixed(2)}
        </div>
      </div>
      
      <div className="mt-4">
        <div className="text-sm text-gray-700">Reasoning</div>
        <div className="text-base text-black">{advice.recommendations.keltner.reason}</div>
      </div>
    </div>
  </div>
)}

{activeTab === 'macd' && (
  <div>
    <h3 className="text-xl font-semibold mb-4 text-black">MACD Strategy</h3>
    <div className="bg-gray-50 p-4 rounded-md shadow">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="text-sm text-gray-700">Recommendation</div>
          <div className={`text-xl font-semibold ${getSignalColor(advice.recommendations.macd.signal)}`}>
            {advice.recommendations.macd.recommendation}
          </div>
        </div>

      </div>
      
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="text-sm text-gray-700">MACD Line</div>
          <div className={`text-base font-medium ${advice.recommendations.macd.macd >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {advice.recommendations.macd.macd?.toFixed(4) || 'N/A'}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-700">Signal Line</div>
          <div className={`text-base font-medium ${advice.recommendations.macd.signal_line >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {advice.recommendations.macd.signal_line?.toFixed(4) || 'N/A'}
          </div>
        </div>
      </div>
      
      <div className="mt-4">
        <div className="text-sm text-gray-700">Current Price</div>
        <div className="text-base font-medium text-black">
          ₹{advice.current_price.toFixed(2)}
        </div>
      </div>
      
      <div className="mt-4">
        <div className="text-sm text-gray-700">Reasoning</div>
        <div className="text-base text-black">{advice.recommendations.macd.reason}</div>
      </div>
    </div>
  </div>
)}

{activeTab === 'meanreversion' && (
  <div>
    <h3 className="text-xl font-semibold mb-4 text-black">Mean Reversion Strategy</h3>
    <div className="bg-gray-50 p-4 rounded-md shadow">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="text-sm text-gray-700">Recommendation</div>
          <div className={`text-xl font-semibold ${getSignalColor(advice.recommendations.mean_reversion.signal)}`}>
            {advice.recommendations.mean_reversion.recommendation}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-700">Z-Score</div>
          <div className={`text-xl font-semibold ${Math.abs(advice.recommendations.mean_reversion.z_score) > 2 ? 'text-red-600' : 'text-green-600'}`}>
            {advice.recommendations.mean_reversion.z_score?.toFixed(2) || 'N/A'}
          </div>
        </div>
      </div>
      
      <div className="mt-4">
        <div className="text-sm text-gray-700">Current Price</div>
        <div className="text-base font-medium text-black">
          ₹{advice.current_price.toFixed(2)}
        </div>
      </div>
      
      <div className="mt-4">
        <div className="text-sm text-gray-700">Reasoning</div>
        <div className="text-base text-black">{advice.recommendations.mean_reversion.reason}</div>
      </div>
      
      <div className="mt-4 text-sm text-gray-700">
        <p>Z-Score Interpretation:</p>
        <ul className="list-disc pl-5 mt-2">
          <li>Above 2: Overbought (potential sell signal)</li>
          <li>Below -2: Oversold (potential buy signal)</li>
          <li>Between -2 and 2: Within normal range</li>
        </ul>
      </div>
    </div>
  </div>
)}

{activeTab === 'parabolic' && (
  <div>
    <h3 className="text-xl font-semibold mb-4 text-black">Parabolic SAR Strategy</h3>
    <div className="bg-gray-50 p-4 rounded-md shadow">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="text-sm text-gray-700">Recommendation</div>
          <div className={`text-xl font-semibold ${getSignalColor(advice.recommendations.parabolic_sar.signal)}`}>
            {advice.recommendations.parabolic_sar.recommendation}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-700">SAR Value</div>
          <div className="text-xl font-semibold text-black">
            ₹{advice.recommendations.parabolic_sar.sar_value?.toFixed(2) || 'N/A'}
          </div>
        </div>
      </div>
      
      <div className="mt-4">
        <div className="text-sm text-gray-700">Current Price</div>
        <div className="text-base font-medium text-black">
          ₹{advice.current_price.toFixed(2)}
        </div>
      </div>
      
      <div className="mt-4">
        <div className="text-sm text-gray-700">Price vs SAR</div>
        <div className={`text-base font-medium ${advice.current_price > advice.recommendations.parabolic_sar.sar_value ? 'text-green-600' : 'text-red-600'}`}>
          {advice.current_price > advice.recommendations.parabolic_sar.sar_value ? 'Above SAR (Uptrend)' : 'Below SAR (Downtrend)'}
        </div>
      </div>
      
      <div className="mt-4">
        <div className="text-sm text-gray-700">Reasoning</div>
        <div className="text-base text-black">{advice.recommendations.parabolic_sar.reason}</div>
      </div>
    </div>
  </div>
)}

{activeTab === 'rsi' && (
  <div>
    <h3 className="text-xl font-semibold mb-4 text-black">RSI Strategy</h3>
    <div className="bg-gray-50 p-4 rounded-md shadow">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="text-sm text-gray-700">Recommendation</div>
          <div className={`text-xl font-semibold ${getSignalColor(advice.recommendations.rsi.signal)}`}>
            {advice.recommendations.rsi.recommendation}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-700">RSI Value</div>
          <div className={`text-xl font-semibold ${
            advice.recommendations.rsi.rsi_value > 70 ? 'text-red-600' :
            advice.recommendations.rsi.rsi_value < 30 ? 'text-green-600' : 'text-yellow-600'
          }`}>
            {advice.recommendations.rsi.rsi_value?.toFixed(2) || 'N/A'}
          </div>
        </div>
      </div>
      
      <div className="mt-4">
        <div className="text-sm text-gray-700">Current Price</div>
        <div className="text-base font-medium text-black">
          ₹{advice.current_price.toFixed(2)}
        </div>
      </div>
      
      <div className="mt-4">
        <div className="text-sm text-gray-700">Reasoning</div>
        <div className="text-base text-black">{advice.recommendations.rsi.reason}</div>
      </div>
      
      <div className="mt-4 text-sm text-gray-700">
        <p>RSI Interpretation:</p>
        <ul className="list-disc pl-5 mt-2">
          <li>Above 70: Overbought (potential sell signal)</li>
          <li>Below 30: Oversold (potential buy signal)</li>
          <li>Between 30 and 70: Neutral</li>
        </ul>
      </div>
    </div>
  </div>
)}

{activeTab === 'stochastic' && (
  <div>
    <h3 className="text-xl font-semibold mb-4 text-black">Stochastic Oscillator Strategy</h3>
    <div className="bg-gray-50 p-4 rounded-md shadow">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="text-sm text-gray-700">Recommendation</div>
          <div className={`text-xl font-semibold ${getSignalColor(advice.recommendations.stochastic.signal)}`}>
            {advice.recommendations.stochastic.recommendation}
          </div>
        </div>

      </div>
      
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="text-sm text-gray-700">%K Line</div>
          <div className={`text-base font-medium ${
            advice.recommendations.stochastic.k_percent > 80 ? 'text-red-600' :
            advice.recommendations.stochastic.k_percent < 20 ? 'text-green-600' : 'text-yellow-600'
          }`}>
            {advice.recommendations.stochastic.k_percent?.toFixed(2) || 'N/A'}%
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-700">%D Line</div>
          <div className={`text-base font-medium ${
            advice.recommendations.stochastic.d_percent > 80 ? 'text-red-600' :
            advice.recommendations.stochastic.d_percent < 20 ? 'text-green-600' : 'text-yellow-600'
          }`}>
            {advice.recommendations.stochastic.d_percent?.toFixed(2) || 'N/A'}%
          </div>
        </div>
      </div>
      
      <div className="mt-4">
        <div className="text-sm text-gray-700">Current Price</div>
        <div className="text-base font-medium text-black">
          ₹{advice.current_price.toFixed(2)}
        </div>
      </div>
      
      <div className="mt-4">
        <div className="text-sm text-gray-700">Reasoning</div>
        <div className="text-base text-black">{advice.recommendations.stochastic.reason}</div>
      </div>
      
      <div className="mt-4 text-sm text-gray-700">
        <p>Stochastic Interpretation:</p>
        <ul className="list-disc pl-5 mt-2">
          <li>Above 80: Overbought (potential sell signal)</li>
          <li>Below 20: Oversold (potential buy signal)</li>
          <li>Between 20 and 80: Neutral</li>
        </ul>
      </div>
    </div>
  </div>
)}

{activeTab === 'volume' && (
  <div>
    <h3 className="text-xl font-semibold mb-4 text-black">Volume Spike Strategy</h3>
    <div className="bg-gray-50 p-4 rounded-md shadow">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="text-sm text-gray-700">Recommendation</div>
          <div className={`text-xl font-semibold ${getSignalColor(advice.recommendations.volume_spike.signal)}`}>
            {advice.recommendations.volume_spike.recommendation}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-700">Volume Ratio</div>
          <div className={`text-xl font-semibold ${advice.recommendations.volume_spike.volume_ratio > 2 ? 'text-green-600' : 'text-gray-600'}`}>
            {advice.recommendations.volume_spike.volume_ratio?.toFixed(2) || 'N/A'}x
          </div>
        </div>
      </div>
      
      <div className="mt-4">
        <div className="text-sm text-gray-700">Current Price</div>
        <div className="text-base font-medium text-black">
          ₹{advice.current_price.toFixed(2)}
        </div>
      </div>
      
      <div className="mt-4">
        <div className="text-sm text-gray-700">Reasoning</div>
        <div className="text-base text-black">{advice.recommendations.volume_spike.reason}</div>
      </div>
      
      <div className="mt-4 text-sm text-gray-700">
        <p>Volume Ratio Interpretation:</p>
        <ul className="list-disc pl-5 mt-2">
          <li>Above 2x: Significant volume spike (stronger signal)</li>
          <li>Below 2x: Normal volume (weaker signal)</li>
        </ul>
      </div>
    </div>
  </div>
)}

        {activeTab === 'prediction' && (
          <div>
            <h3 className="text-xl font-semibold mb-4 text-black">Price Predictions</h3>
            
            {/* Price Prediction Chart */}
            <div className="mb-6 h-64">
              <Line 
                data={predictionData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                    title: {
                      display: true,
                      text: '7-Day Price Prediction',
                    },
                  },
                }}
              />
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md shadow">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-700">7-Day ARIMA Prediction</div>
                  {advice.predictions.arima_7day ? (
                    <div className="text-xl font-semibold text-black">
                      ₹{advice.predictions.arima_7day.toFixed(2)}
                      <span className="text-sm ml-2 ${((advice.predictions.arima_7day - advice.current_price) / advice.current_price * 100) >= 0 ? 'text-green-600' : 'text-red-600'}">
                        ({((advice.predictions.arima_7day - advice.current_price) / advice.current_price * 100).toFixed(2)}%)
                      </span>
                    </div>
                  ) : (
                    <div className="text-base text-black">Not available</div>
                  )}
                </div>
                <div>
                  <div className="text-sm text-gray-700">Potential Change</div>
                  {advice.predictions.arima_7day ? (
                    <div className={`text-xl font-semibold ${(advice.predictions.arima_7day - advice.current_price) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₹{(advice.predictions.arima_7day - advice.current_price).toFixed(2)}
                    </div>
                  ) : (
                    <div className="text-base text-black">Not available</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'momentum' && (
          <div>
            <h3 className="text-xl font-semibold mb-4 text-black">Momentum Strategy</h3>
            <div className="bg-gray-50 p-4 rounded-md shadow">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-700">Recommendation</div>
                  <div className={`text-xl font-semibold ${getSignalColor(advice.recommendations.momentum.signal)}`}>
                    {advice.recommendations.momentum.recommendation}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-700">Momentum Value</div>
                  <div className={`text-xl font-semibold ${advice.recommendations.momentum.momentum >= 0.05 ? 'text-green-600' : advice.recommendations.momentum.momentum <= -0.05 ? 'text-red-600' : 'text-yellow-600'}`}>
                    {(advice.recommendations.momentum.momentum * 100).toFixed(2)}%
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <div className="text-sm text-gray-700">Reasoning</div>
                <div className="text-base text-black">{advice.recommendations.momentum.reason}</div>
              </div>
              
              {/* Momentum Visualization */}
              <div className="mt-6 p-4 bg-white rounded-md shadow">
                <h4 className="text-md font-medium mb-2 text-black">Momentum Indicator</h4>
                <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-px h-full bg-gray-400"></div>
                    <div className="absolute left-1/4 w-px h-full bg-gray-400"></div>
                    <div className="absolute right-1/4 w-px h-full bg-gray-400"></div>
                  </div>
                  <div 
                    className={`absolute top-0 bottom-0 ${advice.recommendations.momentum.momentum >= 0.05 ? 'bg-green-500' : advice.recommendations.momentum.momentum <= -0.05 ? 'bg-red-500' : 'bg-yellow-500'}`}
                    style={{
                      left: '50%',
                      width: '4px',
                      transform: `translateX(${Math.min(Math.max(advice.recommendations.momentum.momentum * 500, -50), 50)}px)`
                    }}
                  ></div>
                  <div className="absolute inset-x-0 bottom-0 flex justify-between px-2 text-xs text-gray-600">
                    <span>Strong Sell</span>
                    <span>Sell</span>
                    <span>Neutral</span>
                    <span>Buy</span>
                    <span>Strong Buy</span>
                  </div>
                </div>
                <div className="mt-2 text-sm text-center text-gray-700">
                  Momentum measures the rate of change in price. Values above 5% indicate strong upward momentum (buy signal),
                  while values below -5% indicate strong downward momentum (sell signal).
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ma' && (
          <div>
            <h3 className="text-xl font-semibold mb-4 text-black">Moving Average Crossover Strategy</h3>
            <div className="bg-gray-50 p-4 rounded-md shadow">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-700">Recommendation</div>
                  <div className={`text-xl font-semibold ${getSignalColor(advice.recommendations.ma_crossover.signal)}`}>
                    {advice.recommendations.ma_crossover.recommendation}
                  </div>
                </div>

              </div>
              
              {/* Moving Averages Comparison */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-700">50-Day MA</div>
                  <div className="text-base font-medium text-black">
                    ₹{advice.recommendations.ma_crossover.moving_averages?.sma50?.toFixed(2) || 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-700">200-Day MA</div>
                  <div className="text-base font-medium text-black">
                    ₹{advice.recommendations.ma_crossover.moving_averages?.sma200?.toFixed(2) || 'N/A'}
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <div className="text-sm text-gray-700">Current Price</div>
                <div className="text-base font-medium text-black">
                  ₹{advice.current_price.toFixed(2)}
                </div>
              </div>
              
              <div className="mt-4">
                <div className="text-sm text-gray-700">Reasoning</div>
                <div className="text-base text-black">{advice.recommendations.ma_crossover.reason}</div>
              </div>
              
              {/* MA Crossover Visualization */}
              <div className="mt-6 p-4 bg-white rounded-md shadow">
                <h4 className="text-md font-medium mb-2 text-black">Moving Average Comparison</h4>
                <div className="relative h-24 bg-gray-100 rounded-md overflow-hidden">
                  {/* Price line */}
                  <div className="absolute left-0 right-0 border-t border-blue-500 z-30"
                       style={{
                         top: `${100 - (advice.current_price / Math.max(
                           advice.recommendations.ma_crossover.moving_averages?.sma50 || 0,
                           advice.recommendations.ma_crossover.moving_averages?.sma200 || 0,
                           advice.current_price
                         ) * 100)}%`
                       }}>
                    <div className="absolute -top-2 -right-1 bg-blue-500 text-white text-xs px-1 rounded">
                      Price
                    </div>
                  </div>
                  
                  {/* 50-day MA line */}
                  {advice.recommendations.ma_crossover.moving_averages?.sma50 && (
                    <div className="absolute left-0 right-0 border-t border-green-500 z-20"
                         style={{
                           top: `${100 - (advice.recommendations.ma_crossover.moving_averages.sma50 / Math.max(
                             advice.recommendations.ma_crossover.moving_averages.sma50,
                             advice.recommendations.ma_crossover.moving_averages?.sma200 || 0,
                             advice.current_price
                           ) * 100)}%`
                         }}>
                      <div className="absolute -top-2 -right-1 bg-green-500 text-white text-xs px-1 rounded">
                        50-MA
                      </div>
                    </div>
                  )}
                  
                  {/* 200-day MA line */}
                  {advice.recommendations.ma_crossover.moving_averages?.sma200 && (
                    <div className="absolute left-0 right-0 border-t border-red-500 z-10"
                         style={{
                           top: `${100 - (advice.recommendations.ma_crossover.moving_averages.sma200 / Math.max(
                             advice.recommendations.ma_crossover.moving_averages?.sma50 || 0,
                             advice.recommendations.ma_crossover.moving_averages.sma200,
                             advice.current_price
                           ) * 100)}%`
                         }}>
                      <div className="absolute -top-2 -right-1 bg-red-500 text-white text-xs px-1 rounded">
                        200-MA
                      </div>
                    </div>
                  )}
                </div>
                <div className="mt-2 text-sm text-center text-gray-700">
                  When the 50-day MA crosses above the 200-day MA, it's a bullish signal (Golden Cross).
                  When it crosses below, it's a bearish signal (Death Cross).
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Keep other tabs with similar enhancements */}
      </div>
    </div>
  );
}