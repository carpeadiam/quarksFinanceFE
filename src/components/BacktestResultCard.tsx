import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

type Transaction = {
  type: string;
  symbol: string;
  quantity: number;
  price: number;
  timestamp: string;
  pl?: number;
};

type BacktestResult = {
  return: number;
  transactions: Transaction[];
  graph_path: string;
  price_history: Record<string, number>;
};

type BacktestResultCardProps = {
  result: BacktestResult;
  strategyType: string;
};

export default function BacktestResultCard({ result, strategyType = 'BOLLINGER' }: BacktestResultCardProps) {
  const [activeTab, setActiveTab] = useState('simulation');
  const [simulationIndex, setSimulationIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState(500); // ms per step
  const simulationInterval = useRef<NodeJS.Timeout | null>(null);
  
  // Add state for modal and zoom
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Format timestamp from transaction
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Calculate total profit/loss
  const totalPL = result.transactions
    .filter(t => t.type === 'SELL' && t.pl !== undefined)
    .reduce((sum, t) => sum + (t.pl || 0), 0);

  // Get dates and prices as arrays
  const dates = Object.keys(result.price_history);
  const prices = Object.values(result.price_history);
  
  // Get the symbol from the first transaction
  const symbol = result.transactions.length > 0 ? result.transactions[0].symbol : 'Stock';

  // Map transactions to dates for simulation
  const transactionsByDate = new Map<string, Transaction[]>();
  result.transactions.forEach(transaction => {
    // Extract just the date part from the timestamp (YYYY-MM-DD)
    const datePart = transaction.timestamp.split(' ')[0];
    if (!transactionsByDate.has(datePart)) {
      transactionsByDate.set(datePart, []);
    }
    transactionsByDate.get(datePart)?.push(transaction);
  });

  // Prepare data for simulation chart
  const simulationData = {
    labels: dates.slice(0, simulationIndex + 1).map(date => formatDate(date)),
    datasets: [
      {
        label: 'Price',
        data: prices.slice(0, simulationIndex + 1),
        borderColor: 'rgb(75, 85, 99)',
        backgroundColor: 'rgba(75, 85, 99, 0.5)',
        tension: 0.1,
        // Add point styling for transactions
        pointRadius: (ctx: any) => {
          const pointDate = dates[ctx.dataIndex];
          const transactions = transactionsByDate.get(pointDate);
          return transactions && transactions.length > 0 ? 6 : 0;
        },
        pointBackgroundColor: (ctx: any) => {
          const pointDate = dates[ctx.dataIndex];
          const transactions = transactionsByDate.get(pointDate);
          if (transactions && transactions.length > 0) {
            // Use green for buy, red for sell
            // If there are both buy and sell on the same day, prioritize buy
            const hasBuy = transactions.some(t => t.type === 'BUY');
            return hasBuy ? '#059669' : '#DC2626';
          }
          return 'rgba(0, 0, 0, 0)';
        },
        pointBorderColor: (ctx: any) => {
          const pointDate = dates[ctx.dataIndex];
          const transactions = transactionsByDate.get(pointDate);
          if (transactions && transactions.length > 0) {
            const hasBuy = transactions.some(t => t.type === 'BUY');
            return hasBuy ? '#059669' : '#DC2626';
          }
          return 'rgba(0, 0, 0, 0)';
        },
        pointBorderWidth: 2,
        pointHoverRadius: 8,
      },
    ],
  };

  // Get transactions up to current simulation point
  const currentTransactions = result.transactions.filter(t => {
    const transactionDate = t.timestamp.split(' ')[0];
    return dates.indexOf(transactionDate) <= simulationIndex;
  });

  // Control simulation playback
  useEffect(() => {
    if (isPlaying) {
      simulationInterval.current = setInterval(() => {
        setSimulationIndex(prev => {
          if (prev < dates.length - 1) {
            return prev + 1;
          } else {
            setIsPlaying(false);
            return prev;
          }
        });
      }, simulationSpeed);
    } else if (simulationInterval.current) {
      clearInterval(simulationInterval.current);
    }

    return () => {
      if (simulationInterval.current) {
        clearInterval(simulationInterval.current);
      }
    };
  }, [isPlaying, simulationSpeed, dates.length]);

  // Add keyboard event listener for Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        setIsModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  // Chart options with transaction annotations
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: false,
        grid: {
          color: 'rgba(229, 231, 235, 0.5)'
        },
        ticks: {
          color: '#4B5563'
        }
      },
      x: {
        grid: {
          color: 'rgba(229, 231, 235, 0.5)'
        },
        ticks: {
          color: '#4B5563',
          maxRotation: 45,
          minRotation: 45
        }
      }
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          afterLabel: function(context: any) {
            const pointDate = dates[context.dataIndex];
            const transactions = transactionsByDate.get(pointDate);
            if (transactions && transactions.length > 0) {
              return transactions.map(t => 
                `${t.type}: ${t.quantity} @ ${t.price.toFixed(2)}`
              );
            }
            return '';
          }
        }
      }
    },
  };

  // Modal chart options with zoom
  const modalChartOptions = {
    ...chartOptions,
    scales: {
      ...chartOptions.scales,
      x: {
        ...chartOptions.scales.x,
        min: dates.length > 20 ? dates.length - 20 * zoomLevel : 0,
        max: dates.length - 1,
      }
    },
  };

  const exportAsImage = async () => {
    if (!result) return;
    
    try {
      // Create a canvas element
      const canvas = document.createElement('canvas');
      const width = 900;
      const height = 1100;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');
      
      // Now TypeScript knows ctx is definitely CanvasRenderingContext2D
      // Set clean white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      
      // Add subtle border
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      ctx.strokeRect(10, 10, width - 20, height - 20);
      
      // Load and draw logo as watermark
      const logoImg = new window.Image();
      logoImg.src = '/images/logo.svg';
      await new Promise((resolve, reject) => {
        logoImg.onload = resolve;
        logoImg.onerror = reject;
      });
      
      // Draw logo as semi-transparent watermark in the center
      ctx.globalAlpha = 0.05;
      const logoSize = 300;
      ctx.drawImage(logoImg, (width - logoSize) / 2, (height - logoSize) / 2, logoSize, logoSize);
      ctx.globalAlpha = 1.0;
      
      // Draw header with stock symbol and backtest results
      ctx.font = 'bold 32px Arial';
      ctx.fillStyle = '#111827';
      ctx.textAlign = 'center';
      ctx.fillText(`${symbol} Backtest Results`, width / 2, 60);
      
      // Draw performance metrics
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      const returnText = `Return: ${(result.return * 100).toFixed(2)}%`;
      const plText = `P/L: ₹${totalPL.toFixed(2)}`;
      ctx.fillStyle = result.return >= 0 ? '#059669' : '#DC2626';
      ctx.fillText(returnText, width / 2 - 100, 100);
      ctx.fillStyle = totalPL >= 0 ? '#059669' : '#DC2626';
      ctx.fillText(plText, width / 2 + 100, 100);
      
      // Use the strategy type from props
      let strategyTypeToUse = strategyType;
      
      // ===== ALGORITHM SECTION =====
      let y = 150;
      ctx.fillStyle = '#4B5563';
      ctx.font = 'bold 22px Arial';
      ctx.textAlign = 'left';
      ctx.fillText('Trading Algorithm', 50, y);
      
      // Draw horizontal line
      y += 10;
      ctx.strokeStyle = '#E5E7EB';
      ctx.beginPath();
      ctx.moveTo(50, y);
      ctx.lineTo(width - 50, y);
      ctx.stroke();
      
      // Draw algorithm name with prominent styling
      y += 30;
      ctx.fillStyle = '#4338CA'; // Indigo color for emphasis
      ctx.font = 'bold 24px Arial';
      ctx.fillText(strategyTypeToUse, 50, y);
      
      // Add strategy description based on type
      let strategyDescription = '';
      switch(strategyTypeToUse) {
        case 'BOLLINGER':
          strategyDescription = 'Bollinger Bands strategy uses standard deviations to determine overbought and oversold conditions.';
          break;
        case 'MACD':
          strategyDescription = 'MACD strategy uses moving average convergence/divergence to identify momentum changes.';
          break;
        case 'RSI':
          strategyDescription = 'RSI strategy uses the Relative Strength Index to identify overbought and oversold conditions.';
          break;
        case 'SMA':
          strategyDescription = 'Simple Moving Average strategy uses crossovers of different period SMAs to generate signals.';
          break;
        case 'QUARKS':
          strategyDescription = 'Quarks algorithm uses proprietary AI-powered technical analysis to identify optimal entry and exit points.';
          break;
        default:
          strategyDescription = 'Custom trading strategy based on technical analysis.';
      }
      
      // Draw wrapped strategy description with improved styling
      ctx.fillStyle = '#6B7280'; // Medium gray for description
      ctx.font = '16px Arial';
      y += 30;
      const maxWidth = width - 100;
      const lineHeight = 24;
      const words = strategyDescription.split(' ');
      let line = '';
      
      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && i > 0) {
          ctx.fillText(line, 50, y);
          line = words[i] + ' ';
          y += lineHeight;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, 50, y);
      y += lineHeight + 20;
      
      // ===== BASIC DETAILS SECTION =====
      ctx.fillStyle = '#4B5563';
      ctx.font = 'bold 22px Arial';
      ctx.textAlign = 'left';
      ctx.fillText('Basic Details', 50, y);
      
      // Draw horizontal line
      y += 10;
      ctx.strokeStyle = '#E5E7EB';
      ctx.beginPath();
      ctx.moveTo(50, y);
      ctx.lineTo(width - 50, y);
      ctx.stroke();
      
      // Draw details with improved layout
      ctx.font = '16px Arial';
      ctx.fillStyle = '#4B5563';
      const startDate = dates.length > 0 ? formatDate(dates[0]) : 'N/A';
      const endDate = dates.length > 0 ? formatDate(dates[dates.length - 1]) : 'N/A';
      
      // Left column
      y += 30;
      ctx.textAlign = 'left';
      ctx.fillText(`Symbol:`, 50, y);
      ctx.fillText(`${symbol}`, 200, y);
      
      y += 30;
      ctx.fillText(`Start Date:`, 50, y);
      ctx.fillText(`${startDate}`, 200, y);
      
      y += 30;
      ctx.fillText(`End Date:`, 50, y);
      ctx.fillText(`${endDate}`, 200, y);
      
      // Right column
      const rightColumnY = y - 60;
      ctx.fillText(`Total Transactions:`, 450, rightColumnY);
      ctx.fillText(`${result.transactions.length}`, 650, rightColumnY);
      
      ctx.fillText(`Buy Transactions:`, 450, rightColumnY + 30);
      ctx.fillText(`${result.transactions.filter(t => t.type === 'BUY').length}`, 650, rightColumnY + 30);
      
      ctx.fillText(`Sell Transactions:`, 450, rightColumnY + 60);
      ctx.fillText(`${result.transactions.filter(t => t.type === 'SELL').length}`, 650, rightColumnY + 60);
      
      // ===== PRICE HISTORY SECTION =====
      y += 50;
      ctx.fillStyle = '#4B5563';
      ctx.font = 'bold 22px Arial';
      ctx.textAlign = 'left';
      ctx.fillText('Price History', 50, y);
      
      // Draw horizontal line
      y += 10;
      ctx.strokeStyle = '#E5E7EB';
      ctx.beginPath();
      ctx.moveTo(50, y);
      ctx.lineTo(width - 50, y);
      ctx.stroke();
      
      // Draw chart background
      y += 20;
      ctx.fillStyle = '#F9FAFB';
      ctx.fillRect(50, y, width - 100, 300);
      ctx.strokeStyle = '#E5E7EB';
      ctx.strokeRect(50, y, width - 100, 300);
      
      // Draw price line
      if (prices.length > 0) {
        const chartWidth = width - 120;
        const chartHeight = 280;
        const chartX = 60;
        const chartY = y + 10;
        
        // Find min and max prices for scaling
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const priceRange = maxPrice - minPrice;
        
        // Draw grid lines
        ctx.strokeStyle = '#E5E7EB';
        ctx.lineWidth = 0.5;
        
        // Horizontal grid lines (price)
        for (let i = 0; i <= 4; i++) {
          const gridY = chartY + chartHeight - (i * chartHeight / 4);
          ctx.beginPath();
          ctx.moveTo(chartX, gridY);
          ctx.lineTo(chartX + chartWidth, gridY);
          ctx.stroke();
          
          // Price labels
          const price = minPrice + (priceRange * i / 4);
          ctx.fillStyle = '#6B7280';
          ctx.font = '12px Arial';
          ctx.textAlign = 'right';
          ctx.fillText(`₹${price.toFixed(2)}`, chartX - 5, gridY + 4);
        }
        
        // Vertical grid lines (dates)
        const dateStep = Math.max(1, Math.floor(dates.length / 5));
        for (let i = 0; i < dates.length; i += dateStep) {
          const x = chartX + (i * chartWidth / (dates.length - 1));
          ctx.beginPath();
          ctx.moveTo(x, chartY);
          ctx.lineTo(x, chartY + chartHeight);
          ctx.stroke();
          
          // Date labels
          if (i % dateStep === 0) {
            ctx.fillStyle = '#6B7280';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(formatDate(dates[i]), x, chartY + chartHeight + 20);
          }
        }
        
        // Draw price line
        ctx.beginPath();
        ctx.moveTo(
          chartX,
          chartY + chartHeight - ((prices[0] - minPrice) / priceRange * chartHeight)
        );
        
        for (let i = 1; i < prices.length; i++) {
          const x = chartX + (i * chartWidth / (prices.length - 1));
          const gridY = chartY + chartHeight - ((prices[i] - minPrice) / priceRange * chartHeight);
          ctx.lineTo(x, gridY);
        }
        
        ctx.strokeStyle = '#4B5563';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw buy/sell indicators
        const buySymbol = '▲'; // Upward triangle for buy
        const sellSymbol = '▼'; // Downward triangle for sell
        
        // Draw legend
        ctx.font = '16px Arial';
        ctx.fillStyle = '#059669';
        ctx.textAlign = 'left';
        // Change from y + 320 to y + 335 to move it lower
        ctx.fillText(`${buySymbol} Buy`, 60, y + 335);
        
        ctx.fillStyle = '#DC2626';
        // Change from y + 320 to y + 335 to move it lower
        ctx.fillText(`${sellSymbol} Sell`, 150, y + 335);
        
        // Draw transaction indicators
        result.transactions.forEach(transaction => {
          const datePart = transaction.timestamp.split(' ')[0];
          const dateIndex = dates.indexOf(datePart);
          
          if (dateIndex >= 0) {
            const x = chartX + (dateIndex * chartWidth / (dates.length - 1));
            const indicatorY = chartY + chartHeight - ((prices[dateIndex] - minPrice) / priceRange * chartHeight);
            
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            
            if (transaction.type === 'BUY') {
              ctx.fillStyle = '#059669';
              ctx.fillText(buySymbol, x, indicatorY - 10);
            } else {
              ctx.fillStyle = '#DC2626';
              ctx.fillText(sellSymbol, x, indicatorY + 20);
            }
          }
        });
      }
      
      // ===== PERFORMANCE SUMMARY SECTION =====
      y += 375;
      ctx.fillStyle = '#4B5563';
      ctx.font = 'bold 22px Arial';
      ctx.textAlign = 'left';
      ctx.fillText('Performance Summary', 50, y);
      
      // Draw horizontal line
      y += 10;
      ctx.strokeStyle = '#E5E7EB';
      ctx.beginPath();
      ctx.moveTo(50, y);
      ctx.lineTo(width - 50, y);
      ctx.stroke();
      
      // Draw summary boxes
      y += 20;
      const boxWidth = (width - 120) / 2;
      
      // Return Statistics Box
      ctx.fillStyle = '#F9FAFB';
      ctx.fillRect(50, y, boxWidth, 180);
      ctx.strokeStyle = '#E5E7EB';
      ctx.strokeRect(50, y, boxWidth, 180);
      
      ctx.fillStyle = '#111827';
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'left';
      ctx.fillText('Return Statistics', 70, y + 30);
      
      ctx.font = '16px Arial';
      ctx.fillText('Total Return:', 70, y + 60);
      ctx.fillText('Total P/L:', 70, y + 90);
      ctx.fillText('Total Transactions:', 70, y + 120);
      ctx.fillText('Buy Transactions:', 70, y + 150);
      
      ctx.textAlign = 'right';
      ctx.fillStyle = result.return >= 0 ? '#059669' : '#DC2626';
      ctx.fillText(`${(result.return * 100).toFixed(2)}%`, 50 + boxWidth - 20, y + 60);
      
      ctx.fillStyle = totalPL >= 0 ? '#059669' : '#DC2626';
      ctx.fillText(`₹${totalPL.toFixed(2)}`, 50 + boxWidth - 20, y + 90);
      
      ctx.fillStyle = '#111827';
      ctx.fillText(`${result.transactions.length}`, 50 + boxWidth - 20, y + 120);
      ctx.fillText(`${result.transactions.filter(t => t.type === 'BUY').length}`, 50 + boxWidth - 20, y + 150);
      
      // Price Statistics Box
      ctx.fillStyle = '#F9FAFB';
      ctx.fillRect(70 + boxWidth, y, boxWidth, 180);
      ctx.strokeStyle = '#E5E7EB';
      ctx.strokeRect(70 + boxWidth, y, boxWidth, 180);
      
      ctx.fillStyle = '#111827';
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'left';
      ctx.fillText('Price Statistics', 90 + boxWidth, y + 30);
      
      ctx.font = '16px Arial';
      ctx.fillText('Starting Price:', 90 + boxWidth, y + 60);
      ctx.fillText('Ending Price:', 90 + boxWidth, y + 90);
      ctx.fillText('Highest Price:', 90 + boxWidth, y + 120);
      ctx.fillText('Lowest Price:', 90 + boxWidth, y + 150);
      
      ctx.textAlign = 'right';
      ctx.fillStyle = '#111827';
      ctx.fillText(`₹${prices[0].toFixed(2)}`, 70 + boxWidth * 2 - 20, y + 60);
      ctx.fillText(`₹${prices[prices.length - 1].toFixed(2)}`, 70 + boxWidth * 2 - 20, y + 90);
      ctx.fillText(`₹${Math.max(...prices).toFixed(2)}`, 70 + boxWidth * 2 - 20, y + 120);
      ctx.fillText(`₹${Math.min(...prices).toFixed(2)}`, 70 + boxWidth * 2 - 20, y + 150);
      
      // Draw footer
      ctx.fillStyle = '#6B7280';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      const today = new Date();
      const dateStr = today.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      ctx.fillText(`Generated on ${dateStr} | Quarks Finance`, width / 2, height - 30);
      
      // Convert canvas to image and trigger download
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `Backtest_${symbol}_${new Date().toISOString().split('T')[0].replace(/-/g, '')}.png`;
      link.href = dataUrl;
      link.click();
      
    } catch (err) {
      console.error('Error creating canvas image:', err);
      alert('Failed to export image. Please try again.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl border border-gray-200 overflow-hidden" style={{ fontFamily: 'Rubik, sans-serif'}}>
      <div className="p-8 border-b bg-white">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold text-gray-900">{symbol} Backtest Results</h2>
          <div className="flex items-center space-x-2">
            <span className={`text-lg font-semibold ${totalPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalPL >= 0 ? '+' : ''}₹{totalPL.toFixed(2)}
            </span>
            <span className={`text-sm font-medium ${result.return >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ({(result.return * 100).toFixed(2)}%)
            </span>
          </div>
        </div>
        
        <div className="mt-6">
          <div className="flex border-b">
            <button
              className={`px-4 py-2 font-medium text-sm ${activeTab === 'simulation' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('simulation')}
            >
              Simulation
            </button>
            <button
              className={`px-4 py-2 font-medium text-sm ${activeTab === 'summary' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('summary')}
            >
              Summary
            </button>
            <button
              className={`px-4 py-2 font-medium text-sm ${activeTab === 'transactions' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('transactions')}
            >
              Transactions
            </button>
            
            {/* Add Export Button */}
            <button
              className="ml-auto px-4 py-2 text-white text-sm font-medium rounded bg-[#DC4040] hover:bg-[#b93830] transition-colors"
              onClick={exportAsImage}
            >
              Export as Image
            </button>
          </div>
        </div>
      </div>

      <div className="p-8">
        {activeTab === 'simulation' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-semibold text-gray-900">Strategy Simulation</h3>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">Speed:</label>
                  <select 
                    value={simulationSpeed}
                    onChange={(e) => setSimulationSpeed(Number(e.target.value))}
                    className="border rounded px-2 py-1 text-sm font-medium bg-white text-gray-800 border-gray-300 focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                  >
                    <option value="1000" className="font-medium">Slow</option>
                    <option value="500" className="font-medium">Normal</option>
                    <option value="200" className="font-medium">Fast</option>
                    <option value="50" className="font-medium">Very Fast</option>
                  </select>
                </div>
                <button 
                  onClick={() => setSimulationIndex(0)}
                  className="p-2 text-gray-600 hover:text-gray-900"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.707-10.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L9.414 11H13a1 1 0 100-2H9.414l1.293-1.293z" clipRule="evenodd" />
                  </svg>
                </button>
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-2 text-gray-600 hover:text-gray-900"
                >
                  {isPlaying ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <div 
                  className="bg-gray-50 p-4 rounded-lg shadow-sm h-80 cursor-pointer relative"
                  onClick={() => setIsModalOpen(true)}
                >
                  <Line data={simulationData} options={chartOptions} />
                  {/* Add a hint that the chart is clickable */}
                  <div className="absolute top-2 right-2 text-xs text-gray-500 bg-white px-2 py-1 rounded-md shadow-sm">
                    Click to expand
                  </div>
                </div>
                <div className="mt-4 flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    {simulationIndex < dates.length ? formatDate(dates[simulationIndex]) : 'Simulation Complete'}
                  </span>
                  <input 
                    type="range" 
                    min="0" 
                    max={dates.length - 1} 
                    value={simulationIndex}
                    onChange={(e) => setSimulationIndex(Number(e.target.value))}
                    className="w-2/3"
                  />
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg shadow-sm overflow-auto h-80">
                <h4 className="font-medium text-gray-800 mb-3">Transactions</h4>
                {currentTransactions.length > 0 ? (
                  <div className="space-y-3">
                    {currentTransactions.map((transaction, index) => (
                      <div 
                        key={index} 
                        className={`p-3 rounded-lg ${transaction.type === 'BUY' ? 'bg-green-50 border-l-4 border-green-500' : 'bg-red-50 border-l-4 border-red-500'}`}
                      >
                        <div className="flex justify-between">
                          <span className={`font-bold text-base ${transaction.type === 'BUY' ? 'text-green-700' : 'text-red-700'}`}>
                            {transaction.type}
                          </span>
                          <span className="text-gray-700 text-sm font-medium">
                            {formatTimestamp(transaction.timestamp)}
                          </span>
                        </div>
                        <div className="mt-2 text-sm">
                          <div className="font-medium text-gray-800">
                            <span className="font-bold">{transaction.quantity}</span> shares @ ₹{transaction.price.toFixed(2)}
                          </div>
                          {transaction.pl !== undefined && (
                            <div className={`font-bold text-base mt-1 ${transaction.pl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              P/L: {transaction.pl >= 0 ? '+' : ''}₹{transaction.pl.toFixed(2)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No transactions yet
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Keep the existing tabs but update styling */}
        {activeTab === 'summary' && (
          // ... existing summary tab content ...
          <div>
            <h3 className="text-2xl font-semibold mb-6 text-gray-900">Performance Summary</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
                <h4 className="text-lg font-medium mb-4 text-gray-800">Return Statistics</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Return</span>
                    <span className={`font-medium ${result.return >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {(result.return * 100).toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total P/L</span>
                    <span className={`font-medium ${totalPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₹{totalPL.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Transactions</span>
                    <span className="font-medium text-gray-800">{result.transactions.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Buy Transactions</span>
                    <span className="font-medium text-gray-800">
                      {result.transactions.filter(t => t.type === 'BUY').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sell Transactions</span>
                    <span className="font-medium text-gray-800">
                      {result.transactions.filter(t => t.type === 'SELL').length}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
                <h4 className="text-lg font-medium mb-4 text-gray-800">Price Statistics</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Starting Price</span>
                    <span className="font-medium text-gray-800">₹{prices[0].toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ending Price</span>
                    <span className="font-medium text-gray-800">₹{prices[prices.length - 1].toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Highest Price</span>
                    <span className="font-medium text-gray-800">₹{Math.max(...prices).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Lowest Price</span>
                    <span className="font-medium text-gray-800">₹{Math.min(...prices).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Price Change</span>
                    <span className={`font-medium ${prices[prices.length - 1] - prices[0] >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {((prices[prices.length - 1] - prices[0]) / prices[0] * 100).toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
              <h4 className="text-lg font-medium mb-4 text-gray-800">Price History</h4>
              <div className="h-64">
                <Line 
                  data={{
                    labels: dates.map(date => formatDate(date)),
                    datasets: [{
                      label: 'Price',
                      data: prices,
                      borderColor: 'rgb(75, 85, 99)',
                      backgroundColor: 'rgba(75, 85, 99, 0.5)',
                      tension: 0.1,
                    }]
                  }} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: false,
                        grid: {
                          color: 'rgba(229, 231, 235, 0.5)'
                        },
                        ticks: {
                          color: '#4B5563'
                        }
                      },
                      x: {
                        grid: {
                          color: 'rgba(229, 231, 235, 0.5)'
                        },
                        ticks: {
                          color: '#4B5563',
                          maxRotation: 45,
                          minRotation: 45
                        }
                      }
                    },
                  }}
                />
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'transactions' && (
          // ... existing transactions tab content ...
          <div>
            <h3 className="text-2xl font-semibold mb-6 text-gray-900">Transaction History</h3>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Symbol</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">P/L</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {result.transactions.map((transaction, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${transaction.type === 'BUY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {transaction.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatTimestamp(transaction.timestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.symbol}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{transaction.price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {transaction.pl !== undefined ? (
                          <span className={`${transaction.pl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {transaction.pl >= 0 ? '+' : ''}₹{transaction.pl.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}