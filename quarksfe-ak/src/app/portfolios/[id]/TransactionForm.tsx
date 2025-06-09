"use client";

import { useState, useEffect } from "react";

interface BuySellComponentProps {
  portfolioId: string;
  token: string;
  onTransactionComplete?: () => void;
}

export default function BuySellComponent({ 
  portfolioId, 
  token,
  onTransactionComplete 
}: BuySellComponentProps) {
  const [symbol, setSymbol] = useState<string>("");
  const [transactionType, setTransactionType] = useState<"buy" | "sell">("buy");
  const [quantity, setQuantity] = useState<number>(0);
  const [priceOption, setPriceOption] = useState<"live" | "historical">("live");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [historicalPrice, setHistoricalPrice] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  
  const baseURL = 'https://thecodeworks.in/quarksfinance/api';

  // Fetch current price when symbol changes and live price is selected
  useEffect(() => {
    if (symbol && priceOption === "live") {
      fetchCurrentPrice();
    }
  }, [symbol, priceOption]);

  // Fetch historical price when date or symbol changes and historical price is selected
  useEffect(() => {
    if (symbol && selectedDate && priceOption === "historical") {
      fetchHistoricalPriceForDate();
    }
  }, [symbol, selectedDate, priceOption]);

  const fetchCurrentPrice = async () => {
    if (!symbol) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`${baseURL}/market/price/${symbol}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          'x-access-token': token,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentPrice(data.current_price || data.price || null);
      } else {
        setCurrentPrice(null);
      }
    } catch (error) {
      console.error(`Error fetching current price for ${symbol}:`, error);
      setCurrentPrice(null);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHistoricalPriceForDate = async () => {
    if (!symbol || !selectedDate) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`${baseURL}/market/historical/${symbol}/${selectedDate}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          'x-access-token': token,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setHistoricalPrice(data.price || data.close_price || data.historical_price || null);
      } else {
        setHistoricalPrice(null);
        setErrorMessage(`Failed to fetch historical price for ${symbol} on ${selectedDate}`);
      }
    } catch (error) {
      console.error(`Error fetching historical price for ${symbol}:`, error);
      setHistoricalPrice(null);
      setErrorMessage(`Error fetching historical price for ${symbol}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getSelectedPrice = () => {
    return priceOption === "live" ? currentPrice : historicalPrice;
  };

  const getTotalValue = () => {
    const price = getSelectedPrice();
    return price ? quantity * price : 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const price = getSelectedPrice();
    if (!symbol || !quantity || !price) {
      setErrorMessage("Please fill in all required fields and ensure price is available");
      return;
    }

    setIsProcessing(true);
    setErrorMessage("");

    try {
      const endpoint = `${baseURL}/portfolios/${portfolioId}/${transactionType}`;
      
      const requestBody: any = {
        symbol: symbol.toUpperCase(),
        quantity
      };
      
      // Add price if using historical price
      if (priceOption === "historical") {
        requestBody.price = price;
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'x-access-token': token,
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        // Reset form
        setSymbol("");
        setQuantity(0);
        setCurrentPrice(null);
        setHistoricalPrice(null);
        setSelectedDate("");
        
        if (onTransactionComplete) {
          onTransactionComplete();
        }
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.message || "Transaction failed");
      }
    } catch (error: any) {
      setErrorMessage(error.message || "Transaction failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(value);
  };

return (
  <div className="max-w-2xl mx-auto">
    {/* Single card container */}
    <div className="bg-white border rounded-lg border border-gray-200 overflow-hidden">
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Header inside the card */}
        <div className="mb-6">
          <h3 className="text-xl font-medium text-gray-800" style={{ fontFamily: 'Rubik, sans-serif' }}>
            {transactionType === "buy" ? "Buy" : "Sell"} Stocks
          </h3>
        </div>

        {/* Transaction Type */}
        <div>
          <label className="block text-sm font-medium mb-3 text-gray-700" style={{ fontFamily: 'Rubik, sans-serif' }}>
            Transaction Type
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setTransactionType("buy")}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                transactionType === "buy" 
                  ? "bg-green-500 text-white hover:bg-green-600" 
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 border"
              }`}
              style={{ fontFamily: 'Rubik, sans-serif' }}
            >
              Buy
            </button>
            <button
              type="button"
              onClick={() => setTransactionType("sell")}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                transactionType === "sell" 
                  ? "bg-red-500 text-white hover:bg-red-600" 
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 border"
              }`}
              style={{ fontFamily: 'Rubik, sans-serif' }}
            >
              Sell
            </button>
          </div>
        </div>

        {/* Symbol */}
        <div>
          <label htmlFor="symbol" className="block text-sm font-medium mb-2 text-gray-700" style={{ fontFamily: 'Rubik, sans-serif' }}>
            Stock Symbol
          </label>
          <input
            type="text"
            id="symbol"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#41748D] focus:border-transparent"
            style={{ fontFamily: 'Rubik, sans-serif' }}
            placeholder="e.g., RELIANCE"
            required
          />
        </div>

        {/* Quantity */}
        <div>
          <label htmlFor="quantity" className="block text-sm font-medium mb-2 text-gray-700" style={{ fontFamily: 'Rubik, sans-serif' }}>
            Quantity
          </label>
          <input
            type="number"
            id="quantity"
            value={quantity || ""}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#41748D] focus:border-transparent"
            style={{ fontFamily: 'Rubik, sans-serif' }}
            min="1"
            required
          />
        </div>

        {/* Price Option */}
        <div>
          <label className="block text-sm font-medium mb-3 text-gray-700" style={{ fontFamily: 'Rubik, sans-serif' }}>
            Price Option
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setPriceOption("live")}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                priceOption === "live" 
                  ? "bg-[#41748D] text-white hover:bg-[#365f73]" 
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 border"
              }`}
              style={{ fontFamily: 'Rubik, sans-serif' }}
            >
              Use Live Market Price
            </button>
            <button
              type="button"
              onClick={() => setPriceOption("historical")}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                priceOption === "historical" 
                  ? "bg-[#41748D] text-white hover:bg-[#365f73]" 
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 border"
              }`}
              style={{ fontFamily: 'Rubik, sans-serif' }}
            >
              Use Historical Price
            </button>
          </div>
        </div>

        {/* Date Selection for Historical Price */}
        {priceOption === "historical" && (
          <div>
            <label htmlFor="date" className="block text-sm font-medium mb-2 text-gray-700" style={{ fontFamily: 'Rubik, sans-serif' }}>
              Select Date
            </label>
            <input
              type="date"
              id="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#41748D] focus:border-transparent"
              style={{ fontFamily: 'Rubik, sans-serif' }}
              max={new Date().toISOString().split('T')[0]}
              required
            />
          </div>
        )}

        {/* Price Display */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700" style={{ fontFamily: 'Rubik, sans-serif' }}>
            {priceOption === "live" ? "Current Price" : "Historical Price"}
          </label>
          <div className="px-4 py-3 border border-gray-300 rounded-lg bg-gray-50">
            {isLoading ? (
              <span className="text-gray-500" style={{ fontFamily: 'Rubik, sans-serif' }}>Loading price...</span>
            ) : (
              <span className="font-medium text-gray-800" style={{ fontFamily: 'Rubik, sans-serif' }}>
                {getSelectedPrice() ? formatCurrency(getSelectedPrice()!) : "Price not available"}
              </span>
            )}
          </div>
        </div>

        {/* Total Value */}
        {quantity > 0 && getSelectedPrice() && (
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700" style={{ fontFamily: 'Rubik, sans-serif' }}>
              Total Value
            </label>
            <div className="px-4 py-3 border border-gray-300 rounded-lg bg-[#ffffff] bg-opacity-10">
              <span className="font-medium text-lg text-[#41748D]" style={{ fontFamily: 'Rubik, sans-serif' }}>
                {formatCurrency(getTotalValue())}
              </span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-200" style={{ fontFamily: 'Rubik, sans-serif' }}>
            {errorMessage}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isProcessing || !symbol || !quantity || !getSelectedPrice()}
          className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
            transactionType === "buy"
              ? "bg-green-500 hover:bg-green-600 text-white"
              : "bg-red-500 hover:bg-red-600 text-white"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          style={{ fontFamily: 'Rubik, sans-serif' }}
        >
          {isProcessing ? "Processing..." : `${transactionType === "buy" ? "Buy" : "Sell"} Stocks`}
        </button>
      </form>
    </div>
  </div>
);
}