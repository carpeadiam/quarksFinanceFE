"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface Portfolio {
  id: number;
  name: string;
  created_at: string;
  details: {
    cash: number;
    holdings: Record<string, any>;
    transactions?: any[];
  };
}

interface PortfolioHeaderProps {
  portfolio: Portfolio;
  onRefresh: () => void;
}

export default function PortfolioHeader({ portfolio, onRefresh }: PortfolioHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(portfolio.name);
  const [isSaving, setIsSaving] = useState(false);
  const [token, setToken] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [portfolioData, setPortfolioData] = useState<Portfolio>(portfolio);
  const router = useRouter();
  const baseURL = 'https://thecodeworks.in/quarksfinance/api';
  const mountedRef = useRef(true);
  
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

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
  const processHoldings = (newHoldings: Record<string, any>, existingHoldings: Record<string, any> = {}): Record<string, any> => {
    const processedHoldings: Record<string, any> = {};
    
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

  useEffect(() => {
    const storedToken = localStorage.getItem('quarksFinanceToken');
    
    if (storedToken) {
      setToken(storedToken);
      setIsLoggedIn(true);
    } else {
      // Redirect to main page if not logged in
      router.push('/home');
    }
  }, [router]);

  useEffect(() => {
    if (portfolio && portfolio.name) {
      setNewName(portfolio.name);
      setPortfolioData(portfolio);
    }
  }, [portfolio]);

  // Auto-refresh useEffect similar to holdings pattern
  useEffect(() => {
    // Only set up the interval if we have a valid portfolio ID and token
    if (portfolioData.id && token) {
      // Set up interval to fetch every 5 seconds
      const intervalId = setInterval(() => {
        if (mountedRef.current) {
          fetchPortfolioData(token);
        }
      }, 5000);
      
      // Clean up the interval when component unmounts
      return () => clearInterval(intervalId);
    }
  }, [portfolioData.id, token]);

  const fetchPortfolioData = async (authToken: string) => {
    try {
      const response = await fetch(`${baseURL}/portfolios/${portfolioData.id}`, {
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
      
      // Process holdings with price preservation
      const processedHoldings = processHoldings(
        data.details?.holdings || {}, 
        portfolioData.details?.holdings || {}
      );
      
      // Update portfolio data with processed holdings
      const updatedPortfolio = {
        ...data,
        details: {
          ...data.details,
          holdings: processedHoldings
        }
      };
      
      setPortfolioData(updatedPortfolio);
      
      // Call the parent's refresh callback
      onRefresh();
    } catch (error: any) {
      console.error("Error fetching portfolio data:", error);
      // Don't show error messages for background updates to avoid spam
    }
  };

  const showMessage = (message: string, isError: boolean = false): void => {
    if (isError) {
      setErrorMessage(message);
      setSuccessMessage('');
    } else {
      setSuccessMessage(message);
      setErrorMessage('');
    }
    
    // Clear messages after 3 seconds
    setTimeout(() => {
      setErrorMessage('');
      setSuccessMessage('');
    }, 3000);
  };

  const handleUpdateName = async () => {
    if (!newName.trim()) return;
    
    try {
      setIsSaving(true);
      const response = await fetch(`${baseURL}/portfolios/${portfolioData.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          'x-access-token': token,
        },
        body: JSON.stringify({ name: newName }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update portfolio name");
      }

      setIsEditing(false);
      showMessage("Portfolio name updated successfully");
      
      // Update local portfolio data
      setPortfolioData(prev => ({
        ...prev,
        name: newName
      }));
      
      onRefresh();
    } catch (error: any) {
      console.error("Error updating portfolio:", error);
      showMessage(error.message || "Failed to update portfolio name", true);
    } finally {
      setIsSaving(false);
    }
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined || isNaN(value)) {
      return "N/A";
    }
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(value);
  };

  const formatReturn = (returnValue: number | null | undefined) => {
    if (returnValue === null || returnValue === undefined || isNaN(returnValue)) {
      return "N/A";
    }
    return `${returnValue >= 0 ? "+" : ""}${returnValue.toFixed(2)}%`;
  };

  if (!isLoggedIn) {
    return null; // Will redirect in useEffect
  }

  // Calculate total portfolio value and check if we can calculate returns
  const holdingsValue = Object.entries(portfolioData.details.holdings || {}).reduce((sum, [_, holding]: [string, any]) => {
    // Use current_price if valid, otherwise use avg_price for value calculation
    const priceToUse: number = isValidPrice(holding.current_price) ? holding.current_price : holding.avg_price;
    return sum + (holding.quantity * priceToUse);
  }, 0);
  
  // Calculate the total portfolio value
  const totalValue = portfolioData.details.cash + holdingsValue;
  
  // Calculate the initial investment (sum of (avg_price * quantity) for all holdings + cash)
  const initialInvestment = Object.entries(portfolioData.details.holdings || {}).reduce(
    (sum, [_, holding]: [string, any]) => sum + (holding.avg_price * holding.quantity),
    portfolioData.details.cash
  );
  
  // Calculate the portfolio return only if initial investment > 0
  const portfolioReturn = initialInvestment > 0 
    ? ((totalValue - initialInvestment) / initialInvestment) * 100
    : null;

  // Check if we have all valid current prices for display purposes
  const hasAllValidCurrentPrices = Object.values(portfolioData.details.holdings || {}).every(
    (holding: any) => isValidPrice(holding.current_price)
  );

  // Calculate holdings value using only valid current prices for display
  const holdingsValueCurrentPrices = Object.entries(portfolioData.details.holdings || {}).reduce((sum, [_, holding]: [string, any]) => {
    if (isValidPrice(holding.current_price)) {
      return sum + (holding.quantity * holding.current_price);
    }
    return sum;
  }, 0);

  // Calculate realized profit/loss from SELL transactions
  const realizedPL = (portfolioData.details.transactions || []).reduce((total: number, transaction: any) => {
    if (transaction.type === 'SELL' && transaction.pl !== null && transaction.pl !== undefined) {
      return total + transaction.pl;
    }
    return total;
  }, 0);

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="bg-[#41748D] text-white px-6 py-4">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center">
            <div>
              {isEditing ? (
                <div className="flex items-center space-x-3">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="border border-white/20 rounded-lg px-3 py-2 bg-white/10 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/30"
                    style={{ fontFamily: 'Rubik, sans-serif' }}
                    autoFocus
                  />
                  <button
                    onClick={handleUpdateName}
                    disabled={isSaving}
                    className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                    style={{ fontFamily: 'Rubik, sans-serif' }}
                  >
                    {isSaving ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setNewName(portfolioData.name);
                    }}
                    className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors"
                    style={{ fontFamily: 'Rubik, sans-serif' }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <h1 className="text-2xl font-medium" style={{ fontFamily: 'Rubik, sans-serif' }}>{portfolioData.name}</h1>
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="text-white/80 hover:text-white transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </button>
                </div>
              )}
              <p className="text-white/80 text-sm mt-1" style={{ fontFamily: 'Rubik, sans-serif' }}>
                Created on {new Date(portfolioData.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1" style={{ fontFamily: 'Rubik, sans-serif' }}>Cash</p>
              <p className="font-medium text-gray-800" style={{ fontFamily: 'Rubik, sans-serif' }}>
                {formatCurrency(portfolioData.details.cash)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1" style={{ fontFamily: 'Rubik, sans-serif' }}>Holdings</p>
              <p className="font-medium text-gray-800" style={{ fontFamily: 'Rubik, sans-serif' }}>
                {hasAllValidCurrentPrices ? formatCurrency(holdingsValueCurrentPrices) : formatCurrency(holdingsValue)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1" style={{ fontFamily: 'Rubik, sans-serif' }}>Total Value</p>
              <p className="font-medium text-gray-800" style={{ fontFamily: 'Rubik, sans-serif' }}>
                {formatCurrency(totalValue)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1" style={{ fontFamily: 'Rubik, sans-serif' }}>Return</p>
              <p className={`font-medium ${
                portfolioReturn === null ? 'text-gray-800' : 
                portfolioReturn >= 0 ? 'text-green-500' : 'text-red-500'
              }`} style={{ fontFamily: 'Rubik, sans-serif' }}>
                {formatReturn(portfolioReturn)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1" style={{ fontFamily: 'Rubik, sans-serif' }}>Realized P&L</p>
              <p className={`font-medium ${
                realizedPL >= 0 ? 'text-green-500' : 'text-red-500'
              }`} style={{ fontFamily: 'Rubik, sans-serif' }}>
                {formatCurrency(realizedPL)}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Notifications */}
      {errorMessage && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg z-50">
          <p style={{ fontFamily: 'Rubik, sans-serif' }}>{errorMessage}</p>
        </div>
      )}
      
      {successMessage && (
        <div className="fixed bottom-4 right-4 bg-[#41748D] text-white p-4 rounded-lg shadow-lg z-50">
          <p style={{ fontFamily: 'Rubik, sans-serif' }}>{successMessage}</p>
        </div>
      )}
    </>
  );
}