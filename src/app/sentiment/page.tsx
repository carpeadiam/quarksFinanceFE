'use client';

import { useState } from 'react';
import Navbar from '../../components/navigation/Navbar';
import Link from 'next/link';
import LoadingSpinner from '@/src/components/ui/LoadingSpinner';

type SentimentAnalysisResult = {
  metadata?: {
    total_articles: number;
    processed_articles: number;
    processing_time: string;
  };
  sentiment_metrics?: {
    overall_score: string;
    positive_score: number;
    negative_score: number;
    sentiment_ratio: number;
    average_confidence: number;
  };
  article_details?: Array<{
    url: string;
    title: string;
    sentiment: string;
    confidence: number;
    content_length: number;
    image_222x148?: string;
    intro?: string;
    headline: string;
  }>;
};

type SentimentSummary = {
  analysis_date: string;
  company_name: string;
  confidence_score: number;
  current_price: number;
  fear_score: number;
  growth_potential_score: number;
  investment_attractiveness_score: number;
  liquidity_score: number;
  market_cap_approx: string;
  market_correlation_score: number;
  momentum_score: number;
  negative_score: number;
  news_count: number;
  overall_sentiment_score: number;
  positive_score: number;
  price_change: number;
  price_change_pct: number;
  recent_headlines: string[];
  risk_factors: string[];
  risk_level: string;
  risk_score: number;
  stability_score: number;
  symbol: string;
  technical_strength_score: number;
  volatility_score: number;
  volume: number;
};

export default function SentimentAnalysisPage() {
  const [symbol, setSymbol] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<SentimentAnalysisResult | null>(null);
  const [summaryResult, setSummaryResult] = useState<SentimentSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
  if (!symbol.trim()) {
    setError('Please enter a stock symbol');
    return;
  }
  
  setLoading(true);
  setError(null);
  setAnalysisResult(null);
  setSummaryResult(null);
  
  try {
    // Run both API calls in parallel
    const [analysisResponse, summaryResponse] = await Promise.all([
      fetch(`https://carpeadiam-centiment.hf.space/api/sentimental_analysis?symbol=${symbol}`),
      fetch(`https://carpeadiam-centiment2.hf.space/api/sentimental_summary?symbol=${symbol}`)
    ]);

    // Process responses
    if (!analysisResponse.ok || !summaryResponse.ok) {
      throw new Error(analysisResponse.ok ? summaryResponse.statusText : analysisResponse.statusText);
    }

    const [analysisData, summaryData] = await Promise.all([
      analysisResponse.json(),
      summaryResponse.json()
    ]);

    setAnalysisResult(analysisData);
    setSummaryResult(summaryData);
    
  } catch (err) {
    setError(err instanceof Error ? err.message : 'An unknown error occurred');
  } finally {
    setLoading(false);
  }
};

  // Calculate sentiment metrics from analysis result
  const getCalculatedSentimentMetrics = () => {
    if (!analysisResult?.article_details) {
      return {
        positiveCount: 0,
        negativeCount: 0,
        neutralCount: 0,
        totalCount: 0,
        positivePercentage: 0,
        negativePercentage: 0,
        overallSentiment: 0
      };
    }

    const positiveCount = analysisResult.article_details.filter(a => a.sentiment === 'positive').length;
    const negativeCount = analysisResult.article_details.filter(a => a.sentiment === 'negative').length;
    const neutralCount = analysisResult.article_details.filter(a => a.sentiment === 'neutral').length;
    const totalCount = analysisResult.article_details.length;

    const positivePercentage = totalCount > 0 ? (positiveCount / totalCount) * 100 : 0;
    const negativePercentage = totalCount > 0 ? (negativeCount / totalCount) * 100 : 0;
    
    // Calculate overall sentiment: positive articles contribute positively, negative contribute negatively
    const overallSentiment = totalCount > 0 ? ((positiveCount - negativeCount) / totalCount) * 50 + 50 : 50;

    return {
      positiveCount,
      negativeCount,
      neutralCount,
      totalCount,
      positivePercentage,
      negativePercentage,
      overallSentiment: Math.max(0, Math.min(100, overallSentiment)) // Clamp between 0-100
    };
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case 'positive': return 'bg-green-100 text-green-800 border-green-300';
      case 'negative': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-amber-100 text-amber-800 border-amber-300';
    }
  };

  const getSentimentGradient = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case 'positive': return 'from-green-500 to-green-700';
      case 'negative': return 'from-red-500 to-red-700';
      default: return 'from-amber-500 to-amber-700';
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case 'positive': return '↑';
      case 'negative': return '↓';
      default: return '→';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 60) return 'text-green-600';
    if (score <= 40) return 'text-red-600';
    return 'text-amber-600';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 60) return 'from-green-500 to-green-700';
    if (score <= 40) return 'from-red-500 to-red-700';
    return 'from-amber-500 to-amber-700';
  };

  const calculatedMetrics = getCalculatedSentimentMetrics();

return (
  <main className="min-h-screen" style={{ fontFamily: 'Rubik, sans-serif'}}>
    <Navbar />
    {/* Breadcrumb navigation */}
    <nav className="px-6 mt-4 flex items-center gap-4 text-sm">
      <Link href="/home" className="text-gray-700 text-2xl hover:text-gray-900" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>Home</Link>
      <span className="text-gray-500 text-2xl" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>&gt;</span>
      <Link href="/sentiment" className="text-gray-700 text-2xl hover:text-gray-900" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>Sentiment Analysis</Link>
    </nav>

    <div className="container mx-auto px-4 md:px-40 py-8">
      <div className="w-full px-4 mt-4">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-24 bg-white rounded-lg p-8 relative overflow-hidden border shadow-sm" style={{ minHeight: '100px' }}>
          <div>
            <h1 className="text-3xl font-bold mb-2 text-gray-800" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              Sentiment Analysis
            </h1>
            <p className="text-gray-600" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '17px' }}>
              Analyse stock news sentiment
            </p>
          </div>
          <div className="absolute left-196 w-full h-full">
            <img 
              src="/images/sentiment_analysis1.svg" 
              alt="Portfolio illustration" 
              className="scale-148"
            />
          </div>
        </div>
        
        <div className="mb-8">
          <div className="bg-white border border-gray-200 rounded-xl border border-gray-200 p-6">
            <h3 className="text-xl font-bold mb-2">Stock Symbol for analysis</h3>
            <div className="flex items-end gap-6">
              <div className="flex-grow">
                
                <input
                  type="text"
                  id="symbol"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && fetchData()}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm "
                  placeholder="Enter stock symbol (e.g., RELIANCE, TCS, HDFCBANK)"
                />
              </div>
              <button
                onClick={fetchData}
                disabled={loading || !symbol.trim()}
                className="px-6 py-2 bg-[#41748D] text-white font-medium rounded shadow-sm hover:bg-[#3a6a7f] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-all"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    Analyzing...
                  </span>
                ) : 'Analyze'}
              </button>
            </div>
            
            <div className="flex gap-2 mt-4">
              <span className="text-xs text-gray-500 flex items-center mr-2">Quick select:</span>
              {['RELIANCE', 'TCS', 'HDFCBANK'].map((example) => (
                <button
                  key={example}
                  onClick={() => setSymbol(example)}
                  className="text-xs px-3 py-1 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 mb-6 bg-red-100 border border-red-300 rounded-md text-red-800 shadow-sm">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex justify-center items-center py-20">
            <LoadingSpinner />
          </div>
        )}

        {summaryResult && (
          <div className="mb-8 p-6 bg-white border border-gray-200 rounded-lg border border-gray-200 ">
            <h2 className="text-2xl font-bold mb-6 flex items-center text-gray-800">
              <span className="text-gray-800">{summaryResult.symbol}</span>
              <span className="ml-2 text-gray-500 text-lg font-normal">({summaryResult.company_name})</span>
              <span className={`ml-auto ${summaryResult.price_change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₹{summaryResult.current_price.toFixed(2)} 
                <span className="text-sm ml-1">
                  {summaryResult.price_change >= 0 ? '+' : ''}{summaryResult.price_change_pct.toFixed(2)}%
                </span>
              </span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="p-5 bg-white rounded-lg border border-gray-200 border border-gray-200 ">
                <h3 className="text-lg font-semibold mb-3 text-gray-800">Sentiment Overview</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-700">Overall Sentiment:</span>
                    <span className={`font-bold ${getScoreColor(calculatedMetrics.overallSentiment)}`}>
                      {calculatedMetrics.overallSentiment.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className={`h-2.5 rounded-full bg-gradient-to-r ${getScoreGradient(calculatedMetrics.overallSentiment)}`}
                      style={{ width: `${Math.min(100, Math.max(0, calculatedMetrics.overallSentiment))}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-gray-700">Positive News:</span>
                    <span className="text-green-600 font-medium">{calculatedMetrics.positivePercentage.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Negative News:</span>
                    <span className="text-red-600 font-medium">{calculatedMetrics.negativePercentage.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">News Count:</span>
                    <span className="font-medium text-gray-800">{calculatedMetrics.totalCount}</span>
                  </div>
                </div>
              </div>

              <div className="p-5 bg-white rounded-lg border border-gray-200  ">
                <h3 className="text-lg font-semibold mb-3 text-gray-800">Technical Indicators</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-700">Technical Strength:</span>
                    <span className={`font-bold ${getScoreColor(summaryResult.technical_strength_score)}`}>
                      {summaryResult.technical_strength_score.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className={`h-2.5 rounded-full bg-gradient-to-r ${getScoreGradient(summaryResult.technical_strength_score)}`}
                      style={{ width: `${Math.min(100, Math.max(0, summaryResult.technical_strength_score))}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-gray-700">Momentum:</span>
                    <span className={`font-medium ${getScoreColor(summaryResult.momentum_score)}`}>
                      {summaryResult.momentum_score.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Volatility:</span>
                    <span className="font-medium text-gray-800">{summaryResult.volatility_score.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Volume:</span>
                    <span className="font-medium text-gray-800">{summaryResult.volume.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="p-5 bg-white rounded-lg border border-gray-200  ">
                <h3 className="text-lg font-semibold mb-3 text-gray-800">Investment Metrics</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-700">Investment Attractiveness:</span>
                    <span className={`font-bold ${getScoreColor(summaryResult.investment_attractiveness_score)}`}>
                      {summaryResult.investment_attractiveness_score.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className={`h-2.5 rounded-full bg-gradient-to-r ${getScoreGradient(summaryResult.investment_attractiveness_score)}`}
                      style={{ width: `${Math.min(100, Math.max(0, summaryResult.investment_attractiveness_score))}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-gray-700">Growth Potential:</span>
                    <span className={`font-medium ${getScoreColor(summaryResult.growth_potential_score)}`}>
                      {summaryResult.growth_potential_score.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Risk Level:</span>
                    <span className={summaryResult.risk_level === 'LOW' ? 'text-green-600 font-medium' : 
                      summaryResult.risk_level === 'HIGH' ? 'text-red-600 font-medium' : 'text-amber-600 font-medium'}>
                      {summaryResult.risk_level}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Risk Score:</span>
                    <span className={`font-medium ${getScoreColor(100 - summaryResult.risk_score)}`}>
                      {summaryResult.risk_score.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {summaryResult.risk_factors && summaryResult.risk_factors.length > 0 && (
              <div className="mb-6 p-5 bg-white rounded-lg border border-gray-200 ">
                <h3 className="text-lg font-semibold mb-3 text-gray-800">Risk Factors</h3>
                <ul className="list-disc pl-5 text-red-600 space-y-1">
                  {summaryResult.risk_factors.map((factor, index) => (
                    <li key={index}>{factor}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="p-4 bg-white rounded-lg border border-gray-200 ">
              <h3 className="text-lg font-semibold mb-2 text-gray-800">Analysis Date</h3>
              <p className="text-gray-600">{summaryResult.analysis_date}</p>
            </div>
          </div>
        )}

        {analysisResult && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">News Sentiment Analysis</h2>
              
              <div className="flex gap-4">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-500 to-green-700 mr-2"></div>
                  <span className="text-sm font-medium text-gray-700">Positive: {analysisResult.article_details?.filter(a => a.sentiment === 'positive').length || 0}</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-amber-500 to-amber-700 mr-2"></div>
                  <span className="text-sm font-medium text-gray-700">Neutral: {analysisResult.article_details?.filter(a => a.sentiment === 'neutral').length || 0}</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-red-500 to-red-700 mr-2"></div>
                  <span className="text-sm font-medium text-gray-700">Negative: {analysisResult.article_details?.filter(a => a.sentiment === 'negative').length || 0}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(analysisResult.article_details || []).map((article, index) => (
                <a 
                  key={index} 
                  href={article.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block bg-white rounded-lg border border-gray-200 overflow-hidden  "
                >
                  {article.image_222x148 && (
                    <div className="relative w-full h-48 overflow-hidden">
                      <img 
                        src={article.image_222x148} 
                        alt={article.headline || 'News image'}
                        className="object-cover w-full h-full"
                      />
                      <div className={`absolute top-0 right-0 m-2 px-2.5 py-1 rounded-full text-xs font-medium text-white bg-gradient-to-r ${getSentimentGradient(article.sentiment)}`}>
                        {getSentimentIcon(article.sentiment)} {article.sentiment.toUpperCase()} ({(article.confidence * 100).toFixed(0)}%)
                      </div>
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold mb-2 line-clamp-2 hover:text-blue-600 transition-colors text-gray-800">{article.headline || 'No headline available'}</h3>
                    {article.intro && <p className="text-gray-600 line-clamp-3">{article.intro}</p>}
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  </main>
);
}