'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/navigation/Navbar';
import Link from 'next/link';
import { Card } from '../../components/ui/Card';
import { Badge } from '@/src/components/ui/badge';
import LoadingSpinner from '@/src/components/ui/LoadingSpinner';


export default function SectorAnalysisPage() {
  const [sectorData, setSectorData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activePeriod, setActivePeriod] = useState('3_days');
  const router = useRouter();

  const periods = {
    '3_days': '3 Days',
    '7_days': '7 Days',
    '1_month': '1 Month',
    '6_months': '6 Months'
  };

  useEffect(() => {
    fetchSectorData();
  }, []);

  const fetchSectorData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('https://thecodeworks.in/quarksfinance/api/market/sector-performance');
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      setSectorData(data.data);
    } catch (err: any) {
      if (err.response?.status === 401) {
        router.push('/login');
      } else {
        setError(err.message || 'Failed to fetch sector performance data');
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper function to sort stocks by performance
  const sortStocksByPerformance = (stocks: any[], isOutperformer: boolean) => {
    if (!stocks) return [];
    
    return [...stocks].sort((a, b) => {
      const aValue = isOutperformer ? b.return_pct - a.return_pct : a.return_pct - b.return_pct;
      return aValue;
    }).slice(0, 5); // Get top 5
  };

  // Get all sectors from the active period
  const getSectors = () => {
    if (!sectorData || !sectorData[activePeriod]) return [];
    return Object.keys(sectorData[activePeriod]);
  };

  // Get top 5 performing sectors based on sector_return_pct
  const getTopSectors = () => {
    if (!sectorData || !sectorData[activePeriod]) return [];
    
    const sectors = Object.keys(sectorData[activePeriod]);
    return sectors
      .sort((a, b) => {
        return sectorData[activePeriod][b].sector_return_pct - sectorData[activePeriod][a].sector_return_pct;
      })
      .slice(0, 5);
  };

  return (
    <main className="min-h-screen bg-white" style={{ fontFamily: 'Rubik, sans-serif'}}>
      <Navbar />
      
      {/* Breadcrumb navigation */}
      <nav className="px-6 mt-4 flex items-center gap-4 text-sm">
        <Link href="/home" className="text-black text-2xl" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>Home</Link>
        <span className="text-black text-2xl" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>&gt;</span>
        <Link href="/sector-analysis" className="text-black text-2xl" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>Sector Analysis</Link>
      </nav>

      <div className="container mx-auto px-4 md:px-40 py-8">
      <div className="w-full px-4 mt-4">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-24 bg-white rounded-lg p-8 relative overflow-hidden border shadow-sm" style={{ minHeight: '100px' }}>
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'JetBrains Mono, monospace', color: '#4C555A' }}>
            Sector Analysis
          </h1>
          <p className="text-black" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '17px' }}>
            Identify top performing sectors and stocks across different time periods.
          </p>

        </div>
        <div className="absolute left-196 w-full h-full">
          <img 
            src="/images/sector_analysis1.svg" 
            alt="Portfolio illustration" 
            className="scale-148"
          />
        </div>
      </div>

        {/* Time period selector */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-md border border-gray-200">
            {Object.entries(periods).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActivePeriod(key)}
                className={`px-4 py-2 text-sm font-medium ${activePeriod === key 
                  ? 'bg-[#FCF80A] text-gray-800' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'} 
                  ${key === '3_days' ? 'rounded-l-md' : ''} 
                  ${key === '6_months' ? 'rounded-r-md' : ''}
                  border border-gray-200`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="flex justify-center items-center py-20">
            <LoadingSpinner />
            <span className="ml-3 text-lg">Loading sector data...</span>
          </div>
        )}

        {error && (
          <div className="max-w-3xl mx-auto mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}

        {sectorData && sectorData[activePeriod] && (
          <div className="space-y-10">
            {/* Top Performing Sectors */}
            <section>
              <h2 className="text-xl font-bold mb-4">Top Performing Sectors</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {getTopSectors().map((sector) => {
                  const sectorInfo = sectorData[activePeriod][sector];
                  return (
                    <Card key={sector} className="p-4 border border-gray-200 ">
                      <h3 className="font-semibold text-lg mb-2 truncate">{sector}</h3>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-gray-600 text-sm">Return</span>
                        <span className={`font-medium ${sectorInfo.sector_return_pct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {sectorInfo.sector_return_pct.toFixed(2)}%
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${sectorInfo.sector_return_pct >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                          style={{ width: `${Math.min(Math.abs(sectorInfo.sector_return_pct) * 5, 100)}%` }}
                        ></div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </section>

            {/* Sector Details */}
            {getSectors().map((sector) => {
              const sectorInfo = sectorData[activePeriod][sector];
              const topOutperformers = sortStocksByPerformance(sectorInfo.outperformers, true);
              const topUnderperformers = sortStocksByPerformance(sectorInfo.underperformers, false);
              
              return (
  <section key={sector} id={`sector-${sector.replace(/\s+/g, '-').toLowerCase()}`} className="pt-4">
    <Card className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="p-4 border-b border-gray-100" style={{ backgroundColor: 'white' }}>
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">{sector}</h2>
          <Badge variant="outline" className={`px-2 py-1 ${sectorInfo.sector_return_pct >= 0 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
            {sectorInfo.sector_return_pct.toFixed(2)}%
          </Badge>
        </div>
        <p className="text-gray-600 text-sm mt-1">
          {sectorInfo.analysis_period.start_date} to {sectorInfo.analysis_period.end_date}
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
        {/* Top Performers */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Top Performers</h3>
          <div className="space-y-3">
            {topOutperformers.map((stock, index) => (
              <div key={stock.ticker} className="flex items-center">
                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                  <span className="text-xs font-medium text-gray-700">{index + 1}</span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900">{stock.ticker}</span>
                    <span className="text-green-600 font-medium">+{stock.return_pct.toFixed(2)}%</span>
                  </div>
                  <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500"
                      style={{ width: `${Math.min(stock.return_pct * 5, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Underperformers */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Underperformers</h3>
          <div className="space-y-3">
            {topUnderperformers.map((stock, index) => (
              <div key={stock.ticker} className="flex items-center">
                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                  <span className="text-xs font-medium text-gray-700">{index + 1}</span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900">{stock.ticker}</span>
                    <span className={`${stock.return_pct >= 0 ? 'text-green-600' : 'text-red-600'} font-medium`}>
                      {stock.return_pct >= 0 ? '+' : ''}{stock.return_pct.toFixed(2)}%
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${stock.return_pct >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.min(Math.abs(stock.return_pct) * 5, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  </section>
);
            })}
          </div>
        )}
      </div>
      </div>
    </main>
  );
}