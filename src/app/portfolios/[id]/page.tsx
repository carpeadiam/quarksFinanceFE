"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "../../../components/navigation/Navbar";
import PortfolioHeader from "./PortfolioHeader";
import PortfolioHoldings from "./PortfolioHoldings";
import TransactionForm from "./TransactionForm";
import TransactionHistory from "./TransactionHistory";
import { Portfolio, Holding, Transaction } from "./portfolio";

const PortfolioDetailPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const portfolioIdFromParams = typeof params?.id === 'string' ? params.id : '';
  const baseURL = 'https://thecodeworks.in/quarksfinance/api';
  
  const [portfolioId, setPortfolioId] = useState<number | null>(null);
  const [token, setToken] = useState<string>('');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  
  // First useEffect to handle params and set portfolioId
  useEffect(() => {
    if (portfolioIdFromParams) {
      setPortfolioId(parseInt(portfolioIdFromParams));
    }
  }, [portfolioIdFromParams]);
  
  // Second useEffect to check login and fetch data when portfolioId is available
  useEffect(() => {
    const storedToken = localStorage.getItem('quarksFinanceToken');
    
    if (storedToken && portfolioId !== null) {
      setToken(storedToken);
      setIsLoggedIn(true);
      fetchPortfolioData(portfolioId, storedToken);
    } else if (!storedToken) {
      // Redirect to login page if not logged in
      router.push('/login');
    }
  }, [portfolioId, router]);
  
  // Auto-refresh useEffect that fetches data every 5 seconds
  useEffect(() => {
    // Only set up the interval if we have a valid portfolioId and token
    if (portfolioId !== null && token) {
      // Set up interval to fetch every 5 seconds
      const intervalId = setInterval(() => {
        fetchPortfolioData(portfolioId, token);
      }, 5000);
      
      // Clean up the interval when component unmounts
      return () => clearInterval(intervalId);
    }
  }, [portfolioId, token]);
  
  const showMessage = (message: string, isError: boolean = false) => {
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
  
  const fetchPortfolioData = async (portfolioId: number, authToken: string) => {
    try {
      setLoading(true);
      const response = await fetch(`${baseURL}/portfolios/${portfolioId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': authToken
        }
      });
      
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('quarksFinanceToken');
          setIsLoggedIn(false);
          router.push('/login');
          showMessage('Session expired. Please log in again.', true);
          return;
        }
        throw new Error(`API responded with status ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Portfolio details:", data); // Debug logging
      
      if (data.id) {
        setPortfolio(data);
        // Fetch current prices for the holdings
        if (data.details?.holdings) {
          fetchCurrentPrices(data.details.holdings, authToken, data);
        }
      } else {
        showMessage('Failed to load portfolio details', true);
      }
    } catch (err: any) {
      console.error("Error fetching portfolio:", err);
      showMessage('Error loading portfolio: ' + (err.message || 'Unknown error'), true);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchCurrentPrices = async (
    holdings: Record<string, Holding>, 
    authToken: string,
    currentPortfolio: Portfolio
  ) => {
    const symbols = Object.keys(holdings);
    if (symbols.length === 0) return;
    
    try {
      const updatedHoldings = { ...holdings };
      let updatedPortfolio = { ...currentPortfolio };
      
      for (const symbol of symbols) {
        try {
          const response = await fetch(`${baseURL}/market/price/${symbol}`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              'x-access-token': authToken,
            },
          });
          
          if (response.ok) {
            const priceData = await response.json();
            if (priceData.price) {
              // Update the holding with the current price
              updatedHoldings[symbol] = {
                ...updatedHoldings[symbol],
                current_price: priceData.price
              };
            } else {
              // If price isn't available, set to null explicitly
              updatedHoldings[symbol] = {
                ...updatedHoldings[symbol],
                current_price: null
              };
            }
          } else {
            // If API call fails, set price to null
            updatedHoldings[symbol] = {
              ...updatedHoldings[symbol],
              current_price: null
            };
          }
        } catch (err) {
          console.error(`Error fetching price for ${symbol}:`, err);
          // On error, set price to null
          updatedHoldings[symbol] = {
            ...updatedHoldings[symbol],
            current_price: null
          };
        }
      }
      
      // Update the portfolio with the new prices
      updatedPortfolio.details.holdings = updatedHoldings;
      setPortfolio(updatedPortfolio);
      
    } catch (error) {
      console.error("Error fetching current prices:", error);
    }
  };
  
  const handleDataUpdate = () => {
    if (portfolioId !== null && token) {
      fetchPortfolioData(portfolioId, token);
    }
  };
  
  if (!isLoggedIn || portfolioId === null) {
    return null; // Will redirect in useEffect
  }
  
  return (
    <div className="min-h-screen  text-gray-800">
      <Navbar />
      {/* Breadcrumb navigation */}
      <nav className="px-8 py-3 flex items-center gap-4 text-sm mb-10">
        <Link href="/home" className="text-black text-2xl" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>Home</Link>
        <span className="text-black text-2xl" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>&gt;</span>
        <Link href="/portfolios" className="text-black text-2xl" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>Portfolios</Link>
        <span className="text-black text-2xl" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>&gt;</span>
        <span className="text-black text-2xl" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>{portfolio?.name || 'Loading...'}</span>
      </nav>
      
      {/* Main content */}
      <main className="max-w-6xl mx-auto px-6 py-6">
        {loading && !portfolio ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-lg border border-gray-200 p-8">
              <p className="text-gray-600" style={{ fontFamily: 'Rubik, sans-serif' }}>Loading portfolio details...</p>
            </div>
          </div>
        ) : errorMessage ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-lg border border-gray-200 p-8">
              <p className="text-red-600 mb-4" style={{ fontFamily: 'Rubik, sans-serif' }}>{errorMessage}</p>
              <button
                onClick={handleDataUpdate}
                className="px-6 py-2 bg-[#41748D] text-white rounded-lg hover:bg-[#365f73] transition-colors"
                style={{ fontFamily: 'Rubik, sans-serif' }}
              >
                Retry
              </button>
            </div>
          </div>
        ) : portfolio ? (
          <div className="space-y-6">
            {/* Portfolio Header with Summary */}
            <PortfolioHeader 
              portfolio={portfolio} 
              onRefresh={handleDataUpdate}
            />
            
            {/* Portfolio Holdings Table */}


              <div className="p-6">
                <PortfolioHoldings 
                  portfolioId={portfolioId.toString()} 
                  token={token}
                  holdings={portfolio.details.holdings}
                  onDataUpdate={handleDataUpdate}
                />
              </div>

            
            {/* Transaction Form */}

              <div className="px-6 py-4 ">
                <h2 className="text-xl font-bold " style={{ fontFamily: 'Rubik, sans-serif' }}>Place Order</h2>
              </div>
              <div className="p-6">
                <TransactionForm 
                  portfolioId={portfolioId.toString()}
                  token={token}
                  //cash={portfolio.details.cash} 
                  onTransactionComplete={handleDataUpdate}
                />
              </div>

            
            {/* Transaction History */}
            
              <div className="px-6 py-4 ">
                <h2 className="text-xl font-bold " style={{ fontFamily: 'Rubik, sans-serif' }}>Transaction History</h2>
              </div>
              <div className="p-6">
                <TransactionHistory 
                  transactions={portfolio.details.transactions || []}
                />
              </div>
            </div>

        ) : (
          <div className="text-center py-12">
            <div className="bg-white rounded-lg border border-gray-200 p-8">
              <p className="text-gray-600" style={{ fontFamily: 'Rubik, sans-serif' }}>No portfolio found with ID: {portfolioId}</p>
            </div>
          </div>
        )}
      </main>
      
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
    </div>
  );
};

export default PortfolioDetailPage;