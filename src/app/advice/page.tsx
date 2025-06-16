'use client';

import { useState, useRef } from 'react';
import { getAdvice } from '../../services/api';
import AdviceCard from '../../components/AdviceCard';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/navigation/Navbar';
import Link from 'next/link';
import LoadingSpinner from '@/src/components/ui/LoadingSpinner';



export default function AdvicePage() {
  const [symbol, setSymbol] = useState('');
interface AdviceData {
  symbol: string;
  current_price: number;
  one_year_return: number;
  predictions: {
    arima_7day: number | null;
  };
  recommendations: {
    buy_and_hold: {
      recommendation: string;
      reason: string;
      return: number;
      signal: string;
    };
    momentum: {
      recommendation: string;
      reason: string;
      momentum: number;
      signal: string;
    };
    bollinger: {
      recommendation: string;
      reason: string;
      signal: string;
      current_position: string;
      bands: {
        upper: number;
        middle: number;
        lower: number;
      };
      current_price: number;
      distance_from_ma: number;
    };
    ma_crossover: {
      recommendation: string;
      reason: string;
      signal: string;
      moving_averages: {
        sma200: number;
        sma50: number;
      };
    };
    breakout: {
      recommendation: string;
      reason: string;
      signal: string;
      support: number;
      resistance: number;
    };
    keltner: {
      recommendation: string;
      reason: string;
      signal: string;
      lower_band: number;
      upper_band: number;
    };
    macd: {
      recommendation: string;
      reason: string;
      signal: string;
      macd: number;
      signal_line: number;
    };
    mean_reversion: {
      recommendation: string;
      reason: string;
      signal: string;
      z_score: number;
    };
    parabolic_sar: {
      recommendation: string;
      reason: string;
      signal: string;
      sar_value: number;
    };
    rsi: {
      recommendation: string;
      reason: string;
      signal: string;
      rsi_value: number;
    };
    stochastic: {
      recommendation: string;
      reason: string;
      signal: string;
      d_percent: number;
      k_percent: number;
    };
    volume_spike: {
      recommendation: string;
      reason: string;
      signal: string;
      volume_ratio: number;
    };
  };
  final_recommendation: {
    recommendation: string;
    reason: string;
    signal: string;
    signal_counts: {
      buy: number;
      hold: number;
      sell: number;
    };
    strategy_details: Array<{
      strategy: string;
      signal: string;
      reason: string;
    }>;
  };
  timestamp: string;
}
  
  // Then update the state declaration:
  const [advice, setAdvice] = useState<AdviceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  // Add HTMLDivElement type to the ref
  const adviceCardRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol) return;

    setLoading(true);
    setError('');
    
    try {
      const data = await getAdvice(symbol.toUpperCase());
      setAdvice(data);
    } catch (err: any) {
      if (err.response?.status === 401) {
        // Redirect to login if unauthorized
        router.push('/login');
      } else {
        setError(err.response?.data?.error || err.response?.data?.message || 'Failed to fetch advice');
      }
    } finally {
      setLoading(false);
    }
  };

  const exportAsImage = async () => {
    if (!adviceCardRef.current || !advice) return;
    
    try {
      // Create a canvas element
      const canvas = document.createElement('canvas');
      const width = 800;
      const height = 850;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');
      
      // Set clean white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      
      // Add subtle border
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      ctx.strokeRect(10, 10, width - 20, height - 20);
      
      // Load and draw logo as watermark
      const logoImg = new Image();
      logoImg.src = '/images/logo.svg';
      await new Promise((resolve, reject) => {
        logoImg.onload = resolve;
        logoImg.onerror = reject;
      });
      
      // Draw logo as watermark (centered, semi-transparent)
      ctx.globalAlpha = 0.07;
      const logoSize = 350;
      ctx.drawImage(logoImg, (width - logoSize) / 2, (height - logoSize) / 2, logoSize, logoSize);
      ctx.globalAlpha = 1.0; // Reset transparency
      
      // Header section with better spacing
      ctx.font = 'bold 14px Arial';
      ctx.fillStyle = '#6b7280';
      ctx.textAlign = 'left';
      ctx.fillText('QUARKS FINANCE', 30, 40); // Moved down slightly
      
      // Draw header with company name
      ctx.textAlign = 'center';
      ctx.font = 'bold 28px Arial';
      ctx.fillStyle = '#111827';
      ctx.fillText(advice.symbol, width / 2, 60); // Moved down slightly
      
      // Add subtitle
      ctx.font = '14px Arial';
      ctx.fillStyle = '#4b5563';
      ctx.fillText('Investment Analysis Report', width / 2, 90); // Moved down for spacing
      
      // Simple divider line
      ctx.beginPath();
      ctx.moveTo(30, 110); // Moved down
      ctx.lineTo(width - 30, 110);
      ctx.strokeStyle = '#d1d5db';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // Key metrics section with better spacing
      const drawMetricsSection = () => {
        const sectionY = 140; // Increased spacing from header
        
        // Section title
        ctx.font = 'bold 18px Arial';
        ctx.fillStyle = '#111827';
        ctx.textAlign = 'left';
        ctx.fillText('Key Metrics', 30, sectionY);
        
        // Draw metrics in a grid layout with better spacing
        const drawMetric = (label: string, value: string, x: number, y: number, valueColor: string = '#111827') => {
          ctx.font = '14px Arial';
          ctx.fillStyle = '#6b7280';
          ctx.fillText(label, x, y);
          ctx.font = 'bold 20px Arial';
          ctx.fillStyle = valueColor;
          ctx.fillText(value, x, y + 30); // Increased spacing
        };
        
        // Current price
        drawMetric(
          'Current Price', 
          `₹${advice.current_price.toFixed(2)}`, 
          30, sectionY + 40 // Increased spacing
        );
        
        // 1-Year Return
        const returnColor = advice.one_year_return >= 0 ? '#10b981' : '#ef4444';
        drawMetric(
          '1-Year Return', 
          `${advice.one_year_return.toFixed(2)}%`, 
          270, sectionY + 40, 
          returnColor
        );
        
        // 7-Day Prediction
        drawMetric(
          '7-Day Prediction', 
          `₹${advice.predictions.arima_7day ? advice.predictions.arima_7day.toFixed(2) : 'N/A'}`, 
          510, sectionY + 40
        );
        
        return sectionY + 90; // Increased spacing after metrics
      };
      
      let currentY = drawMetricsSection();
      
      // Add divider after metrics
      ctx.beginPath();
      ctx.moveTo(30, currentY);
      ctx.lineTo(width - 30, currentY);
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      ctx.stroke();
      currentY += 30; // Increased spacing after divider
      
      // Strategy sections with better spacing
      const drawStrategy = (title: string, recommendation: string, reason: string, signal: string, y: number) => {
        const sectionX = 30;
        const sectionWidth = width - 60;
        
        // Section title with signal indicator
        ctx.font = 'bold 18px Arial';
        ctx.fillStyle = '#111827';
        ctx.textAlign = 'left';
        ctx.fillText(title, sectionX, y);
        
        // Signal indicator (simple text, colored)
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = getSignalColor(signal);
        ctx.textAlign = 'right';
        ctx.fillText(signal.toUpperCase(), sectionX + sectionWidth - 10, y);
        
        // Recommendation on its own line for better readability
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = '#111827';
        ctx.textAlign = 'left';
        ctx.fillText(recommendation, sectionX, y + 30); // Increased spacing
        
        // Reason (with text wrapping) on separate lines
        ctx.font = '14px Arial';
        ctx.fillStyle = '#4b5563';
        ctx.textAlign = 'left';
        
        const maxWidth = sectionWidth - 20;
        const words = reason.split(' ');
        let line = '';
        let lineY = y + 55; // Start reason text below recommendation with spacing
        
        for (let i = 0; i < words.length; i++) {
          const testLine = line + words[i] + ' ';
          const metrics = ctx.measureText(testLine);
          
          if (metrics.width > maxWidth && i > 0) {
            ctx.fillText(line, sectionX, lineY);
            line = words[i] + ' ';
            lineY += 22; // Slightly increased line spacing
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line, sectionX, lineY);
        
        return lineY + 35; // Increased spacing after each strategy
      };
      
      // Helper function for signal colors (using a more muted palette)
      function getSignalColor(signal: string) {
        const signalLower = signal.toLowerCase();
        if (signalLower === 'buy') return '#047857'; // Darker green
        if (signalLower === 'sell') return '#b91c1c'; // Darker red
        return '#b45309'; // Darker yellow/amber for hold
      }
      
      // Draw strategy sections with better spacing between them
      currentY = drawStrategy(
        'Buy & Hold Strategy',
        advice.recommendations.buy_and_hold.recommendation,
        advice.recommendations.buy_and_hold.reason,
        advice.recommendations.buy_and_hold.signal,
        currentY
      );
      
      currentY = drawStrategy(
        'Momentum Strategy',
        advice.recommendations.momentum.recommendation,
        advice.recommendations.momentum.reason,
        advice.recommendations.momentum.signal,
        currentY
      );
      
      currentY = drawStrategy(
        'Bollinger Bands Strategy',
        advice.recommendations.bollinger.recommendation,
        advice.recommendations.bollinger.reason,
        advice.recommendations.bollinger.signal,
        currentY
      );
      
      currentY = drawStrategy(
        'MA Crossover Strategy',
        advice.recommendations.ma_crossover.recommendation,
        advice.recommendations.ma_crossover.reason,
        advice.recommendations.ma_crossover.signal,
        currentY
      );

      // Add these new strategy sections after the existing ones in exportAsImage
currentY = drawStrategy(
  'Breakout Strategy',
  advice.recommendations.breakout.recommendation,
  advice.recommendations.breakout.reason,
  advice.recommendations.breakout.signal,
  currentY
);

currentY = drawStrategy(
  'Keltner Channels',
  advice.recommendations.keltner.recommendation,
  advice.recommendations.keltner.reason,
  advice.recommendations.keltner.signal,
  currentY
);

currentY = drawStrategy(
  'MACD Strategy',
  advice.recommendations.macd.recommendation,
  advice.recommendations.macd.reason,
  advice.recommendations.macd.signal,
  currentY
);

currentY = drawStrategy(
  'Mean Reversion',
  advice.recommendations.mean_reversion.recommendation,
  advice.recommendations.mean_reversion.reason,
  advice.recommendations.mean_reversion.signal,
  currentY
);

currentY = drawStrategy(
  'Parabolic SAR',
  advice.recommendations.parabolic_sar.recommendation,
  advice.recommendations.parabolic_sar.reason,
  advice.recommendations.parabolic_sar.signal,
  currentY
);

currentY = drawStrategy(
  'RSI Strategy',
  advice.recommendations.rsi.recommendation,
  advice.recommendations.rsi.reason,
  advice.recommendations.rsi.signal,
  currentY
);

currentY = drawStrategy(
  'Stochastic Oscillator',
  advice.recommendations.stochastic.recommendation,
  advice.recommendations.stochastic.reason,
  advice.recommendations.stochastic.signal,
  currentY
);

currentY = drawStrategy(
  'Volume Spike',
  advice.recommendations.volume_spike.recommendation,
  advice.recommendations.volume_spike.reason,
  advice.recommendations.volume_spike.signal,
  currentY
);
      
      // Add divider before final recommendation
      ctx.beginPath();
      ctx.moveTo(30, currentY);
      ctx.lineTo(width - 30, currentY);
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      ctx.stroke();
      currentY += 40; // Increased spacing before final recommendation
      
      // Final recommendation section with better spacing
      const drawFinalRecommendation = () => {
        const sectionY = currentY;
        
        // Section title
        ctx.font = 'bold 20px Arial';
        ctx.fillStyle = '#111827';
        ctx.textAlign = 'center';
        ctx.fillText('OVERALL RECOMMENDATION', width / 2, sectionY);
        
        // Final recommendation with signal counts
        const signalLower = advice.final_recommendation.signal.toLowerCase();
        const signalColor = getSignalColor(signalLower);
        
        // Draw recommendation text
        ctx.font = 'bold 24px Arial';
        ctx.fillStyle = signalColor;
        ctx.textAlign = 'center';
        ctx.fillText(advice.final_recommendation.recommendation, width / 2, sectionY + 45); // Increased spacing
        
        // Signal counts
        const counts = advice.final_recommendation.signal_counts;
        const countsText = `(Buy: ${counts.buy}, Sell: ${counts.sell}, Hold: ${counts.hold})`;
        ctx.font = '14px Arial';
        ctx.fillStyle = '#6b7280';
        ctx.fillText(countsText, width / 2, sectionY + 75); // Increased spacing
        
        // Draw reason with better spacing
        ctx.font = '14px Arial';
        ctx.fillStyle = '#4b5563';
        ctx.textAlign = 'center';
        
        // Wrap text for reason
        const maxWidth = width - 100;
        const words = advice.final_recommendation.reason.split(' ');
        let line = '';
        let lineY = sectionY + 105; // Increased spacing
        
        for (let i = 0; i < words.length; i++) {
          const testLine = line + words[i] + ' ';
          const metrics = ctx.measureText(testLine);
          
          if (metrics.width > maxWidth && i > 0) {
            ctx.fillText(line, width / 2, lineY);
            line = words[i] + ' ';
            lineY += 22; // Slightly increased line spacing
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line, width / 2, lineY);
        
        return lineY + 40; // Increased spacing after final recommendation
      };
      
      const finalY = drawFinalRecommendation();
      
      // Footer with better spacing
      const footerY = Math.max(finalY + 30, height - 40);
      
      // Footer text
      ctx.font = '12px Arial';
      ctx.fillStyle = '#6b7280';
      ctx.textAlign = 'center';
      ctx.fillText(`Generated on ${new Date().toLocaleDateString()} by Quarks Finance`, width / 2, footerY);
      
      // Convert to image and download
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `${symbol.toUpperCase()}_advice_${new Date().toISOString().split('T')[0]}.png`;
      link.click();
    } catch (err) {
      console.error('Error creating canvas image:', err);
      alert('Failed to export image. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-800">
      <Navbar />
      
      {/* Breadcrumb navigation */}
      <nav className="px-6 mt-4 flex items-center gap-4 text-sm">
        <Link href="/home" className="text-black text-2xl" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>Home</Link>
        <span className="text-black text-2xl" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>&gt;</span>
        <Link href="/advice" className="text-black text-2xl" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>Advice Sheet</Link>
      </nav>

      <div className="container mx-auto px-4 md:px-40 py-8">
      <div className="w-full px-4 mt-4">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-24 bg-white rounded-lg p-8 relative overflow-hidden border shadow-sm" style={{ minHeight: '100px' }}>
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'JetBrains Mono, monospace', color: '#4C555A' }}>
            Advice Sheet
          </h1>
          <p className="text-black" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '17px' }}>
            Receive comprehensive analysis and trading recommendations based on multiple strategies
          </p>
        </div>
        <div className="absolute left-196 w-full h-full">
          <img 
            src="/images/advice1.svg" 
            alt="Portfolio illustration" 
            className="scale-110"
          />
        </div>
      </div>
        
      <div className="max-w-xl mx-auto mb-12 bg-white p-8 rounded-xl border border-gray-200" style={{ fontFamily: 'Rubik, sans-serif' }}>
        <h2 className="text-xl font-bold mb-4">Enter Stock Symbol</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder="Enter stock symbol (e.g., RELIANCE)"
              className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 shadow-sm text-gray-800 bg-gray-50"
              required
            />
            <button 
              type="submit" 
              className="px-6 py-3 bg-[#5FB865] text-white rounded hover:bg-[#4ea055] focus:outline-none focus:ring-2 focus:ring-[#4ea055] focus:ring-offset-2 disabled:opacity-50 shadow-sm transition-colors duration-200 whitespace-nowrap"
              disabled={loading}
            >
              {loading ? 'Analyzing...' : 'Get Advice'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">Enter the stock symbol exactly as it appears on the exchange (e.g., RELIANCE, TCS, INFY)</p>
        </form>
      </div>

      {loading && (
        <div className="max-w-md mx-auto text-center p-8" style={{ fontFamily: 'Rubik, sans-serif' }}>
          <LoadingSpinner />
          <p className="text-lg text-gray-700">Analyzing stock data and generating recommendations...</p>
        </div>
      )}
        {error && (
          <div className="max-w-3xl mx-auto mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg shadow-sm">
            <div className="flex items-center">
              <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}

        <div ref={adviceCardRef}>
          {advice && <AdviceCard advice={advice} />}
        </div>
        
        {advice && (
          
<div className="flex justify-center mt-8 mb-12" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '16px' }}>
  <button
    onClick={exportAsImage}
    className="flex items-center gap-2 px-6 py-3 bg-[#41748D] text-white rounded hover:bg-[#365d6b] focus:outline-none focus:ring-2 focus:ring-[#41748D] focus:ring-offset-2 shadow-sm transition-colors duration-200"
  >
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
    Export as Image
  </button>
</div>
        )}
      </div>
    </div>
  </div>
  );
}