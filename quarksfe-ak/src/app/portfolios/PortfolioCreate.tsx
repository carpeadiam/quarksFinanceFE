import { useState, useEffect } from "react";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import Link from 'next/link';

interface PortfolioCreateProps {
  onCreatePortfolio?: (portfolio: { name: string; initial_cash: number }) => Promise<any>;
  onPortfolioCreated?: (portfolioData: any) => void;
}

export default function PortfolioCreate({ onCreatePortfolio, onPortfolioCreated }: PortfolioCreateProps) {
  const [name, setName] = useState("");
  const [initialCash, setInitialCash] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Check token on component mount
  useEffect(() => {
    const storedToken = localStorage.getItem('quarksFinanceToken');
    setToken(storedToken);
    if (!storedToken) {
      console.warn("No authentication token found in localStorage");
    }
  }, []);

  // Default implementation if onCreatePortfolio is not provided
        const defaultCreatePortfolio = async (data: { name: string; initial_cash: number }) => {
    const apiUrl = 'https://thecodeworks.in/quarksfinance/api/portfolios';
    console.log(`Sending request to: ${apiUrl}`);
    console.log("Request payload:", data);
    
    if (!token) {
      throw new Error("Authentication token not found. Please log in again. (Looking for 'quarksFinanceToken')");
    }
    
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data),
      });
      
      console.log("Response status:", response.status);
      
      if (!response.ok) {
        // Try to get detailed error message from response
        let errorMessage = 'Failed to create portfolio';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
          console.error("API error response:", errorData);
        } catch (e) {
          console.error("Could not parse error response:", e);
        }
        throw new Error(errorMessage);
      }
      
      // Check if response is empty
      const text = await response.text();
      console.log("Raw response text:", text);
      
      if (!text) {
        console.log("Empty response received, but status was OK");
        return { success: true, message: "Portfolio created successfully" };
      }
      
      try {
        const responseData = JSON.parse(text);
        console.log("Success response:", responseData);
        return responseData;
      } catch (e) {
        console.log("Response is not valid JSON:", e);
        return { success: true, message: "Portfolio created", rawResponse: text };
      }
    } catch (e) {
      console.error("Request failed:", e);
      throw e;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      setError("Portfolio name is required");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Parse the initial cash value
      const cashValue = parseFloat(initialCash);
      if (isNaN(cashValue)) {
        throw new Error("Initial cash must be a valid number");
      }
      
      // Use provided onCreatePortfolio function or implement default API call
      const createFn = onCreatePortfolio || defaultCreatePortfolio;
      
      const response = await createFn({
        name,
        initial_cash: cashValue,
      });
      
      console.log("Portfolio created:", response);
      
      // Call the callback if provided
      if (onPortfolioCreated) {
        onPortfolioCreated(response);
      }
      
      // Get portfolio ID safely from the response
      const portfolioId = response && (response.portfolio_id || response.id || response.portfolioId);
      
      // Success message before reload
      alert(`Portfolio "${name}" created successfully!`);
      
      // Log the full response for debugging
      console.log("Full API response:", JSON.stringify(response));
      // Reset form
      setName("");
      setInitialCash("10000");
      
      // Optional: Use a callback or pass information to parent component instead of reloading
      if (window.confirm("Portfolio created successfully! Reload page to see updates?")) {
        // Add a query parameter to force a fresh reload
        window.location.href = window.location.pathname + "?refresh=" + new Date().getTime();
      }
    } catch (error) {
      console.error("Failed to create portfolio:", error);
      setError(error instanceof Error 
        ? error.message 
        : "Failed to create portfolio. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden bg-white border border-gray-200 p-6">
      <h2 className="text-lg  mb-4 flex items-center" style={{ fontFamily: 'Rubik, sans-serif' }}>
        <span className="text-xl mr-6">+</span>
        Add a new Portfolio
      </h2>
      
      <div className="flex items-center gap-4">
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="p-3 text-gray-700 flex-grow border rounded-lg focus:outline-none focus:border-[#41748D]"
          style={{ fontFamily: 'Rubik, sans-serif' }}
        />
        <input
          type="text"
          placeholder="Initial Funds"
          value={initialCash}
          onChange={(e) => setInitialCash(e.target.value)}
          className="p-3 text-gray-700 border rounded-lg focus:outline-none focus:border-[#41748D] w-40"
          style={{ fontFamily: 'Rubik, sans-serif' }}
        />
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !initialCash || !name || !token}
          className="bg-[#41748D] text-white px-6 py-3 rounded hover:bg-[#365f73] disabled:opacity-50"
          style={{ fontFamily: 'Rubik, sans-serif' }}
        >
          {isSubmitting ? "Adding..." : "Add"}
        </button>
      </div>
      
      {error && (
        <div className="mt-4">
          <div className="text-red-500 text-sm p-2 border border-red-300 bg-red-50 rounded-md">
            {error}
          </div>
        </div>
      )}
      
      {!token && (
        <div className="mt-4">
          <div className="bg-yellow-100 p-3 rounded-md text-yellow-800 text-sm">
            No authentication token found. You may need to log in again.
          </div>
        </div>
      )}
    </div>
  );
}