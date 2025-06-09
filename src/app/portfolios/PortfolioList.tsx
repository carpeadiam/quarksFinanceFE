import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";

interface PortfolioDetails {
  cash: number;
  holdings: Record<string, any>;
  return?: number;
  transactions?: any[];
}

interface Portfolio {
  id: number;
  name: string;
  created_at: string;
  cash?: number;
  holdings_count?: number;
  details?: PortfolioDetails;
  data?: {
    portfolio?: PortfolioDetails;
  };
}

interface PortfolioListProps {
  portfolios: Portfolio[];
  onRefresh: () => void;
  token: string;
  baseURL: string;
  showMessage: (message: string, isError?: boolean) => void;
}

export default function PortfolioList({ 
  portfolios, 
  onRefresh, 
  token, 
  baseURL,
  showMessage 
}: PortfolioListProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [localPortfolios, setLocalPortfolios] = useState<Portfolio[]>([]);
  
  // Update local portfolios when prop changes
  useEffect(() => {
    if (portfolios && portfolios.length > 0) {
      setLocalPortfolios(portfolios);
    }
  }, [portfolios]);

  useEffect(() => {
    const storedToken = localStorage.getItem('quarksFinanceToken');
    
    if (storedToken) {
      setIsLoggedIn(true);
    } else {
      // Redirect to login if no token is found
      router.push('/login');
    }
  }, [router]);

  const handleViewPortfolio = (id: number) => {
    router.push(`/portfolios/${id}`);
  };

  const handleDeletePortfolio = async (id: number) => {
    if (!confirm("Are you sure you want to delete this portfolio?")) return;
    
    // Use stored token from localStorage to ensure it's the most up-to-date
    const currentToken = localStorage.getItem('quarksFinanceToken') || token;
    
    if (!currentToken) {
      showMessage("Authentication error. Please log in again.", true);
      router.push('/login');
      return;
    }
    
    try {
      setDeletingId(id);
      const response = await fetch(`${baseURL}/portfolios/${id}`, {
        method: "DELETE",
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': currentToken
        },
      });

      // Handle response status
      if (response.status === 401 || response.status === 403) {
        showMessage("Authentication error. Please log in again.", true);
        localStorage.removeItem('quarksFinanceToken');
        router.push('/login');
        return;
      }

      const data = await response.json();

      if (response.ok || data.success || data.message === "Portfolio deleted") {
        showMessage("Portfolio deleted successfully");
        // Update local state immediately for better UX
        setLocalPortfolios(prevPortfolios => 
          prevPortfolios.filter(portfolio => portfolio.id !== id)
        );
        onRefresh(); // Also trigger parent refresh
      } else {
        showMessage(data.message || "Failed to delete portfolio", true);
      }
    } catch (error) {
      console.error("Error deleting portfolio:", error);
      showMessage("Error deleting portfolio. Please try again.", true);
    } finally {
      setDeletingId(null);
    }
  };

  // Helper function to get portfolio details accounting for different data structures
  const getPortfolioDetails = (portfolio: Portfolio): PortfolioDetails => {
    if (portfolio.details) {
      return portfolio.details;
    } else if (portfolio.data?.portfolio) {
      return portfolio.data.portfolio;
    } else {
      // Default empty details if none available
      return {
        cash: portfolio.cash || 0,
        holdings: {},
        return: 0
      };
    }
  };

  if (!isLoggedIn) {
    return null; // Will redirect in useEffect
  }

  if (!localPortfolios || localPortfolios.length === 0) {
    return (
      <div className="text-center p-8 bg-gray-100 rounded-lg">
        <p className="text-lg">You don't have any portfolios yet.</p>
        <p className="text-gray-600">Create your first portfolio to start tracking your investments.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {localPortfolios.map((portfolio) => {
        const portfolioDetails = getPortfolioDetails(portfolio);
        const holdingsCount = portfolio.holdings_count || 
                            (portfolioDetails?.holdings ? Object.keys(portfolioDetails.holdings).length : 0);
        
        return (
          <div key={portfolio.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="bg-[#41748D] text-white px-4 py-3 flex justify-between items-center">
              <h3 className="font-normal" style={{ fontFamily: 'Rubik, sans-serif' }}>{portfolio.name}</h3>
              <div className="font-normal text-sm">
                <button
                  onClick={() => handleViewPortfolio(portfolio.id)}
                  className="text-white hover:cursor-pointer mr-4"
                  style={{ fontFamily: 'Rubik, sans-serif' }}
                >
                  View
                </button>
                <button
                  onClick={() => handleDeletePortfolio(portfolio.id)}
                  disabled={deletingId === portfolio.id}
                  className="text-white hover:cursor-pointer"
                  style={{ fontFamily: 'Rubik, sans-serif' }}
                >
                  {deletingId === portfolio.id ? "..." : "Remove"}
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-black">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-center font-medium p-3 border-r" style={{ fontFamily: 'Rubik, sans-serif' }}>Created on</th>
                    <th className="text-center font-medium p-3 border-r" style={{ fontFamily: 'Rubik, sans-serif' }}>Cash</th>
                    <th className="text-center font-medium p-3 border-r" style={{ fontFamily: 'Rubik, sans-serif' }}>Return</th>
                    <th className="text-center font-medium p-3" style={{ fontFamily: 'Rubik, sans-serif' }}>Holdings</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="p-3 border-r text-center" style={{ fontFamily: 'Rubik, sans-serif' }}>
                      {new Date(portfolio.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-3 border-r text-center" style={{ fontFamily: 'Rubik, sans-serif' }}>
                      ₹{(portfolioDetails?.cash || 0).toLocaleString()}
                    </td>
                    <td className={`p-3 border-r text-center ${
                      (portfolioDetails?.return || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                    }`} style={{ fontFamily: 'Rubik, sans-serif' }}>
                      {portfolioDetails?.return !== undefined ? (
                        <>
                          {(portfolioDetails.return || 0) >= 0 ? "+" : ""}
                          {(portfolioDetails.return || 0).toFixed(2)}%
                        </>
                      ) : (
                        "0"
                      )}
                    </td>
                    <td className="p-3 text-center" style={{ fontFamily: 'Rubik, sans-serif' }}>
                      {holdingsCount }
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}