"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PortfolioCreate from "./PortfolioCreate";
import PortfolioList from "./PortfolioList";
import Navbar from '../../components/navigation/Navbar';
import Link from 'next/link';

// Define interfaces based on API response structure
interface Portfolio {
  id: number;
  name: string;
  created_at: string;
  cash?: number;
  holdings_count?: number;
  user_id: number;
  data?: any;
  details?: {
    cash: number;
    holdings: Record<string, any>;
    return: number;
  };
}

const PortfolioPage: React.FC = () => {
  const router = useRouter();
  const baseURL = 'https://thecodeworks.in/quarksfinance/api';
  
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [token, setToken] = useState<string>("");
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const storedToken = localStorage.getItem('quarksFinanceToken');
    
    if (storedToken) {
      setToken(storedToken);
      setIsLoggedIn(true);
      fetchPortfolios(storedToken);
    } else {
      // Redirect to main page if not logged in
      router.push('/home');
    }
  }, [router]);

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

  const fetchPortfolios = async (authToken: string): Promise<void> => {
    try {
      setLoading(true);
      
      const response = await fetch(`${baseURL}/portfolios`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': authToken
        }
      });
      
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          // Token expired or invalid
          localStorage.removeItem('quarksFinanceToken');
          setIsLoggedIn(false);
          router.push('/login');
          showMessage('Session expired. Please log in again.', true);
          return;
        }
        throw new Error(`API responded with status ${response.status}`);
      }
      
      const data = await response.json();
      console.log("API Response:", data); // Debug logging
      
      // Handle the portfolio data based on API response structure
      if (data && data.portfolios && Array.isArray(data.portfolios)) {
        // Process each portfolio to ensure it has the expected format
        const processedPortfolios = data.portfolios.map((portfolio: any) => {
          // Add any necessary transformations or defaults
          return {
            ...portfolio,
            // Create details object if needed for PortfolioList
            details: portfolio.details || {
              cash: portfolio.cash || 0,
              holdings: portfolio.data?.portfolio?.holdings || {},
              return: 0
            }
          };
        });
        
        setPortfolios(processedPortfolios);
      } else if (Array.isArray(data)) {
        // Handle case where API directly returns an array
        setPortfolios(data);
      } else {
        console.error("Unexpected API response format:", data);
        showMessage('Failed to load portfolios: Invalid response format', true);
      }
    } catch (err) {
      showMessage('Error fetching portfolios. Please try again.', true);
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  interface NewPortfolio {
    name: string;
    initial_cash?: number;
    [key: string]: any;
  }

  const handleCreatePortfolio = async (newPortfolio: NewPortfolio): Promise<void> => {
    try {
      // Ensure initial_cash is included in the request
      if (!newPortfolio.initial_cash) {
        newPortfolio.initial_cash = 10000; // Default value
      }
      
      const response = await fetch(`${baseURL}/portfolios`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'x-access-token': token
        },
        body: JSON.stringify(newPortfolio),
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
      
      if (data.portfolio_id || data.message === "Portfolio created") {
        showMessage(`Portfolio "${newPortfolio.name}" created successfully`);
        fetchPortfolios(token); // Refresh the list
      } else {
        showMessage(data.message || 'Failed to create portfolio', true);
      }
    } catch (err: any) {
      showMessage('Error creating portfolio. Please try again.', true);
      console.error("Create portfolio error:", err);
    }
  };

  const handleRefresh = () => {
    fetchPortfolios(token);
  };

  if (!isLoggedIn) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <nav className="px-6 mt-4 flex items-center gap-4 text-sm">
        <Link href="/home" className="text-black text-2xl" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>Home</Link>
        <span className="text-black text-2xl" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>&gt;</span>
        <Link href="/portfolios" className="text-black text-2xl" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>Portfolios</Link>
      </nav>
      <div className="container mx-auto px-4 md:px-40 py-8">
      <div className="w-full px-4 mt-4">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-24 bg-white rounded-lg p-8 relative overflow-hidden border shadow-sm" style={{ minHeight: '100px' }}>
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'JetBrains Mono, monospace', color: '#4C555A' }}>
            Portfolios
          </h1>
          <p className="text-black" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '17px' }}>
            Maintain your portfolios with live as well as historical trades
          </p>
        </div>
        <div className="absolute left-172 w-full h-full">
          <img 
            src="/images/portfolio1.svg" 
            alt="Portfolio illustration" 
            className="scale-148"
          />
        </div>
      </div>

      {/* Create Portfolio */}
      <div className="max-w-4xl mx-auto mb-20">
        <PortfolioCreate onCreatePortfolio={handleCreatePortfolio} />
      </div>
      
      {/* Portfolios List */}
      <div className="max-w-4xl mx-auto mb-8">
        {loading ? (
          <div className="text-center py-8">
            <p className="text-black" style={{ fontFamily: 'Rubik, sans-serif' }}>Loading portfolios...</p>
          </div>
        ) : (
          <PortfolioList 
            portfolios={portfolios} 
            onRefresh={handleRefresh}
            token={token}
            baseURL={baseURL}
            showMessage={showMessage}
          />
        )}
      </div>
      
      {/* Notifications */}
      {errorMessage && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white p-3 rounded shadow-md">
          {errorMessage}
        </div>
      )}
      
      {successMessage && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white p-3 rounded shadow-md">
          {successMessage}
        </div>
      )}
      </div>
      </div>
    </div>
  );
};

export default PortfolioPage;