'use client'
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/src/components/ui/Button';
import LoadingSpinner from '@/src/components/ui/LoadingSpinner';
import { Badge } from '@/src/components/ui/badge';
import Navbar from '../../components/navigation/Navbar';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import axios from 'axios';

// Dynamically import Chart component to avoid SSR issues
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

// Add this modal component after the imports
const StockDetailModal = ({ 
  stock, 
  symbol, 
  isOpen, 
  onClose,
  onViewHistoricalData
}: { 
  stock: any; 
  symbol: string; 
  isOpen: boolean; 
  onClose: () => void; 
  onViewHistoricalData: () => void;
}) => {
  if (!isOpen) return null;

  // Determine recommendation based on score
  const getRecommendation = () => {
    if (stock.score > 0.5) return { text: 'Strong Buy', color: 'text-green-600', bg: 'bg-green-100' };
    if (stock.score > 0) return { text: 'Buy', color: 'text-green-600', bg: 'bg-green-50' };
    if (stock.score < -0.5) return { text: 'Strong Sell', color: 'text-red-600', bg: 'bg-red-100' };
    if (stock.score < 0) return { text: 'Sell', color: 'text-red-600', bg: 'bg-red-50' };
    return { text: 'Hold', color: 'text-yellow-600', bg: 'bg-yellow-50' };
  };

  const recommendation = getRecommendation();

  return (
    <div className="fixed inset-0 bg-light-grey bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">{symbol}</h2>
              <p className="text-gray-600">Detailed Stock Analysis</p>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            >
              ×
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-lg font-semibold mb-3">Performance Metrics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Overall Score:</span>
                  <span className={`font-semibold ${stock.score > 0 ? 'text-green-600' : stock.score < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                    {typeof stock.score === 'number' ? stock.score.toFixed(2) : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Growth Rate:</span>
                  <span className={`font-semibold ${stock.slope > 0 ? 'text-green-600' : stock.slope < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                    {typeof stock.slope === 'number' ? stock.slope.toFixed(2) + '%' : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Expected Return:</span>
                  <span className={`font-semibold ${stock.expected_return > 0 ? 'text-green-600' : stock.expected_return < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                    {typeof stock.expected_return === 'number' ? stock.expected_return.toFixed(2) + '%' : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Trend Strength:</span>
                  <span className={`font-semibold ${stock.trend_strength > 0 ? 'text-green-600' : stock.trend_strength < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                    {typeof stock.trend_strength === 'number' ? stock.trend_strength.toFixed(2) : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-lg font-semibold mb-3">Additional Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Sector:</span>
                  <span className="font-semibold">{stock.sector || 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Recommendation:</span>
                  <span className={`font-semibold ${recommendation.color} ${recommendation.bg} px-2 py-1 rounded-full`}>
                    {recommendation.text}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Risk Level:</span>
                  <span className="font-semibold">
                    {Math.abs(stock.slope) > 2 ? 'High' : Math.abs(stock.slope) > 1 ? 'Medium' : 'Low'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <h3 className="text-lg font-semibold mb-3">Analysis Summary</h3>
            <p className="text-gray-700">
              {stock.score > 0 
                ? `${symbol} shows positive momentum with a score of ${stock.score.toFixed(2)}. The stock has a growth rate of ${stock.slope.toFixed(2)}% and an expected return of ${stock.expected_return.toFixed(2)}%. This presents a favorable opportunity for investment.`
                : `${symbol} shows negative momentum with a score of ${stock.score.toFixed(2)}. The stock has a declining trend with a growth rate of ${stock.slope.toFixed(2)}%. Caution is advised before investing.`}
            </p>
          </div>
          
          <div className="flex gap-4">
            <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-semibold">
              Add to Watchlist
            </Button>
            <Button 
              onClick={onViewHistoricalData}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-xl font-semibold"
            >
              View Historical Data
            </Button>
            <Button 
              onClick={onClose}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-xl font-semibold"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Add this new component for the historical data chart
const HistoricalDataModal = ({ 
  symbol, 
  isOpen, 
  onClose 
}: { 
  symbol: string; 
  isOpen: boolean; 
  onClose: () => void; 
}) => {
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRange, setSelectedRange] = useState('3m');

  useEffect(() => {
    if (isOpen && symbol) {
      fetchHistoricalData(selectedRange);
    }
  }, [isOpen, symbol, selectedRange]);

  const fetchHistoricalData = async (range: string) => {
    setLoading(true);
    setError(null);
    try {
      // Add .NS suffix if not already present
      const ticker = symbol.endsWith('.NS') ? symbol : `${symbol}.NS`;
      const response = await fetch(
        `https://thecodeworks.in/quarksfinance/api/candles/${ticker}?range=${range}`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.candles && data.volumes) {
        // For 1d range, filter data to only include NSE trading hours (11:00 AM to 3:30 PM IST)
        let candles = data.candles;
        let volumes = data.volumes;
        
        if (range === '1d') {
          // Filter candles to only include data between 11:00 AM and 3:30 PM
          candles = data.candles.filter(([dateStr]: [string, number, number, number, number]) => {
            const date = new Date(dateStr);
            const hours = date.getHours();
            const minutes = date.getMinutes();
            // Keep data between 11:00 AM (11:00) and 3:30 PM (15:30)
            return (hours > 11 || (hours === 11 && minutes >= 0)) && 
                   (hours < 15 || (hours === 15 && minutes <= 30));
          });
          
          // Filter volumes with the same logic
          volumes = data.volumes.filter(([dateStr]: [string, number]) => {
            const date = new Date(dateStr);
            const hours = date.getHours();
            const minutes = date.getMinutes();
            // Keep data between 11:00 AM (11:00) and 3:30 PM (15:30)
            return (hours > 11 || (hours === 11 && minutes >= 0)) && 
                   (hours < 15 || (hours === 15 && minutes <= 30));
          });
        }
        
        setChartData({
          candles,
          volumes
        });
      } else {
        setError('No data available for this stock/range');
      }
    } catch (err) {
      console.error('Error fetching historical data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch historical data');
    } finally {
      setLoading(false);
    }
  };

  const chartOptions = {
    chart: {
      type: 'candlestick' as const,
      height: 350,
      toolbar: {
        show: true
      }
    },
    title: {
      text: `${symbol} Historical Data`,
      align: 'left' as const
    },
    xaxis: {
      type: 'datetime' as const,
      labels: {
        datetimeUTC: false,
        format: selectedRange === '1d' ? 'HH:mm' : undefined // Show only hours and minutes for 1d range
      },
      // For 1d range, set min and max to restrict to NSE trading hours
      min: selectedRange === '1d' ? new Date().setHours(11, 0, 0, 0) : undefined,
      max: selectedRange === '1d' ? new Date().setHours(15, 30, 0, 0) : undefined
    },
    yaxis: {
      tooltip: {
        enabled: true
      }
    },
    tooltip: {
      enabled: true,
      fixed: {
        enabled: true,
        position: 'topLeft' as const,
        offsetX: 0,
        offsetY: 30,
      },
      // Custom formatter for tooltip to show time in a clearer format
      custom: selectedRange === '1d' ? function({ seriesIndex, dataPointIndex, w }: { seriesIndex: number; dataPointIndex: number; w: any; }) {
        const date = new Date(w.globals.seriesX[seriesIndex][dataPointIndex]);
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const timeStr = `${hours}:${minutes}`;
        
        const open = w.globals.seriesCandleO[seriesIndex][dataPointIndex];
        const high = w.globals.seriesCandleH[seriesIndex][dataPointIndex];
        const low = w.globals.seriesCandleL[seriesIndex][dataPointIndex];
        const close = w.globals.seriesCandleC[seriesIndex][dataPointIndex];
        
        return `
          <div class="bg-white p-2 shadow-lg rounded border">
            <div class="font-bold">${timeStr}</div>
            <div>Open: ${open.toFixed(2)}</div>
            <div>High: ${high.toFixed(2)}</div>
            <div>Low: ${low.toFixed(2)}</div>
            <div>Close: ${close.toFixed(2)}</div>
          </div>
        `;
      } : undefined
    }
  };

  const volumeChartOptions = {
    chart: {
      type: 'bar' as const,
      height: 150,
      toolbar: {
        show: false
      }
    },
    dataLabels: {
      enabled: false
    },
    xaxis: {
      type: 'datetime' as const,
      labels: {
        datetimeUTC: false,
        format: selectedRange === '1d' ? 'HH:mm' : undefined // Show only hours and minutes for 1d range
      },
      // For 1d range, set min and max to restrict to NSE trading hours
      min: selectedRange === '1d' ? new Date().setHours(11, 0, 0, 0) : undefined,
      max: selectedRange === '1d' ? new Date().setHours(15, 30, 0, 0) : undefined
    },
    yaxis: {
      show: false
    },
    tooltip: {
      enabled: true,
      custom: selectedRange === '1d' ? function({ seriesIndex, dataPointIndex, w }: { seriesIndex: number; dataPointIndex: number; w: any; }) {
        const date = new Date(w.globals.seriesX[seriesIndex][dataPointIndex]);
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const timeStr = `${hours}:${minutes}`;
        const volume = w.globals.series[seriesIndex][dataPointIndex];
        
        return `
          <div class="bg-white p-2 shadow-lg rounded border">
            <div class="font-bold">${timeStr}</div>
            <div>Volume: ${volume.toLocaleString()}</div>
          </div>
        `;
      } : undefined
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-opacity-30 backdrop-blur-lg flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">{symbol} Historical Data</h2>
              <p className="text-gray-600">Price and volume chart</p>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            >
              ×
            </button>
          </div>
          
          {/* Range Selector */}
          <div className="flex flex-wrap gap-2 mb-6">
            {['1d', '3d', '1w', '1m', '3m', '6m', '1y'].map((range) => (
              <button
                key={range}
                onClick={() => setSelectedRange(range)}
                className={`px-4 py-2 rounded-lg font-medium ${
                  selectedRange === range
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
              <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Data</h3>
              <p className="text-red-600">{error}</p>
              <Button 
                onClick={() => fetchHistoricalData(selectedRange)}
                className="mt-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
              >
                Retry
              </Button>
            </div>
          ) : chartData ? (
            <div className="space-y-6">
              {/* Candlestick Chart */}
              <div className="bg-gray-50 rounded-xl p-4">
                <Chart
                  options={chartOptions}
                  series={[{
                    name: 'Price',
                    data: chartData.candles.map(([date, open, high, low, close]: [string, number, number, number, number]) => ({
                      x: new Date(date).getTime(),
                      y: [open, high, low, close]
                    }))
                  }]}
                  type="candlestick"
                  height={350}
                />
              </div>
              
              {/* Volume Chart */}
              <div className="bg-gray-50 rounded-xl p-4">
                <Chart
                  options={volumeChartOptions}
                  series={[{
                    name: 'Volume',
                    data: chartData.volumes.map(([date, volume]: [string, number]) => ({
                      x: new Date(date).getTime(),
                      y: volume
                    }))
                  }]}
                  type="bar"
                  height={150}
                />
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-6 text-center">
              <p className="text-gray-600">No data available</p>
            </div>
          )}
          
          <div className="flex justify-end mt-6">
            <Button 
              onClick={onClose}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-xl font-semibold"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Type definitions
type StockData = {
  slope: number;
  sector: string;
  expected_return: number;
  trend_strength: number;
  score: number;
};

type Stocks = {
  [symbol: string]: StockData;
};

type SectorData = {
  [sector: string]: Array<{ company: string; ticker: string; sector: string }>;
};

export default function ForecastTrendsPage() {
  const [stocks, setStocks] = useState<Stocks | null>(null);
  const [sectorData, setSectorData] = useState<SectorData | null>(null);
  const [sortKey, setSortKey] = useState<'score' | 'slope' | 'expected_return' | 'trend_strength'>('score');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Add these new state variables for the modal
  const [selectedStock, setSelectedStock] = useState<{symbol: string, data: any} | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoricalModalOpen, setIsHistoricalModalOpen] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    positiveScore: false,
    positiveGrowth: false,
    positiveReturn: false,
    positiveStrength: false,
  });
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('https://thecodeworks.in/quarksfinance/api/forecast-trends');
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        const responseText = await response.text();
        console.log('Raw API response:', responseText);
        
        // Try to parse the response as JSON
        let data;
        try {
          data = JSON.parse(responseText);
          console.log('Parsed data:', data);
          console.log('Data type:', typeof data);
          
          // If data is still a string after parsing, try parsing again
          if (typeof data === 'string') {
            console.log('Data is still a string after parsing, attempting to parse again');
            data = JSON.parse(data);
            console.log('Data after second parse:', data);
            console.log('Data type after second parse:', typeof data);
          }
          
          console.log('Is array?', Array.isArray(data));
          console.log('Is null?', data === null);
        } catch (error) {
          const parseError = error instanceof Error ? error : new Error('Unknown parsing error');
          console.error('JSON parse error:', parseError);
          throw new Error(`Invalid JSON response: ${parseError.message}`);
        }
        if (!data) {
          throw new Error('Empty response data');
        }
        try {
          const hasValidEntries = Object.entries(data).some(([_, stockData]: [string, any]) => {
            return stockData && 
              typeof stockData.score === 'number' && 
              typeof stockData.slope === 'number' && 
              typeof stockData.expected_return === 'number' && 
              typeof stockData.trend_strength === 'number';
          });
          
          if (!hasValidEntries) {
            throw new Error('No valid stock data found in API response');
          }
          
          setStocks(data);
          const uniqueSectors = new Set<string>();
          Object.values(data).forEach(stock => {
            if (data.sector) {
              uniqueSectors.add(data.sector);
            }
          });
          
          // If we found sectors in the API response, use them
          if (uniqueSectors.size > 0) {
            const sectorsObject: SectorData = {};
            uniqueSectors.forEach(sector => {
              sectorsObject[sector] = [];
            });
            setSectorData(sectorsObject);
          }
        } catch (error) {
          console.error('Error validating stock data:', error);
          throw new Error(`Failed to validate stock data: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      } catch (error) {
        const fetchError = error instanceof Error ? error : new Error('Unknown error during fetch');
        console.error('Error fetching forecast trends:', fetchError);
        setError(fetchError.message || 'Failed to load forecast data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    // Add this after the imports
    const PREDEFINED_SECTORS = [
      "Information Technology",
      "Banking",
      "Pharmaceuticals",
      "Automobile",
      "Financial Services",
      "Metals & Mining",
      "Energy",
      "Construction & Real Estate",
      "FMCG"
    ];

    // Then modify the fetchSectorData function to include these sectors
    const fetchSectorData = async () => {
      try {
        // Create a base object with predefined sectors
        const sectorsObject: SectorData = {};
        PREDEFINED_SECTORS.forEach(sector => {
          sectorsObject[sector] = [];
        });
        
        // Try to fetch additional data from sector_company.json
        try {
          const response = await fetch('/sector_company.json');
          if (response.ok) {
            const data = await response.json();
            // Merge with predefined sectors
            setSectorData({...sectorsObject, ...data});
            return;
          }
        } catch (error) {
          console.error('Error fetching sector data:', error);
        }
        
        // If fetch fails, still use the predefined sectors
        setSectorData(sectorsObject);
      } catch (error) {
        console.error('Error setting up sector data:', error);
      }
    };
    fetchSectorData();
    fetchData();
  }, []);

  // Toggle sort direction when clicking the same sort key
  const handleSort = (key: 'score' | 'slope' | 'expected_return' | 'trend_strength' ) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('desc'); // Default to descending when changing sort key
    }
  };

  // Handle filter changes
  const handleFilterChange = (filterName: keyof typeof filters) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: !prev[filterName]
    }));
  };

  // Handle sector selection
  const handleSectorChange = (sector: string) => {
    setSelectedSectors(prev => 
      prev.includes(sector) 
        ? prev.filter(s => s !== sector) 
        : [...prev, sector]
    );
  };

  // Get ticker to sector mapping
  const getTickerSectorMap = () => {
    if (!sectorData) return {};
    
    const tickerMap: {[ticker: string]: string} = {};
    
    Object.entries(sectorData).forEach(([sector, companies]) => {
      companies.forEach(company => {
        tickerMap[company.ticker] = sector;
      });
    });
    
    return tickerMap;
  };

  const tickerSectorMap = getTickerSectorMap();

  const filteredAndSortedStocks = stocks ? Object.entries(stocks)
    .filter(([symbol, data]) => {
      // Apply search filter
      if (!symbol.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Apply metric filters
      if (filters.positiveScore && (data.score <= 0)) return false;
      if (filters.positiveGrowth && (data.slope <= 0)) return false;
      if (filters.positiveReturn && (data.expected_return <= 0)) return false;
      if (filters.positiveStrength && (data.trend_strength <= 0)) return false;
      
      // With this:
      if (selectedSectors.length > 0) {
        const stockSector = data.sector || tickerSectorMap[symbol];
        if (!stockSector || !selectedSectors.includes(stockSector)) {
          return false;
        }
      }
      
      return true;
    })
    .sort(([, a], [, b]) => {
      // Get the values safely
      const aValue = a[sortKey] || 0;
      const bValue = b[sortKey] || 0;
      
      // Apply sort direction
      return sortDirection === 'desc' ? bValue - aValue : aValue - bValue;
    }) : [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] gap-4">
          <LoadingSpinner />
          <span className="text-lg text-gray-700">Loading forecast data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] gap-4">
          <h2 className="text-xl font-bold text-gray-800">Error Loading Data</h2>
          <p className="text-gray-600">{error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!stocks || Object.keys(stocks).length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] gap-4">
          <h2 className="text-xl font-bold text-gray-800">No Stock Data Available</h2>
          <p className="text-gray-600">There are currently no forecast trends to display</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Refresh Data
          </Button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100" style={{ fontFamily: 'Rubik, sans-serif'}}>
      <Navbar />

      {/* Breadcrumb navigation */}
      <nav className="px-4 md:px-6 lg:px-8 mt-4 flex items-center gap-4 text-sm">
        <Link href="/home" className="text-black text-2xl hover:text-blue-600 transition-colors" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>Home</Link>
        <span className="text-black text-2xl" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>&gt;</span>
        <Link href="/forecast-trends" className="text-black text-2xl hover:text-blue-600 transition-colors" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>Stock Recommendations</Link>
      </nav>

      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 max-w-full">
        <div className="w-full mt-4">
          {/* Header Section */}
          <div className="flex items-center justify-between mb-24 bg-white rounded-2xl p-8 relative overflow-hidden border shadow-lg" style={{ minHeight: '100px' }}>
            <div>
              <h1 className="text-4xl font-bold mb-3" style={{ fontFamily: 'JetBrains Mono, monospace', color: '#4C555A' }}>
                Stock Recommendations
              </h1>
              <p className="text-gray-600 text-lg" style={{ fontFamily: 'Rubik, sans-serif' }}>
                Scored recommendations of stocks based on growth and expected returns
              </p>
            </div>
            <div className="absolute left-196 w-full h-full">
              <img 
                src="/images/stock_recommendations1.svg" 
                alt="Portfolio illustration" 
                className="scale-148"
              />
            </div>
          </div>

          {/* Search and Filter Section */}
          <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-8 shadow-lg" style={{ fontFamily: 'Rubik, sans-serif' }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold mb-2 text-gray-900">Search & Filter</h2>
                <p className="text-gray-600">Find the perfect stocks for your portfolio</p>
              </div>
              <Button 
                onClick={() => setShowFilters(!showFilters)}
                className="bg-gradient-to-r from-[#FCF80A] to-[#e3df09] hover:from-[#e3df09] hover:to-[#FCF80A] text-gray-900 px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
              >
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>
            </div>

            {/* Search Bar */}
            <div className="mb-8">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search stocks by symbol..."
                  className="w-full p-4 pl-14 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#FCF80A]/20 focus:border-[#FCF80A] bg-gray-50 text-gray-800 placeholder-gray-500 text-lg transition-all duration-300"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <svg 
                  className="absolute left-5 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Filters Section */}
            {showFilters && (
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-8 mb-8 border border-gray-100 shadow-inner">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Filter Options</h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Metrics Filters */}
                  <div className="space-y-6">
                    <h4 className="font-semibold text-gray-800 pb-3 border-b-2 border-gray-200 text-lg">Performance Metrics</h4>
                    <div className="space-y-4">
                      <label className="flex items-center space-x-4 cursor-pointer group p-3 rounded-xl hover:bg-white transition-all duration-200">
                        <input
                          type="checkbox"
                          checked={filters.positiveScore}
                          onChange={() => handleFilterChange('positiveScore')}
                          className="w-5 h-5 text-[#FCF80A] bg-gray-100 border-gray-300 rounded focus:ring-[#FCF80A] focus:ring-2"
                        />
                        <span className="text-gray-700 group-hover:text-gray-900 transition-colors font-medium">Positive Score Only</span>
                      </label>
                      <label className="flex items-center space-x-4 cursor-pointer group p-3 rounded-xl hover:bg-white transition-all duration-200">
                        <input
                          type="checkbox"
                          checked={filters.positiveGrowth}
                          onChange={() => handleFilterChange('positiveGrowth')}
                          className="w-5 h-5 text-[#FCF80A] bg-gray-100 border-gray-300 rounded focus:ring-[#FCF80A] focus:ring-2"
                        />
                        <span className="text-gray-700 group-hover:text-gray-900 transition-colors font-medium">Positive Growth Only</span>
                      </label>
                      <label className="flex items-center space-x-4 cursor-pointer group p-3 rounded-xl hover:bg-white transition-all duration-200">
                        <input
                          type="checkbox"
                          checked={filters.positiveReturn}
                          onChange={() => handleFilterChange('positiveReturn')}
                          className="w-5 h-5 text-[#FCF80A] bg-gray-100 border-gray-300 rounded focus:ring-[#FCF80A] focus:ring-2"
                        />
                        <span className="text-gray-700 group-hover:text-gray-900 transition-colors font-medium">Positive Expected Return Only</span>
                      </label>
                      <label className="flex items-center space-x-4 cursor-pointer group p-3 rounded-xl hover:bg-white transition-all duration-200">
                        <input
                          type="checkbox"
                          checked={filters.positiveStrength}
                          onChange={() => handleFilterChange('positiveStrength')}
                          className="w-5 h-5 text-[#FCF80A] bg-gray-100 border-gray-300 rounded focus:ring-[#FCF80A] focus:ring-2"
                        />
                        <span className="text-gray-700 group-hover:text-gray-900 transition-colors font-medium">Positive Trend Strength Only</span>
                      </label>
                    </div>
                  </div>
                  
                  {/* Sectors Filter */}
                  {sectorData && (
                    <div className="space-y-6">
                      <h4 className="font-semibold text-gray-800 pb-3 border-b-2 border-gray-200 text-lg">Industry Sectors</h4>
                      <div className="max-h-64 overflow-y-auto space-y-3 pr-2">
                        {Object.keys(sectorData).map(sector => (
                          <label key={sector} className="flex items-center space-x-4 cursor-pointer group p-3 rounded-xl hover:bg-white transition-all duration-200">
                            <input
                              type="checkbox"
                              checked={selectedSectors.includes(sector)}
                              onChange={() => handleSectorChange(sector)}
                              className="w-5 h-5 text-[#FCF80A] bg-gray-100 border-gray-300 rounded focus:ring-[#FCF80A] focus:ring-2"
                            />
                            <span className="text-gray-700 group-hover:text-gray-900 transition-colors font-medium">{sector}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sort Options */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900">Sort By</h3>
              <div className="flex flex-wrap gap-4">
                <Button 
                  onClick={() => handleSort('score')}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 ${
                    sortKey === 'score' 
                      ? 'bg-gradient-to-r from-[#FCF80A] to-[#e3df09] text-gray-900' 
                      : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
                  }`}
                >
                  Overall Score {sortKey === 'score' && (sortDirection === 'desc' ? '↓' : '↑')}
                </Button>
                <Button 
                  onClick={() => handleSort('slope')}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 ${
                    sortKey === 'slope' 
                      ? 'bg-gradient-to-r from-[#FCF80A] to-[#e3df09] text-gray-900' 
                      : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
                  }`}
                >
                  Growth Rate {sortKey === 'slope' && (sortDirection === 'desc' ? '↓' : '↑')}
                </Button>
                <Button 
                  onClick={() => handleSort('expected_return')}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 ${
                    sortKey === 'expected_return' 
                      ? 'bg-gradient-to-r from-[#FCF80A] to-[#e3df09] text-gray-900' 
                      : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
                  }`}
                >
                  Expected Return {sortKey === 'expected_return' && (sortDirection === 'desc' ? '↓' : '↑')}
                </Button>
                <Button 
                  onClick={() => handleSort('trend_strength')}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 ${
                    sortKey === 'trend_strength' 
                      ? 'bg-gradient-to-r from-[#FCF80A] to-[#e3df09] text-gray-900' 
                      : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
                  }`}
                >
                  Trend Strength {sortKey === 'trend_strength' && (sortDirection === 'desc' ? '↓' : '↑')}
                </Button>
              </div>
            </div>
          </div>

          {/* Stock Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-5 gap-4 mb-8">
            {filteredAndSortedStocks.map(([symbol, data]) => {
              // Skip rendering if data is undefined or missing required properties
              if (!data) {
                return null;
              }
              
              // Safe access to properties with null checks
              const score = typeof data.score === 'number' ? data.score.toFixed(2) : 'N/A';
              const slope = typeof data.slope === 'number' ? data.slope.toFixed(2) : 'N/A';
              const expectedReturn = typeof data.expected_return === 'number' ? data.expected_return.toFixed(2) : 'N/A';
              const trendStrength = typeof data.trend_strength === 'number' ? data.trend_strength.toFixed(2) : 'N/A';
              const sector = data.sector || tickerSectorMap[symbol] || 'Unknown';
              
              // Determine card color based on overall performance
              const getCardGradient = () => {
                const numScore = parseFloat(score);
                const numSlope = parseFloat(slope);
                const numReturn = parseFloat(expectedReturn);
                
                if (numScore > 0 && numSlope > 0 && numReturn > 0) {
                  return 'from-green-50 to-green-100 border-green-200';
                } else if (numScore < 0 && numSlope < 0 && numReturn < 0) {
                  return 'from-red-50 to-red-100 border-red-200';
                } else {
                  return 'from-gray-50 to-gray-100 border-gray-200';
                }
              };
              
              return (
                <div 
                  key={symbol} 
                  className={`bg-gradient-to-br ${getCardGradient()} rounded-xl border shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 p-4 cursor-pointer`}
                  onClick={() => {
                    setSelectedStock({symbol, data});
                    setIsModalOpen(true);
                  }}
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                        {symbol}
                      </h3>
                      <Badge 
                        variant="outline" 
                        className="bg-white/80 border-gray-300 text-gray-700 text-xs font-medium px-2 py-0.5 rounded-full"
                      >
                        {sector}
                      </Badge>
                    </div>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold ${
                      parseFloat(score) > 0 ? 'bg-green-500 text-white' : 
                      parseFloat(score) < 0 ? 'bg-red-500 text-white' : 'bg-gray-500 text-white'
                    }`}>
                      {parseFloat(score) > 0 ? '↗' : parseFloat(score) < 0 ? '↘' : '→'}
                    </div>
                  </div>
                  
                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-white/60 rounded-lg p-2 backdrop-blur-sm">
                      <div className="text-xs font-medium text-gray-600 mb-1">Overall Score</div>
                      <div className={`text-lg font-bold ${
                        parseFloat(score) > 0 ? 'text-green-600' : 
                        parseFloat(score) < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {score}
                      </div>
                    </div>
                    
                    <div className="bg-white/60 rounded-lg p-2 backdrop-blur-sm">
                      <div className="text-xs font-medium text-gray-600 mb-1">Growth Rate</div>
                      <div className={`text-lg font-bold ${
                        parseFloat(slope) > 0 ? 'text-green-600' : 
                        parseFloat(slope) < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {slope}%
                      </div>
                    </div>
                    
                    <div className="bg-white/60 rounded-lg p-2 backdrop-blur-sm">
                      <div className="text-xs font-medium text-gray-600 mb-1">Expected Return</div>
                      <div className={`text-lg font-bold ${
                        parseFloat(expectedReturn) > 0 ? 'text-green-600' : 
                        parseFloat(expectedReturn) < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {expectedReturn}%
                      </div>
                    </div>
                    
                    <div className="bg-white/60 rounded-lg p-2 backdrop-blur-sm">
                      <div className="text-xs font-medium text-gray-600 mb-1">Trend Strength</div>
                      <div className={`text-lg font-bold ${
                        parseFloat(trendStrength) > 0 ? 'text-green-600' : 
                        parseFloat(trendStrength) < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {trendStrength}
                      </div>
                    </div>
                  </div>
                  
                  {/* Performance Indicator */}
                  <div className="bg-white/60 rounded-lg p-2 backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-600">Performance</span>
                      <div className="flex space-x-1">
                        <div className={`w-2 h-2 rounded-full ${parseFloat(score) > 0 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <div className={`w-2 h-2 rounded-full ${parseFloat(slope) > 0 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <div className={`w-2 h-2 rounded-full ${parseFloat(expectedReturn) > 0 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <div className={`w-2 h-2 rounded-full ${parseFloat(trendStrength) > 0 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Empty State */}
          {filteredAndSortedStocks.length === 0 && (
            <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-300 shadow-inner">
              <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.485 0-4.735.921-6.457 2.438l2.887 2.887a4.97 4.97 0 016.624-.495L15 21.75l2.904-2.904c.777-.777.777-2.037 0-2.814L15 13.136l-2.904-2.904a2.037 2.037 0 00-2.814 0z"/>
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">No Matching Stocks Found</h3>
              <p className="text-lg text-gray-500 mb-6">Try adjusting your search criteria or filters to see more results</p>
              <Button 
                onClick={() => {
                  setSearchTerm('');
                  setFilters({
                    positiveScore: false,
                    positiveGrowth: false,
                    positiveReturn: false,
                    positiveStrength: false,
                  });
                  setSelectedSectors([]);
                }}
                className="bg-gradient-to-r from-[#FCF80A] to-[#e3df09] hover:from-[#e3df09] hover:to-[#FCF80A] text-gray-900 px-8 py-3 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
              >
                Clear All Filters
              </Button>
            </div>
          )}

        </div>
        
        {/* Add the Stock Detail Modal */}
        <StockDetailModal 
          stock={selectedStock?.data} 
          symbol={selectedStock?.symbol || ''} 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onViewHistoricalData={() => {
            setIsModalOpen(false);
            setIsHistoricalModalOpen(true);
          }}
        />
        
        {/* Add the Historical Data Modal */}
        <HistoricalDataModal
          symbol={selectedStock?.symbol || ''}
          isOpen={isHistoricalModalOpen}
          onClose={() => setIsHistoricalModalOpen(false)}
        />
      </div>
    </main>
  );
}