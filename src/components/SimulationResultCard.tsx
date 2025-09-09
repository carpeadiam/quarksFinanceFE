import { useState, useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

type Trade = {
  action: string;
  date: number;
  price: number;
  reason: string;
  shares: number;
  value: number;
};

type SimulationResult = {
  backtest_id: string;
  data_points: number;
  period: string;
  results: {
    annualized_return: number;
    average_loss: number;
    average_win: number;
    daily_returns: number[];
    final_value: number;
    initial_cash: number;
    max_drawdown: number;
    max_drawdown_duration: number;
    portfolio_values: number[];
    profit_factor: number;
    sharpe_ratio: number;
    signals_generated: { signal: string }[];
    sortino_ratio: number;
    total_return: number;
    total_trades: number;
    trades: Trade[];
    volatility: number;
    win_rate: number;
  };
  success: boolean;
  symbol: string;
};

type SimulationResultCardProps = {
  result: SimulationResult;
};

export default function SimulationResultCard({ result }: SimulationResultCardProps) {
  const [activeTab, setActiveTab] = useState('simulation');
  const [simulationIndex, setSimulationIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState(500); // ms per step
  const simulationInterval = useRef<NodeJS.Timeout | null>(null);
  
  // Format date for display
  const formatDate = (dateIndex: number) => {
    // Assuming data starts from 2023-01-01
    const startDate = new Date('2023-01-01');
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + dateIndex);
    
    return currentDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get portfolio values up to current simulation point
  const currentPortfolioValues = result.results.portfolio_values.slice(0, simulationIndex + 1);
  const currentDates = Array.from({ length: simulationIndex + 1 }, (_, i) => i);

  // Prepare data for simulation chart
  const simulationData = {
    labels: currentDates.map(dateIndex => formatDate(dateIndex)),
    datasets: [
      {
        label: 'Portfolio Value',
        data: currentPortfolioValues,
        borderColor: 'rgb(75, 85, 99)',
        backgroundColor: 'rgba(75, 85, 99, 0.5)',
        tension: 0.1,
        pointRadius: (ctx: any) => {
          // Highlight points where trades occurred
          const dateIndex = ctx.dataIndex;
          const hasTrade = result.results.trades.some(trade => trade.date === dateIndex);
          return hasTrade ? 6 : 0;
        },
        pointBackgroundColor: (ctx: any) => {
          const dateIndex = ctx.dataIndex;
          const trade = result.results.trades.find(trade => trade.date === dateIndex);
          if (trade) {
            return trade.action === 'BUY' ? '#059669' : '#DC2626';
          }
          return 'rgba(0, 0, 0, 0)';
        },
        pointBorderColor: (ctx: any) => {
          const dateIndex = ctx.dataIndex;
          const trade = result.results.trades.find(trade => trade.date === dateIndex);
          if (trade) {
            return trade.action === 'BUY' ? '#059669' : '#DC2626';
          }
          return 'rgba(0, 0, 0, 0)';
        },
        pointBorderWidth: 2,
        pointHoverRadius: 8,
      },
    ],
  };

  // Get trades up to current simulation point
  const currentTrades = result.results.trades.filter(trade => trade.date <= simulationIndex);

  // Control simulation playback
  useEffect(() => {
    if (isPlaying) {
      simulationInterval.current = setInterval(() => {
        setSimulationIndex(prev => {
          if (prev < result.results.portfolio_values.length - 1) {
            return prev + 1;
          } else {
            setIsPlaying(false);
            return prev;
          }
        });
      }, simulationSpeed);
    } else if (simulationInterval.current) {
      clearInterval(simulationInterval.current);
    }

    return () => {
      if (simulationInterval.current) {
        clearInterval(simulationInterval.current);
      }
    };
  }, [isPlaying, simulationSpeed, result.results.portfolio_values.length]);

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: false,
        grid: {
          color: 'rgba(229, 231, 235, 0.5)'
        },
        ticks: {
          color: '#4B5563'
        }
      },
      x: {
        grid: {
          color: 'rgba(229, 231, 235, 0.5)'
        },
        ticks: {
          color: '#4B5563',
          maxRotation: 45,
          minRotation: 45
        }
      }
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          afterLabel: function(context: any) {
            const dateIndex = context.dataIndex;
            const trades = result.results.trades.filter(trade => trade.date === dateIndex);
            if (trades.length > 0) {
              return trades.map(trade => 
                `${trade.action}: ${trade.shares} shares @ ₹${trade.price.toFixed(2)} (${trade.reason})`
              );
            }
            return '';
          }
        }
      }
    },
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl border border-gray-200 overflow-hidden" style={{ fontFamily: 'Rubik, sans-serif'}}>
      <div className="p-8 border-b bg-white">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold text-gray-900">{result.symbol} Simulation Results</h2>
          <div className="flex items-center space-x-2">
            <span className={`text-lg font-semibold ${result.results.total_return >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {(result.results.total_return * 100).toFixed(2)}%
            </span>
            <span className={`text-sm font-medium ${result.results.total_return >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ({result.results.final_value > result.results.initial_cash ? '+' : ''}₹{(result.results.final_value - result.results.initial_cash).toFixed(2)})
            </span>
          </div>
        </div>
        
        <div className="mt-6">
          <div className="flex border-b">
            <button
              className={`px-4 py-2 font-medium text-sm ${activeTab === 'simulation' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('simulation')}
            >
              Simulation
            </button>
            <button
              className={`px-4 py-2 font-medium text-sm ${activeTab === 'summary' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('summary')}
            >
              Summary
            </button>
            <button
              className={`px-4 py-2 font-medium text-sm ${activeTab === 'trades' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('trades')}
            >
              Trades
            </button>
          </div>
        </div>
      </div>

      <div className="p-8">
        {activeTab === 'simulation' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-semibold text-gray-900">Portfolio Simulation</h3>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">Speed:</label>
                  <select 
                    value={simulationSpeed}
                    onChange={(e) => setSimulationSpeed(Number(e.target.value))}
                    className="border rounded px-2 py-1 text-sm font-medium bg-white text-gray-800 border-gray-300 focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                  >
                    <option value="1000" className="font-medium">Slow</option>
                    <option value="500" className="font-medium">Normal</option>
                    <option value="200" className="font-medium">Fast</option>
                    <option value="50" className="font-medium">Very Fast</option>
                  </select>
                </div>
                <button 
                  onClick={() => setSimulationIndex(0)}
                  className="p-2 text-gray-600 hover:text-gray-900"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.707-10.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L9.414 11H13a1 1 0 100-2H9.414l1.293-1.293z" clipRule="evenodd" />
                  </svg>
                </button>
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-2 text-gray-600 hover:text-gray-900"
                >
                  {isPlaying ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <div className="bg-gray-50 p-4 rounded-lg shadow-sm h-80">
                  <Line data={simulationData} options={chartOptions} />
                </div>
                <div className="mt-4 flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    {simulationIndex < result.results.portfolio_values.length ? 
                      formatDate(simulationIndex) : 'Simulation Complete'}
                  </span>
                  <input 
                    type="range" 
                    min="0" 
                    max={result.results.portfolio_values.length - 1} 
                    value={simulationIndex}
                    onChange={(e) => setSimulationIndex(Number(e.target.value))}
                    className="w-2/3"
                  />
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg shadow-sm overflow-auto h-80">
                <h4 className="font-medium text-gray-800 mb-3">Trades</h4>
                {currentTrades.length > 0 ? (
                  <div className="space-y-3">
                    {currentTrades.map((trade, index) => (
                      <div 
                        key={index} 
                        className={`p-3 rounded-lg ${trade.action === 'BUY' ? 'bg-green-50 border-l-4 border-green-500' : 'bg-red-50 border-l-4 border-red-500'}`}
                      >
                        <div className="flex justify-between">
                          <span className={`font-bold text-base ${trade.action === 'BUY' ? 'text-green-700' : 'text-red-700'}`}>
                            {trade.action}
                          </span>
                          <span className="text-gray-700 text-sm font-medium">
                            {formatDate(trade.date)}
                          </span>
                        </div>
                        <div className="mt-2 text-sm">
                          <div className="font-medium text-gray-800">
                            <span className="font-bold">{trade.shares}</span> shares @ ₹{trade.price.toFixed(2)}
                          </div>
                          <div className="text-gray-600 text-xs mt-1">
                            Reason: {trade.reason}
                          </div>
                          <div className="font-medium text-gray-800 mt-1">
                            Value: ₹{trade.value.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No trades yet
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'summary' && (
          <div>
            <h3 className="text-2xl font-semibold mb-6 text-gray-900">Performance Summary</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
                <h4 className="text-lg font-medium mb-4 text-gray-800">Return Statistics</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Return</span>
                    <span className={`font-medium ${result.results.total_return >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {(result.results.total_return * 100).toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Annualized Return</span>
                    <span className={`font-medium ${result.results.annualized_return >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {(result.results.annualized_return * 100).toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Initial Cash</span>
                    <span className="font-medium text-gray-800">₹{result.results.initial_cash.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Final Value</span>
                    <span className="font-medium text-gray-800">₹{result.results.final_value.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Profit/Loss</span>
                    <span className={`font-medium ${result.results.final_value - result.results.initial_cash >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₹{(result.results.final_value - result.results.initial_cash).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
                <h4 className="text-lg font-medium mb-4 text-gray-800">Risk Metrics</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sharpe Ratio</span>
                    <span className="font-medium text-gray-800">{result.results.sharpe_ratio.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sortino Ratio</span>
                    <span className="font-medium text-gray-800">{result.results.sortino_ratio.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Max Drawdown</span>
                    <span className="font-medium text-gray-800">{(result.results.max_drawdown * 100).toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Volatility</span>
                    <span className="font-medium text-gray-800">{(result.results.volatility * 100).toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Profit Factor</span>
                    <span className="font-medium text-gray-800">{result.results.profit_factor.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
              <h4 className="text-lg font-medium mb-4 text-gray-800">Trade Statistics</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-gray-900">{result.results.total_trades}</div>
                  <div className="text-gray-600">Total Trades</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-gray-900">{(result.results.win_rate * 100).toFixed(0)}%</div>
                  <div className="text-gray-600">Win Rate</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-gray-900">₹{result.results.average_win.toFixed(2)}</div>
                  <div className="text-gray-600">Average Win</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-gray-900">₹{Math.abs(result.results.average_loss).toFixed(2)}</div>
                  <div className="text-gray-600">Average Loss</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-gray-900">{result.results.max_drawdown_duration}</div>
                  <div className="text-gray-600">Max Drawdown Days</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-gray-900">{result.data_points}</div>
                  <div className="text-gray-600">Data Points</div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'trades' && (
          <div>
            <h3 className="text-2xl font-semibold mb-6 text-gray-900">Trade History</h3>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shares</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {result.results.trades.map((trade, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${trade.action === 'BUY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {trade.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(trade.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {trade.shares}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{trade.price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{trade.value.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {trade.reason}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}