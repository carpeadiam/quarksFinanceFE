"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Holding, HoldingWithSymbol } from "./portfolio";

interface PortfolioHoldingsProps {
  portfolioId: string;
  token?: string;
  holdings?: Record<string, Holding>;
  onDataUpdate?: () => void;
}

export default function PortfolioHoldings({ 
  portfolioId, 
  token: propToken, 
  holdings: propHoldings,
  onDataUpdate 
}: PortfolioHoldingsProps) {
  const [token, setToken] = useState<string>(propToken || "");
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(!!propToken);
  const [isLoading, setIsLoading] = useState<boolean>(!propHoldings);
  const [holdings, setHoldings] = useState<Record<string, Holding>>(propHoldings || {});
  const [cash, setCash] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());
  const router = useRouter();
  const baseURL = 'https://thecodeworks.in/quarksfinance/api';
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Helper function to check if a price is valid
  const isValidPrice = (price: any): boolean => {
    return price !== null && price !== undefined && Number(price) > 0;
  };

  // Process holdings with proper price preservation
  const processHoldings = (newHoldings: Record<string, any>, existingHoldings: Record<string, Holding> = {}): Record<string, Holding> => {
    const processedHoldings: Record<string, Holding> = {};
    
    Object.entries(newHoldings).forEach(([symbol, holdingData]: [string, any]) => {
      const existingHolding = existingHoldings[symbol];
      const newCurrentPrice = holdingData.current_price;
      
      processedHoldings[symbol] = {
        quantity: Number(holdingData.quantity || 0),
        avg_price: Number(holdingData.avg_price || holdingData.average_cost || 0),
        // Preserve last valid current_price if new price is invalid
        current_price: isValidPrice(newCurrentPrice) ? 
          Number(newCurrentPrice) : 
          (existingHolding?.current_price || null)
      };
    });
    
    return processedHoldings;
  };

  // Update useEffect to handle prop data correctly
  useEffect(() => {
    // If holdings were passed as props, use them directly
    if (propHoldings) {
      const processedHoldings = processHoldings(propHoldings, holdings);
      setHoldings(processedHoldings);
      setIsLoading(false);
      return;
    }
    
    // Otherwise, if token was passed or available in local storage, fetch holdings
    const storedToken = propToken || localStorage.getItem('quarksFinanceToken');
    
    if (storedToken) {
      setToken(storedToken);
      setIsLoggedIn(true);
      fetchPortfolioData(storedToken);
    } else {
      // Redirect to login page if not logged in
      router.push('/login');
    }
  }, [router, portfolioId, propToken, propHoldings]);

  // Update useEffect for prop holdings changes
  useEffect(() => {
    if (propHoldings) {
      const processedHoldings = processHoldings(propHoldings, holdings);
      setHoldings(processedHoldings);
    }
  }, [propHoldings]);

  // Auto-refresh useEffect similar to watchlist pattern
  useEffect(() => {
    // Only set up the interval if we have a valid portfolioId and token and no propHoldings
    if (portfolioId && token && !propHoldings) {
      // Initial fetch
      fetchPortfolioData(token);
      
      // Set up interval to fetch every 5 seconds
      const intervalId = setInterval(() => {
        if (mountedRef.current) {
          fetchPortfolioData(token);
        }
      }, 5000);
      
      // Clean up the interval when component unmounts
      return () => clearInterval(intervalId);
    }
  }, [portfolioId, token, propHoldings]);

  const fetchPortfolioData = async (authToken: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`${baseURL}/portfolios/${portfolioId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          'x-access-token': authToken,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch portfolio data");
      }

      const data = await response.json();
      
      // Access the holdings correctly from the JSON structure
      const portfolioHoldings = data.details?.holdings || {};
      
      // Process holdings with price preservation
      const processedHoldings = processHoldings(portfolioHoldings, holdings);
      
      setHoldings(processedHoldings);
      setCash(Number(data.details?.cash || 0));
      setLastUpdateTime(new Date());
      
      if (onDataUpdate) {
        onDataUpdate();
      }
    } catch (error: any) {
      console.error("Error fetching portfolio data:", error);
      setErrorMessage(error.message || "Failed to load portfolio data");
    } finally {
      setIsLoading(false);
    }
  };

  // Function to fetch historical price for a specific date
  const fetchHistoricalPrice = async (symbol: string, date: string): Promise<number | null> => {
    try {
      const response = await fetch(`${baseURL}/market/historical/${symbol}/${date}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          'x-access-token': token,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch historical price for ${symbol} on ${date}`);
      }

      const data = await response.json();
      return data.price || data.close_price || data.historical_price || null;
    } catch (error) {
      console.error(`Error fetching historical price for ${symbol}:`, error);
      return null;
    }
  };

  const refreshData = () => {
    if (token) {
      fetchPortfolioData(token);
    }
  };

  // Create holdingsArray with symbol as a property
  const holdingsArray: HoldingWithSymbol[] = Object.entries(holdings || {}).map(([symbol, data]) => {
    return {
      symbol,
      quantity: Number(data.quantity),
      avg_price: Number(data.avg_price),
      current_price: data.current_price ?? null // Ensure it's number | null, not undefined
    };
  });

  // Updated total calculation - only use valid current_price, but don't exclude holdings entirely
  const totalHoldingsValue = holdingsArray.reduce((sum, holding) => {
    // Use current_price if valid, otherwise use avg_price for value calculation
    const priceToUse: number = isValidPrice(holding.current_price) ? holding.current_price! : holding.avg_price;
    return sum + (holding.quantity * priceToUse);
  }, 0);
  
  const totalPortfolioValue = cash + totalHoldingsValue;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(value);
  };

  const calculateReturn = (currentPrice: number | null, avgPrice: number): number | null => {
    if (!avgPrice || avgPrice === 0 || !isValidPrice(currentPrice)) return null;
    return ((currentPrice! - avgPrice) / avgPrice) * 100;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-IN', { 
      hour12: true, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  if (!isLoggedIn && !propHoldings) {
    return null; // Will redirect in useEffect
  }

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p style={{ fontFamily: 'Rubik, sans-serif' }}>Loading portfolio data...</p>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4" style={{ fontFamily: 'Rubik, sans-serif' }}>{errorMessage}</p>
        <button 
          onClick={refreshData}
          className="bg-[#41748D] text-white px-6 py-2 rounded-lg hover:bg-[#365f73]"
          style={{ fontFamily: 'Rubik, sans-serif' }}
        >
          Try Again
        </button>
      </div>
    );
  }

  if (holdingsArray.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-2" style={{ fontFamily: 'Rubik, sans-serif' }}>No holdings in this portfolio yet.</p>
        <p className="text-sm text-gray-500" style={{ fontFamily: 'Rubik, sans-serif' }}>Use the trade form to start buying stocks.</p>
      </div>
    );
  }

return (
  <>
    {/* Portfolio heading */}
    <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'Rubik, sans-serif' }}>
      Portfolio Holdings
    </h2>

    {/* Portfolio table with integrated header */}
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <table className="w-full border-collapse">
        <thead>
          {/* Time and refresh row */}
          <tr className="bg-[#41748D] text-white">
            <td colSpan={6} className="p-3 text-left">
              <div className="flex justify-between items-center">
                <span className="text-sm" style={{ fontFamily: 'Rubik, sans-serif' }}>
                  Last updated: {formatTime(lastUpdateTime)}
                </span>
                <button 
                  onClick={refreshData}
                  className="text-white hover:text-gray-200 text-lg"
                  aria-label="Refresh portfolio"
                >
                  ⟳
                </button>
              </div>
            </td>
          </tr>
          {/* Column headers */}
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="text-center p-3 border-r border-gray-200 font-medium text-gray-700" style={{ fontFamily: 'Rubik, sans-serif' }}>Symbol</th>
            <th className="text-center p-3 border-r border-gray-200 font-medium text-gray-700" style={{ fontFamily: 'Rubik, sans-serif' }}>Quantity</th>
            <th className="text-center p-3 border-r border-gray-200 font-medium text-gray-700" style={{ fontFamily: 'Rubik, sans-serif' }}>Avg. Cost</th>
            <th className="text-center p-3 border-r border-gray-200 font-medium text-gray-700" style={{ fontFamily: 'Rubik, sans-serif' }}>Current Price</th>
            <th className="text-center p-3 border-r border-gray-200 font-medium text-gray-700" style={{ fontFamily: 'Rubik, sans-serif' }}>Market Value</th>
            <th className="text-center p-3 font-medium text-gray-700" style={{ fontFamily: 'Rubik, sans-serif' }}>Return</th>
          </tr>
        </thead>
        <tbody>
          {holdingsArray.map((holding) => {
            // Use current_price if valid, otherwise use avg_price for display and calculations
            const displayPrice: number = isValidPrice(holding.current_price) ? holding.current_price! : holding.avg_price;
            const marketValue = holding.quantity * displayPrice;
            const returnPct = calculateReturn(holding.current_price, holding.avg_price);
            const hasValidCurrentPrice = isValidPrice(holding.current_price);
            
            return (
              <tr key={holding.symbol} className="border-b border-gray-200 bg-white hover:bg-gray-50">
                <td className="p-3 border-r border-gray-200 text-center text-gray-800" style={{ fontFamily: 'Rubik, sans-serif' }}>
                  {holding.symbol}
                </td>
                <td className="p-3 border-r border-gray-200 text-center text-gray-700" style={{ fontFamily: 'Rubik, sans-serif' }}>
                  {holding.quantity}
                </td>
                <td className="p-3 border-r border-gray-200 text-center text-gray-700" style={{ fontFamily: 'Rubik, sans-serif' }}>
                  {formatCurrency(holding.avg_price)}
                </td>
                <td className="p-3 border-r border-gray-200 text-center text-gray-700" style={{ fontFamily: 'Rubik, sans-serif' }}>
                  <span className="flex items-center justify-center gap-2">
                    {formatCurrency(displayPrice)}
                    {hasValidCurrentPrice && (
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                    )}
                    {!hasValidCurrentPrice && (
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                    )}
                  </span>
                </td>
                <td className="p-3 border-r border-gray-200 text-center text-gray-700" style={{ fontFamily: 'Rubik, sans-serif' }}>
                  {formatCurrency(marketValue)}
                </td>
                <td className={`p-3 text-center ${
                  returnPct === null ? 'text-gray-500' : returnPct >= 0 ? 'text-green-600' : 'text-red-600'
                }`} style={{ fontFamily: 'Rubik, sans-serif' }}>
                  {returnPct === null ? "0.00%" : `${returnPct >= 0 ? "+" : ""}${returnPct.toFixed(2)}%`}
                </td>
              </tr>
            );
          })}
          
          {/* Cash row */}
          <tr className="border-b border-gray-200 bg-gray-50">
            <td className="p-3 border-r border-gray-200 text-center font-medium text-gray-800" style={{ fontFamily: 'Rubik, sans-serif' }}>Cash</td>
            <td className="p-3 border-r border-gray-200 text-center text-gray-500" style={{ fontFamily: 'Rubik, sans-serif' }}>-</td>
            <td className="p-3 border-r border-gray-200 text-center text-gray-500" style={{ fontFamily: 'Rubik, sans-serif' }}>-</td>
            <td className="p-3 border-r border-gray-200 text-center text-gray-500" style={{ fontFamily: 'Rubik, sans-serif' }}>-</td>
            <td className="p-3 border-r border-gray-200 text-center text-gray-700" style={{ fontFamily: 'Rubik, sans-serif' }}>{formatCurrency(cash)}</td>
            <td className="p-3 text-center text-gray-500" style={{ fontFamily: 'Rubik, sans-serif' }}>-</td>
          </tr>
          
          {/* Total row */}
          <tr className="font-medium bg-gray-100 text-gray-800 border-t-2 border-gray-300">
            <td className="p-3 border-r border-gray-200 text-center" style={{ fontFamily: 'Rubik, sans-serif' }}>Total</td>
            <td className="p-3 border-r border-gray-200 text-center" style={{ fontFamily: 'Rubik, sans-serif' }}>-</td>
            <td className="p-3 border-r border-gray-200 text-center" style={{ fontFamily: 'Rubik, sans-serif' }}>-</td>
            <td className="p-3 border-r border-gray-200 text-center" style={{ fontFamily: 'Rubik, sans-serif' }}>-</td>
            <td className="p-3 border-r border-gray-200 text-center" style={{ fontFamily: 'Rubik, sans-serif' }}>{formatCurrency(totalPortfolioValue)}</td>
            <td className="p-3 text-center" style={{ fontFamily: 'Rubik, sans-serif' }}>-</td>
          </tr>
        </tbody>
      </table>
    </div>
  </>
);
}