import FeatureCard from './FeatureCard';
export default function FeatureGrid() {
  const features = [
    {
      title: 'View and Create Watchlists',
      icon: '/images/watchlist.svg',
      href: '/watchlist',
      color: 'blue' as const,
    },
    {
      title: 'View and Create Portfolios',
      icon: '/images/portfolio.svg',
      href: '/portfolios',
      color: 'blue' as const,
    },
    {
      title: 'Historical Simulation Backtests',
      icon: '/images/backtest.svg',
      href: '/backtest',
      color: 'red' as const,
    },
    {
      title: 'Create and Run Live Strategies',
      icon: '/images/strategies.svg',
      href: '/strategies',
      color: 'green' as const,
    },
    {
      title: 'Generate Advice Sheets',
      icon: '/images/advice.svg',
      href: '/advice',
      color: 'blue' as const,
    },
    {
      title: 'Run Terminal Commands',
      icon: '/images/terminal.svg',
      href: '/terminal',
      color: 'purple' as const,
    },
    {
      title: 'Stock Recommendations',
      icon: '/images/stock_recommendations (1).svg',
      href: '/forecast-trends',
      color: 'purple' as const,
    },
    {
      title: 'Sector Analysis',
      icon: '/images/sector_analysis.svg',
      href: '/sector-analysis',
      color: 'purple' as const,
    },
    {
      title: 'Sentiment Analysis',
      icon: '/images/sentiment_analysis.svg',
      href: '/sentiment',
      color: 'purple' as const,
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-20">
      {features.map((feature) => (
        <FeatureCard key={feature.title} {...feature} />
      ))}
    </div>
  );
}