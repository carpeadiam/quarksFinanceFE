"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type WatchlistSummary = {
  "Added On": string;
  "Change": number;
  "Current Price": number;
  "Initial Price": number;
  "Symbol": string;
};

type Watchlist = {
  created_at: string;
  id: number;
  name: string;
  symbol_count: number;
  watchlist_summary: WatchlistSummary[];
};

const Watchlist: React.FC = () => {
  const router = useRouter();
  const baseURL = 'https://thecodeworks.in/quarksfinance/api';
  
  const [token, setToken] = useState<string>('');
  const [userId, setUserId] = useState<number | null>(null);
  const [username, setUsername] = useState<string>('');
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [newWatchlistName, setNewWatchlistName] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  
  // Check for token in localStorage on component mount
  useEffect(() => {
    const storedToken = localStorage.getItem('quarksFinanceToken');
    const storedUserId = localStorage.getItem('quarksFinanceUserId');
    const storedUsername = localStorage.getItem('quarksFinanceUsername');
    
    if (storedToken && storedUserId) {
      setToken(storedToken);
      setUserId(parseInt(storedUserId));
      setUsername(storedUsername || '');
      fetchWatchlists(storedToken);
    } else {
      // Redirect to auth page if not logged in
      router.push('/auth');
    }
  }, [router]);
  
  // Auto-refresh useEffect that fetches data every 5 seconds
  useEffect(() => {
    // Only start the interval if we have a valid token
    if (token) {
      // Set up interval to fetch data every 5 seconds
      const intervalId = setInterval(() => {
        fetchWatchlists(token);
      }, 5000);
      
      // Clean up the interval when the component unmounts
      return () => clearInterval(intervalId);
    }
  }, [token]);
  
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
  
  const fetchWatchlists = async (authToken: string) => {
    try {
      const response = await fetch(`${baseURL}/watchlists`, {
        method: 'GET',
        headers: {
          'x-access-token': authToken
        }
      });
      
      const data = await response.json();
      
      if (data.watchlists) {
        // For each watchlist, fetch detailed information
        const watchlistsWithDetails = await Promise.all(data.watchlists.map(async (watchlist: Watchlist) => {
          try {
            const detailResponse = await fetch(`${baseURL}/watchlists/${watchlist.id}`, {
              method: 'GET',
              headers: {
                'x-access-token': authToken
              }
            });
            
            const detailData = await detailResponse.json();
            if (detailData.id) {
              return detailData;
            }
            return watchlist;
          } catch (error) {
            console.error(`Error fetching details for watchlist ${watchlist.id}:`, error);
            return watchlist;
          }
        }));
        
        setWatchlists(watchlistsWithDetails);
      } else {
        setWatchlists([]);
      }
    } catch (err) {
      showMessage('Error fetching watchlists. Please try again.', true);
      console.error(err);
    }
  };
  
  const createWatchlist = async () => {
    if (!newWatchlistName.trim()) {
      showMessage('Please enter a watchlist name', true);
      return;
    }
    
    try {
      const response = await fetch(`${baseURL}/watchlists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': token
        },
        body: JSON.stringify({ name: newWatchlistName })
      });
      
      const data = await response.json();
      
      if (data.message === "Watchlist created") {
        showMessage('Watchlist created successfully!');
        setNewWatchlistName('');
        fetchWatchlists(token);
      } else {
        showMessage(data.message || 'Failed to create watchlist', true);
      }
    } catch (err) {
      showMessage('Error creating watchlist. Please try again.', true);
      console.error(err);
    }
  };
  
  const deleteWatchlist = async (watchlistId: number) => {
    try {
      const response = await fetch(`${baseURL}/watchlists/${watchlistId}`, {
        method: 'DELETE',
        headers: {
          'x-access-token': token
        }
      });
      
      const data = await response.json();
      
      if (data.message === "Watchlist deleted") {
        showMessage('Watchlist deleted successfully!');
        fetchWatchlists(token);
      } else {
        showMessage(data.message || 'Failed to delete watchlist', true);
      }
    } catch (err) {
      showMessage('Error deleting watchlist. Please try again.', true);
      console.error(err);
    }
  };
  
  const navigateToWatchlist = (watchlistId: number) => {
    router.push(`/watchlist/${watchlistId}`);
  };
  
  return (
    <div className="w-full px-4 mt-4">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-24 bg-white rounded-lg p-8 relative overflow-hidden border shadow-sm" style={{ minHeight: '100px' }}>
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'JetBrains Mono, monospace', color: '#4C555A' }}>
            Watchlists
          </h1>
          <p className="text-black" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '17px' }}>
            Keep track of stocks and their prices changes over time
          </p>
        </div>
        <div className="absolute left-150 w-full h-full overflow-hidden">
          <img 
            src="/images/watchlist1.svg" 
            alt="Watchlist illustration" 
            className="scale-148"
          />
        </div>
      </div>

      {/* Create Watchlist */}
      <div className="max-w-4xl mx-auto mb-20">
        <div className="border rounded-lg overflow-hidden bg-white border border-gray-200">
          <div className="flex items-center px-2 py-2">
            <span className="text-2xl ml-6 text-gray-700 mr-4 mb-1">+</span>
          <input
            type="text"
            placeholder="Add a new Watchlist"
            value={newWatchlistName}
            onChange={(e) => setNewWatchlistName(e.target.value)}
            className="p-2 text-gray-700 flex-grow border-none focus:outline-none"
            style={{ fontFamily: 'Rubik, sans-serif' }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                createWatchlist();
              }
            }}
          />
            <button
              onClick={() => createWatchlist()}
              className="bg-[#41748D] text-white px-6 py-2 rounded hover:bg-[#365f73]"
              style={{ fontFamily: 'Rubik, sans-serif' }}
            >
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Watchlists */}
      <div className="max-w-4xl mx-auto mb-8">
        {watchlists.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-black" style={{ fontFamily: 'Rubik, sans-serif' }}>No watchlists found. Create one above!</p>
          </div>
        ) : (
          watchlists.map((watchlist) => (
            <div key={watchlist.id} className="mb-6 bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="bg-[#41748D] text-white px-4 py-3 flex justify-between items-center">
                <h3 className="font-medium" style={{ fontFamily: 'Rubik, sans-serif' }}>{watchlist.name}</h3>
                <div className="font-medium text-sm">
                  <button
                    onClick={() => navigateToWatchlist(watchlist.id)}
                    className="text-white hover:cursor-pointer mr-4"
                    style={{ fontFamily: 'Rubik, sans-serif' }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteWatchlist(watchlist.id)}
                    className="text-white hover:cursor-pointer"
                    style={{ fontFamily: 'Rubik, sans-serif' }}
                  >
                    Remove
                  </button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-black">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-center p-3 border-r" style={{ fontFamily: 'Rubik, sans-serif' }}>Symbol</th>
                      <th className="text-center p-3 border-r" style={{ fontFamily: 'Rubik, sans-serif' }}>Added On</th>
                      <th className="text-center p-3 border-r" style={{ fontFamily: 'Rubik, sans-serif' }}>Initial Price</th>
                      <th className="text-center p-3 border-r" style={{ fontFamily: 'Rubik, sans-serif' }}>Current Price</th>
                      <th className="text-center p-3" style={{ fontFamily: 'Rubik, sans-serif' }}>Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {watchlist.watchlist_summary && watchlist.watchlist_summary.length > 0 ? (
                      // Display only the first 2 symbols
                      watchlist.watchlist_summary.slice(0, 2).map((item, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-3 border-r text-center" style={{ fontFamily: 'Rubik, sans-serif' }}>{item.Symbol}</td>
                          <td className="p-3 border-r text-center" style={{ fontFamily: 'Rubik, sans-serif' }}>{item["Added On"].split(' ')[0]}</td>
                          <td className="p-3 border-r text-center" style={{ fontFamily: 'Rubik, sans-serif' }}>{item["Initial Price"].toFixed(2)}</td>
                          <td className="p-3 border-r text-center" style={{ fontFamily: 'Rubik, sans-serif' }}>{item["Current Price"].toFixed(2)}</td>
                          <td className={`p-3 text-center ${item.Change > 0 ? 'text-green-500' : item.Change < 0 ? 'text-red-500' : 'text-gray-500'}`} style={{ fontFamily: 'Rubik, sans-serif' }}>
                            {item.Change > 0 ? `+${item.Change.toFixed(2)}` : item.Change.toFixed(2)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-3 text-center" style={{ fontFamily: 'Rubik, sans-serif' }}>
                          No symbols added to this watchlist yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ))
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
  );
};

export default Watchlist;