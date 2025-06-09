'use client'
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/src/components/ui/Button';
import LoadingSpinner from '@/src/components/ui/LoadingSpinner';
import { Badge } from '@/src/components/ui/badge';
import Navbar from '../../components/navigation/Navbar';
import Link from 'next/link';

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
    <main className="min-h-screen bg-white" style={{ fontFamily: 'Rubik, sans-serif'}}>
      <Navbar />

      {/* Breadcrumb navigation */}
      <nav className="px-6 mt-4 flex items-center gap-4 text-sm">
        <Link href="/home" className="text-black text-2xl" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>Home</Link>
        <span className="text-black text-2xl" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>&gt;</span>
        <Link href="/forecast-trends" className="text-black text-2xl" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>Stock Recommendations</Link>
      </nav>

      <div className="container mx-auto px-4 md:px-40 py-8">
      <div className="w-full px-4 mt-4">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-24 bg-white rounded-lg p-8 relative overflow-hidden border shadow-sm" style={{ minHeight: '100px' }}>
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'JetBrains Mono, monospace', color: '#4C555A' }}>
            Stock Recommnendations
          </h1>
          <p className="text-black" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '17px' }}>
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

        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8" style={{ fontFamily: 'Rubik, sans-serif' }}>
  {/* Header */}
  <div className="flex items-center justify-between mb-6 ">
    <div>
      <h2 className="text-xl font-bold mb-4">Stock Search & Filters</h2>
      <p className="text-gray-600">Search and filter stocks based on your preferences</p>
    </div>
    <Button 
      onClick={() => setShowFilters(!showFilters)}
      className="bg-[#FCF80A] hover:bg-[#e3df09] text-gray-900 px-4 py-2 rounded transition-colors"
    >
      {showFilters ? 'Hide Filters' : 'Show Filters'}
    </Button>
  </div>

  {/* Search Bar */}
  <div className="mb-6">
    <div className="relative">
      <input
        type="text"
        placeholder="Search stocks..."
        className="w-full p-3 pl-12 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FCF80A] focus:border-transparent bg-gray-50 text-gray-800 placeholder-gray-500"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <svg 
        className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" 
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
    <div className="bg-gray-50 rounded-xl p-6 mb-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter Options</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Metrics Filters */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-800 pb-2 border-b border-gray-200">Metrics</h4>
          <div className="space-y-3">
            <label className="flex items-center space-x-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.positiveScore}
                onChange={() => handleFilterChange('positiveScore')}
                className="w-4 h-4 text-[#FCF80A] bg-gray-100 border-gray-300 rounded focus:ring-[#FCF80A] focus:ring-2"
              />
              <span className="text-gray-700 group-hover:text-gray-900 transition-colors">Positive Score Only</span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.positiveGrowth}
                onChange={() => handleFilterChange('positiveGrowth')}
                className="w-4 h-4 text-[#FCF80A] bg-gray-100 border-gray-300 rounded focus:ring-[#FCF80A] focus:ring-2"
              />
              <span className="text-gray-700 group-hover:text-gray-900 transition-colors">Positive Growth Only</span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.positiveReturn}
                onChange={() => handleFilterChange('positiveReturn')}
                className="w-4 h-4 text-[#FCF80A] bg-gray-100 border-gray-300 rounded focus:ring-[#FCF80A] focus:ring-2"
              />
              <span className="text-gray-700 group-hover:text-gray-900 transition-colors">Positive Expected Return Only</span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.positiveStrength}
                onChange={() => handleFilterChange('positiveStrength')}
                className="w-4 h-4 text-[#FCF80A] bg-gray-100 border-gray-300 rounded focus:ring-[#FCF80A] focus:ring-2"
              />
              <span className="text-gray-700 group-hover:text-gray-900 transition-colors">Positive Trend Strength Only</span>
            </label>
          </div>
        </div>
        
        {/* Sectors Filter */}
        {sectorData && (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-800 pb-2 border-b border-gray-200">Sectors</h4>
            <div className="max-h-48 overflow-y-auto space-y-3 pr-2">
              {Object.keys(sectorData).map(sector => (
                <label key={sector} className="flex items-center space-x-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selectedSectors.includes(sector)}
                    onChange={() => handleSectorChange(sector)}
                    className="w-4 h-4 text-[#FCF80A] bg-gray-100 border-gray-300 rounded focus:ring-[#FCF80A] focus:ring-2"
                  />
                  <span className="text-gray-700 group-hover:text-gray-900 transition-colors">{sector}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )}

  {/* Sort Options */}
  <div className="space-y-4">
    <h3 className="text-lg font-semibold text-gray-900">Sort Options</h3>
    <div className="flex flex-wrap gap-3">
      <Button 
        onClick={() => handleSort('score')}
        className={`px-4 py-2 rounded font-medium transition-all duration-200 ${
          sortKey === 'score' 
            ? 'bg-[#FCF80A] text-gray-900 shadow-md hover:bg-[#e3df09]' 
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
        }`}
      >
        Score {sortKey === 'score' && (sortDirection === 'desc' ? '↓' : '↑')}
      </Button>
      <Button 
        onClick={() => handleSort('slope')}
        className={`px-4 py-2 rounded font-medium transition-all duration-200 ${
          sortKey === 'slope' 
            ? 'bg-[#FCF80A] text-gray-900 shadow-md hover:bg-[#e3df09]' 
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
        }`}
      >
        Growth {sortKey === 'slope' && (sortDirection === 'desc' ? '↓' : '↑')}
      </Button>
      <Button 
        onClick={() => handleSort('expected_return')}
        className={`px-4 py-2 rounded font-medium transition-all duration-200 ${
          sortKey === 'expected_return' 
            ? 'bg-[#FCF80A] text-gray-900 shadow-md hover:bg-[#e3df09]' 
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
        }`}
      >
        Expected Return {sortKey === 'expected_return' && (sortDirection === 'desc' ? '↓' : '↑')}
      </Button>
      <Button 
        onClick={() => handleSort('trend_strength')}
        className={`px-4 py-2 rounded font-medium transition-all duration-200 ${
          sortKey === 'trend_strength' 
            ? 'bg-[#FCF80A] text-gray-900 shadow-md hover:bg-[#e3df09]' 
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
        }`}
      >
        Trend Strength {sortKey === 'trend_strength' && (sortDirection === 'desc' ? '↓' : '↑')}
      </Button>
    </div>
  </div>
</div>
        <div className="overflow-x-auto rounded-lg border border-gray-300 ">
  <table className="w-full border-collapse bg-white text-sm">
    <thead>
      <tr className="bg-[#5FB865]">
        <th className="p-3 text-left font-medium text-white border-b border-r border-gray-300">Symbol</th>
        <th className="p-3 text-left font-medium text-white border-b border-r border-gray-300">Sector</th>
        <th className="p-3 text-left font-medium text-white border-b border-r border-gray-300">Score</th>
        <th className="p-3 text-left font-medium text-white border-b border-r border-gray-300">Growth</th>
        <th className="p-3 text-left font-medium text-white border-b border-r border-gray-300">Expected Return</th>
        <th className="p-3 text-left font-medium text-white border-b border-gray-300">Trend Strength</th>
      </tr>
    </thead>
    <tbody>
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
        
        return (
          <tr key={symbol} className="hover:bg-gray-50 transition-colors border-b border-gray-200">
            <td className="p-3 font-medium text-gray-900 border-r border-gray-200">{symbol}</td>
            <td className="p-3 text-gray-700 border-r border-gray-200">
              <Badge variant="outline" className="font-normal">
                {sector}
              </Badge>
            </td>
            <td className="p-3 border-r border-gray-200" style={{ color: parseFloat(score) > 0 ? 'green' : parseFloat(score) < 0 ? 'red' : 'inherit' }}>
              <span className="font-medium">{score}</span>
            </td>
            <td className="p-3 border-r border-gray-200" style={{ color: parseFloat(slope) > 0 ? 'green' : parseFloat(slope) < 0 ? 'red' : 'inherit' }}>
              {slope}%
            </td>
            <td className="p-3 border-r border-gray-200" style={{ color: parseFloat(expectedReturn) > 0 ? 'green' : parseFloat(expectedReturn) < 0 ? 'red' : 'inherit' }}>
              {expectedReturn}%
            </td>
            <td className="p-3" style={{ color: parseFloat(trendStrength) > 0 ? 'green' : parseFloat(trendStrength) < 0 ? 'red' : 'inherit' }}>
              {trendStrength}
            </td>
          </tr>
        );
      })}
    </tbody>
  </table>
</div>

<div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
    <h3 className="text-sm font-medium text-gray-500 mb-1">Total Stocks</h3>
    <p className="text-2xl font-bold text-gray-900">{filteredAndSortedStocks.length}</p>
  </div>
  
  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
    <h3 className="text-sm font-medium text-gray-500 mb-1">Positive Score</h3>
    <p className="text-2xl font-bold text-green-600">
      {filteredAndSortedStocks.filter(([_, data]) => data.score > 0).length}
    </p>
  </div>
  
  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
    <h3 className="text-sm font-medium text-gray-500 mb-1">Positive Growth</h3>
    <p className="text-2xl font-bold text-green-600">
      {filteredAndSortedStocks.filter(([_, data]) => data.slope > 0).length}
    </p>
  </div>
  
  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
    <h3 className="text-sm font-medium text-gray-500 mb-1">Positive Return</h3>
    <p className="text-2xl font-bold text-green-600">
      {filteredAndSortedStocks.filter(([_, data]) => data.expected_return > 0).length}
    </p>
  </div>
</div>

{filteredAndSortedStocks.length === 0 && (
  <div className="text-center py-8 border border-gray-200 mt-6 rounded-lg bg-gray-50">
    <h3 className="text-lg font-medium text-gray-800 mb-2">No matching stocks found</h3>
    <p className="text-gray-500">Try adjusting your search criteria or filters</p>
  </div>
)}

<div className="mt-4 text-sm text-gray-500">
  Showing {filteredAndSortedStocks.length} stocks
</div>
      </div>
    </div>
    </main>
  );
}