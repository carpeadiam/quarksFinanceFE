// src/types/portfolio.ts

export interface Holding {
  quantity: number;
  avg_price: number;
  average_cost?: number; // Keep for backward compatibility
  current_price?: number | null; // Allow for null to indicate price not available
}

export interface HoldingWithSymbol extends Holding {
  symbol: string;
  quantity: number;
  avg_price: number;
  current_price: number | null; // Required in the derived interface but allows null
}

export interface Transaction {
  price: number;
  quantity: number;
  symbol: string;
  timestamp: string;
  type: string;
}

export interface PortfolioDetails {
  cash: number;
  holdings: Record<string, Holding>;
  logs: string[];
  performance_images: string[];
  return: number;
  transactions: Transaction[];
}

export interface Portfolio {
  created_at: string;
  details: PortfolioDetails;
  id: number;
  images: string[];
  name: string;
  raw_data: any; // Using any for raw_data as it's complex and we don't access it directly
  type: string;
  user_id: number;
}