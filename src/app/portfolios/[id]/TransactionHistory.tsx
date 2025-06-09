"use client";
import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, ArrowUpDown } from "lucide-react";

// Updated Transaction interface to match the API response
interface Transaction {
  symbol: string;
  type: string;  // Changed to string to accept "BUY" or "SELL" (uppercase)
  quantity: number;
  price: number;
  timestamp: string;
  id?: number;  // Keep optional id
}

type SortKey = 'timestamp' | 'type' | 'symbol' | 'quantity' | 'price';
type SortDirection = 'asc' | 'desc';

interface TransactionHistoryProps {
  transactions: Transaction[];
  isLoading?: boolean;
  error?: string | null;
}

export default function TransactionHistory({ 
  transactions, 
  isLoading = false,
  error = null
}: TransactionHistoryProps) {
  const [sortConfig, setSortConfig] = useState<{
    key: SortKey;
    direction: SortDirection;
  }>({
    key: 'timestamp',
    direction: 'desc'
  });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Sort transactions with proper type safety
  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => {
      if (sortConfig.key === 'timestamp') {
        try {
          const dateA = new Date(a.timestamp || '').getTime();
          const dateB = new Date(b.timestamp || '').getTime();
          // Handle invalid dates
          if (isNaN(dateA) || isNaN(dateB)) {
            return sortConfig.direction === 'asc' ? 0 : 0;
          }
          return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
        } catch (e) {
          return 0;
        }
      }
      
      if (sortConfig.key === 'type' || sortConfig.key === 'symbol') {
        const valueA = a[sortConfig.key] || '';
        const valueB = b[sortConfig.key] || '';
        return sortConfig.direction === 'asc' 
          ? valueA.localeCompare(valueB) 
          : valueB.localeCompare(valueA);
      }
      
      // For numeric fields (quantity, price)
      const valueA = Number(a[sortConfig.key]) || 0;
      const valueB = Number(b[sortConfig.key]) || 0;
      return sortConfig.direction === 'asc' 
        ? valueA - valueB 
        : valueB - valueA;
    });
  }, [transactions, sortConfig]);

  // Get current page items
  const currentTransactions = useMemo(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return sortedTransactions.slice(indexOfFirstItem, indexOfLastItem);
  }, [sortedTransactions, currentPage, itemsPerPage]);

  // Total pages
  const totalPages = Math.ceil(sortedTransactions.length / itemsPerPage);

  const requestSort = (key: SortKey) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc',
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatDateTime = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      console.error("Error formatting date:", e);
      return timestamp; // Return original timestamp if formatting fails
    }
  };

  // Render sort icon based on current sort state
  const renderSortIcon = (columnKey: SortKey) => {
    if (sortConfig.key !== columnKey) {
      return <ArrowUpDown className="h-4 w-4 ml-1 inline" aria-hidden="true" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="h-4 w-4 ml-1 inline" aria-hidden="true" /> 
      : <ChevronDown className="h-4 w-4 ml-1 inline" aria-hidden="true" />;
  };

  // Handle pagination
  const nextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const prevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  // Empty state
  if (transactions.length === 0 && !isLoading && !error) {
    return (
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6 text-center">
          <p className="text-gray-600" style={{ fontFamily: 'Rubik, sans-serif' }}>No transactions yet.</p>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6 text-center">
          <div className="flex justify-center items-center space-x-2">
            <div className="h-4 w-4 bg-gray-600 rounded-full animate-bounce"></div>
            <div className="h-4 w-4 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="h-4 w-4 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
          <p className="text-gray-600 mt-4" style={{ fontFamily: 'Rubik, sans-serif' }}>Loading transaction history...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6 text-center">
          <p className="text-red-500" style={{ fontFamily: 'Rubik, sans-serif' }}>Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#41748D]">
            <tr>
              <th 
                className="py-3 px-4 text-left" 
                onClick={() => requestSort('timestamp')}
              >
                <button 
                  className="font-medium flex items-center text-white hover:text-white/80 transition-colors"
                  type="button"
                  aria-label={`Sort by date ${sortConfig.key === 'timestamp' ? (sortConfig.direction === 'asc' ? 'descending' : 'ascending') : ''}`}
                  style={{ fontFamily: 'Rubik, sans-serif' }}
                >
                  Date/Time
                  {renderSortIcon('timestamp')}
                </button>
              </th>
              <th 
                className="py-3 px-4 text-left"
                onClick={() => requestSort('type')}
              >
                <button 
                  className="font-medium flex items-center text-white hover:text-white/80 transition-colors"
                  type="button"
                  aria-label={`Sort by type ${sortConfig.key === 'type' ? (sortConfig.direction === 'asc' ? 'descending' : 'ascending') : ''}`}
                  style={{ fontFamily: 'Rubik, sans-serif' }}
                >
                  Type
                  {renderSortIcon('type')}
                </button>
              </th>
              <th 
                className="py-3 px-4 text-left"
                onClick={() => requestSort('symbol')}
              >
                <button 
                  className="font-medium flex items-center text-white hover:text-white/80 transition-colors"
                  type="button"
                  aria-label={`Sort by symbol ${sortConfig.key === 'symbol' ? (sortConfig.direction === 'asc' ? 'descending' : 'ascending') : ''}`}
                  style={{ fontFamily: 'Rubik, sans-serif' }}
                >
                  Symbol
                  {renderSortIcon('symbol')}
                </button>
              </th>
              <th 
                className="py-3 px-4 text-right"
                onClick={() => requestSort('quantity')}
              >
                <button 
                  className="font-medium flex items-center justify-end w-full text-white hover:text-white/80 transition-colors"
                  type="button"
                  aria-label={`Sort by quantity ${sortConfig.key === 'quantity' ? (sortConfig.direction === 'asc' ? 'descending' : 'ascending') : ''}`}
                  style={{ fontFamily: 'Rubik, sans-serif' }}
                >
                  Quantity
                  {renderSortIcon('quantity')}
                </button>
              </th>
              <th 
                className="py-3 px-4 text-right"
                onClick={() => requestSort('price')}
              >
                <button 
                  className="font-medium flex items-center justify-end w-full text-white hover:text-white/80 transition-colors"
                  type="button"
                  aria-label={`Sort by price ${sortConfig.key === 'price' ? (sortConfig.direction === 'asc' ? 'descending' : 'ascending') : ''}`}
                  style={{ fontFamily: 'Rubik, sans-serif' }}
                >
                  Price
                  {renderSortIcon('price')}
                </button>
              </th>
              <th className="py-3 px-4 text-right">
                <span className="font-medium text-white" style={{ fontFamily: 'Rubik, sans-serif' }}>Total</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {currentTransactions.map((transaction, index) => {
              // Ensure quantity and price are numbers 
              const quantity = Number(transaction.quantity) || 0;
              const price = Number(transaction.price) || 0;
              const total = quantity * price;
              
              // Determine if transaction type is buy or sell (case-insensitive)
              const isBuy = transaction.type?.toUpperCase() === 'BUY';
              
              return (
                <tr 
                  key={transaction.id || index} 
                  className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <td className="py-3 px-4 text-gray-800" style={{ fontFamily: 'Rubik, sans-serif' }}>
                    {formatDateTime(transaction.timestamp)}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                      isBuy
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-red-100 text-red-600'
                    }`} style={{ fontFamily: 'Rubik, sans-serif' }}>
                      {transaction.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium text-gray-800" style={{ fontFamily: 'Rubik, sans-serif' }}>
                    {transaction.symbol}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-800" style={{ fontFamily: 'Rubik, sans-serif' }}>
                    {quantity.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-800" style={{ fontFamily: 'Rubik, sans-serif' }}>
                    {formatCurrency(price)}
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-gray-800" style={{ fontFamily: 'Rubik, sans-serif' }}>
                    {formatCurrency(total)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Pagination Controls */}
      {transactions.length > itemsPerPage && (
        <div className="flex justify-between items-center px-4 py-3 bg-gray-50 border-t border-gray-200">
          <div className="text-sm text-gray-600" style={{ fontFamily: 'Rubik, sans-serif' }}>
            Showing {Math.min((currentPage - 1) * itemsPerPage + 1, sortedTransactions.length)} to {Math.min(currentPage * itemsPerPage, sortedTransactions.length)} of {sortedTransactions.length} transactions
          </div>
          <div className="flex space-x-2">
            <button 
              className="bg-[#41748D] hover:bg-[#41748D]/90 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={prevPage} 
              disabled={currentPage === 1}
              style={{ fontFamily: 'Rubik, sans-serif' }}
            >
              Previous
            </button>
            <button 
              className="bg-[#41748D] hover:bg-[#41748D]/90 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={nextPage} 
              disabled={currentPage === totalPages}
              style={{ fontFamily: 'Rubik, sans-serif' }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}