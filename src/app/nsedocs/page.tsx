'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navbar from '../../components/navigation/Navbar';
const nseSymbols = [
  { symbol: 'RELIANCE', name: 'Reliance Industries Limited' },
  { symbol: 'TCS', name: 'Tata Consultancy Services Limited' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Limited' },
  { symbol: 'INFY', name: 'Infosys Limited' },
  { symbol: 'HINDUNILVR', name: 'Hindustan Unilever Limited' },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Limited' },
  { symbol: 'ITC', name: 'ITC Limited' },
  { symbol: 'SBIN', name: 'State Bank of India' },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel Limited' },
  { symbol: 'LT', name: 'Larsen & Toubro Limited' },
  { symbol: 'HDFC', name: 'Housing Development Finance Corporation Limited' },
  { symbol: 'INDIGO', name: 'InterGlobe Aviation Limited' },
  { symbol: 'ZOMATO', name: 'Zomato Limited' },
  { symbol: 'PAYTM', name: 'One97 Communications Limited' },
  { symbol: 'IRCTC', name: 'Indian Railway Catering And Tourism Corporation Limited' },
  { symbol: 'DMART', name: 'Avenue Supermarts Limited' },
  { symbol: 'PIDILITIND', name: 'Pidilite Industries Limited' },
  { symbol: 'AMBUJACEM', name: 'Ambuja Cements Limited' },
  { symbol: 'ACC', name: 'ACC Limited' },
  { symbol: 'GAIL', name: 'GAIL (India) Limited' },
  { symbol: 'HAL', name: 'Hindustan Aeronautics Limited' },
  { symbol: 'BEL', name: 'Bharat Electronics Limited' },
  { symbol: 'BHEL', name: 'Bharat Heavy Electricals Limited' },
  { symbol: 'TATAPOWER', name: 'Tata Power Company Limited' },
  { symbol: 'SIEMENS', name: 'Siemens Limited' },
  { symbol: 'ABB', name: 'ABB India Limited' },
  { symbol: 'LUPIN', name: 'Lupin Limited' },
  { symbol: 'TORNTPHARM', name: 'Torrent Pharmaceuticals Limited' },
  { symbol: 'GLENMARK', name: 'Glenmark Pharmaceuticals Limited' },
  { symbol: 'CADILAHC', name: 'Zydus Lifesciences Limited' },
  { symbol: 'BIOCON', name: 'Biocon Limited' },
  { symbol: 'AUROPHARMA', name: 'Aurobindo Pharma Limited' },
  { symbol: 'DABUR', name: 'Dabur India Limited' },
  { symbol: 'GODREJCP', name: 'Godrej Consumer Products Limited' },
  { symbol: 'MARICO', name: 'Marico Limited' },
  { symbol: 'COLPAL', name: 'Colgate-Palmolive (India) Limited' },
  { symbol: 'PGHH', name: 'Procter & Gamble Hygiene and Health Care Limited' },
  { symbol: 'GILLETTE', name: 'Gillette India Limited' },
  { symbol: 'PAGEIND', name: 'Page Industries Limited' },
  { symbol: 'WHIRLPOOL', name: 'Whirlpool of India Limited' },
  { symbol: 'HAVELLS', name: 'Havells India Limited' },
  { symbol: 'CROMPTON', name: 'Crompton Greaves Consumer Electricals Limited' },
  { symbol: 'VOLTAS', name: 'Voltas Limited' },
  { symbol: 'BLUEDART', name: 'Blue Dart Express Limited' },
  { symbol: 'DELHIVERY', name: 'Delhivery Limited' },
  { symbol: 'NAUKRI', name: 'Info Edge (India) Limited' },
  { symbol: 'JUBLFOOD', name: 'Jubilant Foodworks Limited' },
  { symbol: 'VBL', name: 'Varun Beverages Limited' },
  { symbol: 'UBL', name: 'United Breweries Limited' },
  { symbol: 'MCDOWELL-N', name: 'United Spirits Limited' },
  { symbol: 'ITDC', name: 'India Tourism Development Corporation Limited' },
  { symbol: 'MAHABANK', name: 'Bank of Maharashtra' },
  { symbol: 'PNB', name: 'Punjab National Bank' },
  { symbol: 'BANKBARODA', name: 'Bank of Baroda' },
  { symbol: 'CANBK', name: 'Canara Bank' },
  { symbol: 'UNIONBANK', name: 'Union Bank of India' },
  { symbol: 'IDBI', name: 'IDBI Bank Limited' },
  { symbol: 'IDFCFIRSTB', name: 'IDFC First Bank Limited' },
  { symbol: 'FEDERALBNK', name: 'The Federal Bank Limited' },
  { symbol: 'RBLBANK', name: 'RBL Bank Limited' },
  { symbol: 'YESBANK', name: 'Yes Bank Limited' },
  { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank Limited' },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance Limited' },
  { symbol: 'BAJAJFINSV', name: 'Bajaj Finserv Limited' },
  { symbol: 'HCLTECH', name: 'HCL Technologies Limited' },
  { symbol: 'ASIANPAINT', name: 'Asian Paints Limited' },
  { symbol: 'TITAN', name: 'Titan Company Limited' },
  { symbol: 'NESTLEIND', name: 'Nestle India Limited' },
  { symbol: 'POWERGRID', name: 'Power Grid Corporation of India Limited' },
  { symbol: 'NTPC', name: 'NTPC Limited' },
  { symbol: 'ULTRACEMCO', name: 'UltraTech Cement Limited' },
  { symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical Industries Limited' },
  { symbol: 'ONGC', name: 'Oil & Natural Gas Corporation Limited' },
  { symbol: 'IOC', name: 'Indian Oil Corporation Limited' },
  { symbol: 'COALINDIA', name: 'Coal India Limited' },
  { symbol: 'GRASIM', name: 'Grasim Industries Limited' },
  { symbol: 'JSWSTEEL', name: 'JSW Steel Limited' },
  { symbol: 'TATASTEEL', name: 'Tata Steel Limited' },
  { symbol: 'DRREDDY', name: 'Dr. Reddy\'s Laboratories Limited' },
  { symbol: 'CIPLA', name: 'Cipla Limited' },
  { symbol: 'HDFCLIFE', name: 'HDFC Life Insurance Company Limited' },
  { symbol: 'SBILIFE', name: 'SBI Life Insurance Company Limited' },
  { symbol: 'HINDALCO', name: 'Hindalco Industries Limited' },
  { symbol: 'WIPRO', name: 'Wipro Limited' },
  { symbol: 'ADANIPORTS', name: 'Adani Ports and Special Economic Zone Limited' },
  { symbol: 'TECHM', name: 'Tech Mahindra Limited' },
  { symbol: 'AXISBANK', name: 'Axis Bank Limited' },
  { symbol: 'MARUTI', name: 'Maruti Suzuki India Limited' },
  { symbol: 'UPL', name: 'UPL Limited' },
  { symbol: 'BPCL', name: 'Bharat Petroleum Corporation Limited' },
  { symbol: 'HEROMOTOCO', name: 'Hero MotoCorp Limited' },
  { symbol: 'INDUSINDBK', name: 'IndusInd Bank Limited' },
  { symbol: 'DIVISLAB', name: 'Divi\'s Laboratories Limited' },
  { symbol: 'EICHERMOT', name: 'Eicher Motors Limited' },
  { symbol: 'BRITANNIA', name: 'Britannia Industries Limited' },
  { symbol: 'VEDL', name: 'Vedanta Limited' },
  { symbol: 'SHREECEM', name: 'Shree Cement Limited' },
  { symbol: 'BAJAJ-AUTO', name: 'Bajaj Auto Limited' },
  { symbol: 'TATAMOTORS', name: 'Tata Motors Limited' },
  { symbol: 'M&M', name: 'Mahindra & Mahindra Limited' },
  { symbol: 'TATACONSUM', name: 'Tata Consumer Products Limited' },
  { symbol: 'APOLLOHOSP', name: 'Apollo Hospitals Enterprise Limited' },
  { symbol: 'ADANIENT', name: 'Adani Enterprises Limited' },
  { symbol: 'ADANIGREEN', name: 'Adani Green Energy Limited' },
  { symbol: 'ADANITRANS', name: 'Adani Transmission Limited' },
];

export default function NSESymbolsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterChar, setFilterChar] = useState<string>('');
  
  const filteredSymbols = nseSymbols
    .filter(symbol => {
      const matchesSearch = symbol.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         symbol.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesChar = filterChar ? symbol.symbol.startsWith(filterChar) : true;
      return matchesSearch && matchesChar;
    })
    .sort((a, b) => {
      if (sortOrder === 'asc') {
        return a.symbol.localeCompare(b.symbol);
      } else {
        return b.symbol.localeCompare(a.symbol);
      }
    });

  return (
    <main className="min-h-screen bg-white" style={{ fontFamily: 'Rubik, sans-serif'}}>
      <Navbar />
      
<nav className="px-6 mt-4 flex items-center gap-4 text-sm">
        <Link href="/home" className="text-black text-2xl" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>Home</Link>
        <span className="text-black text-2xl" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>&gt;</span>
        <Link href="/nsedocs" className="text-black text-2xl" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>NSE Symbols</Link>

      </nav>
      
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-12">
          <br></br>
          <br></br>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">NSE Symbols</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Search and browse all NSE listed company symbols
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto mb-12 bg-white p-8 rounded-xl  border border-gray-200">
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <input
                type="text"
                placeholder="Search by symbol or company name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 shadow-sm text-gray-800 bg-gray-50"
              />
            </div>
            
            <div>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 shadow-sm text-gray-800 bg-gray-50"
              >
                <option value="asc">Sort A-Z</option>
                <option value="desc">Sort Z-A</option>
              </select>
            </div>
            
            <div>
              <select
                value={filterChar}
                onChange={(e) => setFilterChar(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 shadow-sm text-gray-800 bg-gray-50"
              >
                <option value="">Filter by starting letter</option>
                {[...Array(26)].map((_, i) => (
                  <option key={i} value={String.fromCharCode(65 + i)}>
                    {String.fromCharCode(65 + i)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Symbol</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company Name</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSymbols.map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.symbol}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}