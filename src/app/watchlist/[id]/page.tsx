"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../../components/navigation/Navbar';
import { useParams } from 'next/navigation';

type WatchlistSummary = {
  "Added On": string;
  "Change": number;
  "Current Price": number;
  "Initial Price": number;
  "Symbol": string;
};

type WatchlistDetails = {
  created_at: string;
  id: number;
  name: string;
  symbol_count: number;
  user_id: number;
  watchlist_summary: WatchlistSummary[];
};

const WatchlistDetailPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const watchlistIdFromParams = typeof params?.id === 'string' ? params.id : '';
  const baseURL = 'https://thecodeworks.in/quarksfinance/api';
  
  const [watchlistId, setWatchlistId] = useState<number | null>(null);
  const [token, setToken] = useState<string>('');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [watchlist, setWatchlist] = useState<WatchlistDetails | null>(null);
  const [newSymbol, setNewSymbol] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  
  // First useEffect to handle params and set watchlistId
  useEffect(() => {
    if (watchlistIdFromParams) {
      setWatchlistId(parseInt(watchlistIdFromParams));
    }
  }, [watchlistIdFromParams]);
  
  // Second useEffect to check login and fetch data when watchlistId is available
  useEffect(() => {
    const storedToken = localStorage.getItem('quarksFinanceToken');
    console.log(storedToken);
    
    if (storedToken && watchlistId !== null) {
      setToken(storedToken);
      setIsLoggedIn(true);
      fetchSingleWatchlist(watchlistId, storedToken);
    } else if (!storedToken) {
      // Redirect to main page if not logged in
      router.push('/watchlist');
    }
  }, [watchlistId, router]);
  
  // Auto-refresh useEffect that fetches data every 5 seconds
  useEffect(() => {
    // Only set up the interval if we have a valid watchlistId and token
    if (watchlistId !== null && token) {
      // Initial fetch
      fetchSingleWatchlist(watchlistId, token);
      
      // Set up interval to fetch every 5 seconds
      const intervalId = setInterval(() => {
        fetchSingleWatchlist(watchlistId, token);
      }, 5000);
      
      // Clean up the interval when component unmounts
      return () => clearInterval(intervalId);
    }
  }, [watchlistId, token]);
  
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
  
  const fetchSingleWatchlist = async (watchlistId: number, authToken: string) => {
    try {
      // Fetch the watchlist details
      const response = await fetch(`${baseURL}/watchlists/${watchlistId}`, {
        method: 'GET',
        headers: {
          'x-access-token': authToken
        }
      });
      
      const data = await response.json();
      
      if (data.id) {
        // Successfully fetched watchlist details
        setWatchlist(data);
      } else {
        showMessage('Failed to load watchlist details', true);
        router.push('/watchlist');
      }
    } catch (err) {
      showMessage('Error fetching watchlist details. Please try again.', true);
      console.error(err);
      router.push('/watchlist');
    }
  };
  
  const addSymbolToWatchlist = async (symbol: string) => {
    if (!watchlistId) return;
    
    if (!symbol.trim()) {
      showMessage('Please enter a symbol', true);
      return;
    }
    
    try {
      const response = await fetch(`${baseURL}/watchlists/${watchlistId}/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': token
        },
        body: JSON.stringify({ symbol })
      });
      
      const data = await response.json();
      
      if (data.id) {
        showMessage(`Added ${symbol} to watchlist`);
        setNewSymbol('');
        
        // Refresh the watchlist data immediately after successful addition
        fetchSingleWatchlist(watchlistId, token);
      } else {
        showMessage(data.message || 'Failed to add symbol', true);
      }
    } catch (err) {
      showMessage('Error adding symbol. Please try again.', true);
      console.error(err);
    }
  };
  
  const removeSymbolFromWatchlist = async (symbol: string) => {
    if (!watchlistId) return;
    
    try {
      const response = await fetch(`${baseURL}/watchlists/${watchlistId}/remove`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': token
        },
        body: JSON.stringify({ symbol })
      });
      
      const data = await response.json();
      
      if (data.id) {
        showMessage(`Removed ${symbol} from watchlist`);
        
        // Refresh the watchlist data immediately after successful removal
        fetchSingleWatchlist(watchlistId, token);
      } else {
        showMessage(data.message || 'Failed to remove symbol', true);
      }
    } catch (err) {
      showMessage('Error removing symbol. Please try again.', true);
      console.error(err);
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newSymbol.trim()) {
      addSymbolToWatchlist(newSymbol);
    }
  };
  
  if (!isLoggedIn || watchlistId === null) {
    return null; // Will redirect in useEffect
  }
  
  return (
    <div className="min-h-screen bg-white text-gray-800">
      <Navbar />
      
      {/* Breadcrumb navigation */}
      <nav className="px-8 py-3 flex items-center gap-4 text-sm mb-10">
        <Link href="/home" className="text-black text-2xl" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>Home</Link>
        <span className="text-black text-2xl" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>&gt;</span>
        <Link href="/watchlist" className="text-black text-2xl" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>Watchlists</Link>
        <span className="text-black text-2xl" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>&gt;</span>
        <span className="text-black text-2xl" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>{watchlist?.name || 'Loading...'}</span>
      </nav>
      
      {/* Main content */}
      <main className="max-w-5xl mx-auto px-4 py-4">
        {/* Search and add section */}
        <div className="max-w-4xl mx-auto mb-20">
          <div className="border rounded-lg overflow-hidden bg-white border border-gray-200">
            <div className="flex items-center px-2 py-2">
              <span className="text-2xl ml-6 text-gray-700 mr-4 mb-1">+</span>
              <input
                type="text"
                placeholder="Search for a stock to add"
                value={newSymbol}
                onChange={(e) => setNewSymbol(e.target.value)}
                onKeyPress={handleKeyPress}
                className="p-2 text-gray-700 flex-grow border-none focus:outline-none"
                style={{ fontFamily: 'Rubik, sans-serif' }}
              />
              <button
                onClick={() => addSymbolToWatchlist(newSymbol)}
                className="bg-[#41748D] text-white px-6 py-2 rounded hover:bg-[#365f73]"
                style={{ fontFamily: 'Rubik, sans-serif' }}
                disabled={!newSymbol.trim()}
              >
                Add
              </button>
            </div>
          </div>
        </div>
        {watchlist ? (
          <div>
            {/* Watchlist header with refresh button */}
            <div className="bg-[#41748D] text-white p-4 rounded-t-lg flex justify-between items-center">
              <h2 className="text-xl font-medium">{watchlist.name}</h2>
              <button 
                onClick={() => watchlistId && fetchSingleWatchlist(watchlistId, token)}
                className="text-white hover:text-gray-200"
                aria-label="Refresh watchlist"
              >
                ⟳
              </button>
            </div>
            
            {/* Watchlist table with borders */}
            <div className="border border-t-0 rounded-b-lg overflow-hidden mb-8">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-center p-3 border-r" style={{ fontFamily: 'Rubik, sans-serif' }}>Symbol</th>
                    <th className="text-center p-3 border-r" style={{ fontFamily: 'Rubik, sans-serif' }}>Added On</th>
                    <th className="text-center p-3 border-r" style={{ fontFamily: 'Rubik, sans-serif' }}>Initial Price</th>
                    <th className="text-center p-3 border-r" style={{ fontFamily: 'Rubik, sans-serif' }}>Current Price</th>
                    <th className="text-center p-3" style={{ fontFamily: 'Rubik, sans-serif' }}>Change</th>
                  </tr>
                </thead>
                <tbody>
                  {watchlist.watchlist_summary.length > 0 ? (
                    watchlist.watchlist_summary.map((item, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-3 border-r text-center" style={{ fontFamily: 'Rubik, sans-serif' }}>{item.Symbol}</td>
                        <td className="p-3 border-r text-center" style={{ fontFamily: 'Rubik, sans-serif' }}>{item["Added On"].split(' ')[0]}</td>
                        <td className="p-3 border-r text-center" style={{ fontFamily: 'Rubik, sans-serif' }}>{item["Initial Price"].toFixed(2)}</td>
                        <td className="p-3 border-r text-center" style={{ fontFamily: 'Rubik, sans-serif' }}>{item["Current Price"].toFixed(2)}</td>
                        <td className={`p-3 text-center ${item.Change > 0 ? 'text-green-500' : item.Change < 0 ? 'text-red-500' : 'text-gray-500'}`} style={{ fontFamily: 'Rubik, sans-serif' }}>
                          {item.Change > 0 ? `+${item.Change.toFixed(2)}` : item.Change.toFixed(2)}
                        </td>
                        <td>
                        <button 
                          onClick={() => removeSymbolFromWatchlist(item.Symbol)}
                          className="ml-2 text-gray-500 hover:text-red-500"
                          style={{ fontFamily: 'Rubik, sans-serif' }}
                          aria-label="Remove symbol"
                        >
                          ✕
                        </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-gray-500">
                        No symbols added to this watchlist yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p>Loading watchlist details...</p>
          </div>
        )}
      </main>
      
      {/* Notifications */}
      {errorMessage && (
        <div className="fixed bottom-4 right-4 bg-[#41748D] text-white p-3 rounded shadow-md">
          {errorMessage}
        </div>
      )}
      
      {successMessage && (
        <div className="fixed bottom-4 right-4 bg-[#41748D] text-white p-3 rounded shadow-md">
          {successMessage}
        </div>
      )}
    </div>
  );
};

export default WatchlistDetailPage;