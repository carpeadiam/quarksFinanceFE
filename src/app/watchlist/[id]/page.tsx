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
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (watchlistIdFromParams) {
      setWatchlistId(parseInt(watchlistIdFromParams));
    }
  }, [watchlistIdFromParams]);
  
  useEffect(() => {
    const storedToken = localStorage.getItem('quarksFinanceToken');
    if (storedToken && watchlistId !== null) {
      setToken(storedToken);
      setIsLoggedIn(true);
      fetchSingleWatchlist(watchlistId, storedToken);
    } else if (!storedToken) {
      router.push('/watchlist');
    }
  }, [watchlistId, router]);
  
  useEffect(() => {
    if (watchlistId !== null && token) {
      fetchSingleWatchlist(watchlistId, token);
      const intervalId = setInterval(() => {
        fetchSingleWatchlist(watchlistId, token);
      }, 5000);
      return () => clearInterval(intervalId);
    }
  }, [watchlistId, token]);

  useEffect(() => {
    if (watchlist) {
      setNewName(watchlist.name);
    }
  }, [watchlist]);

  const showMessage = (message: string, isError: boolean = false) => {
    if (isError) {
      setErrorMessage(message);
      setSuccessMessage('');
    } else {
      setSuccessMessage(message);
      setErrorMessage('');
    }
    setTimeout(() => {
      setErrorMessage('');
      setSuccessMessage('');
    }, 3000);
  };
  
  const fetchSingleWatchlist = async (watchlistId: number, authToken: string) => {
    try {
      const response = await fetch(`${baseURL}/watchlists/${watchlistId}`, {
        method: 'GET',
        headers: {
          'x-access-token': authToken
        }
      });
      
      const data = await response.json();
      
      if (data.id) {
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
        fetchSingleWatchlist(watchlistId, token);
      } else {
        showMessage(data.message || 'Failed to remove symbol', true);
      }
    } catch (err) {
      showMessage('Error removing symbol. Please try again.', true);
      console.error(err);
    }
  };

  const handleUpdateName = async () => {
    if (!newName.trim() || !watchlistId) return;
    
    try {
      setIsSaving(true);
      const response = await fetch(`${baseURL}/watchlists/${watchlistId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          'x-access-token': token,
        },
        body: JSON.stringify({ name: newName }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update watchlist name");
      }

      setIsEditing(false);
      showMessage("Watchlist name updated successfully");
      setWatchlist(prev => prev ? { ...prev, name: newName } : null);
      fetchSingleWatchlist(watchlistId, token);
    } catch (error: any) {
      console.error("Error updating watchlist:", error);
      showMessage(error.message || "Failed to update watchlist name", true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newSymbol.trim()) {
      addSymbolToWatchlist(newSymbol);
    }
  };
  
  if (!isLoggedIn || watchlistId === null) {
    return null;
  }
  
  return (
    <div className="min-h-screen bg-white text-gray-800">
      <Navbar />
      
      <nav className="px-8 py-3 flex items-center gap-4 text-sm mb-10">
        <Link href="/home" className="text-black text-2xl" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>Home</Link>
        <span className="text-black text-2xl" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>&gt;</span>
        <Link href="/watchlist" className="text-black text-2xl" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>Watchlists</Link>
        <span className="text-black text-2xl" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>&gt;</span>
        <span className="text-black text-2xl" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>
          {watchlist?.name || 'Loading...'}
        </span>
      </nav>
      
      <main className="max-w-5xl mx-auto px-4 py-4">
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
            <div className="bg-[#41748D] text-white p-4 rounded-t-lg flex justify-between items-center">
              {isEditing ? (
                <div className="flex items-center space-x-2 flex-grow">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="border border-white/20 rounded-lg px-3 py-2 bg-white/10 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/30"
                    style={{ fontFamily: 'Rubik, sans-serif' }}
                  />
                  <button
                    onClick={handleUpdateName}
                    className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                    disabled={isSaving}
                  >
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-medium">{watchlist.name}</h2>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="text-white hover:text-gray-200"
                      aria-label="Edit watchlist name"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>

                    </button>
                    <button 
                      onClick={() => watchlistId && fetchSingleWatchlist(watchlistId, token)}
                      className="text-white hover:text-gray-200"
                      aria-label="Refresh watchlist"
                    >
                      ⟳
                    </button>
                  </div>
                </>
              )}
            </div>
            
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