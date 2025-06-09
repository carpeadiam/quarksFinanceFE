'use client';
import { useState } from 'react';
import RadialOrbitalTimeline from '@/components/ui/radial-orbital-timeline';
import { BarChart2, Eye, PieChart, Terminal, TrendingUp, Zap } from 'lucide-react';

export default function FeatureShowcase() {
  const [activeFeature, setActiveFeature] = useState<number | null>(null);
  
  const featureData = [
    {
      id: 1,
      title: 'Watchlists',
      date: 'Real-time tracking',
      content: 'Create and manage watchlists to track your favorite stocks and assets with real-time updates and notifications.',
      category: 'tracking',
      icon: Eye,
      relatedIds: [3, 5],
      status: 'completed' as const,
      energy: 90
    },
    {
      id: 2,
      title: 'Portfolios',
      date: 'Asset management',
      content: 'Build and monitor your investment portfolios with detailed analytics and performance metrics.',
      category: 'management',
      icon: PieChart,
      relatedIds: [1, 3],
      status: 'completed' as const,
      energy: 85
    },
    {
      id: 3,
      title: 'Backtests',
      date: 'Historical simulation',
      content: 'Test trading strategies against historical data to evaluate performance before risking real capital.',
      category: 'analysis',
      icon: BarChart2,
      relatedIds: [4, 6],
      status: 'completed' as const,
      energy: 95
    },
    {
      id: 4,
      title: 'Live Strategies',
      date: 'Automated trading',
      content: 'Create and deploy automated trading strategies that execute based on your custom parameters and market conditions.',
      category: 'automation',
      icon: TrendingUp,
      relatedIds: [3, 5],
      status: 'completed' as const,
      energy: 100
    },
    {
      id: 5,
      title: 'Advice Sheets',
      date: 'AI-powered insights',
      content: 'Generate comprehensive analysis reports with AI-powered recommendations for your investment decisions.',
      category: 'intelligence',
      icon: Zap,
      relatedIds: [1, 4],
      status: 'completed' as const,
      energy: 88
    },
    {
      id: 6,
      title: 'Terminal',
      date: 'Advanced commands',
      content: 'Access powerful terminal commands for advanced users who want direct control over their trading operations.',
      category: 'advanced',
      icon: Terminal,
      relatedIds: [3, 4],
      status: 'completed' as const,
      energy: 75
    }
  ];

  return (
    <section className="py-12 relative ">  {/* Reduced padding from py-20 to py-12 */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-8">  {/* Reduced margin from mb-16 to mb-8 */}
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-700 to-blue-900 bg-clip-text text-transparent mb-2">  {/* Reduced margin from mb-4 to mb-2 */}
            Our Features
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">  {/* Reduced text size from text-xl to text-lg and max width */}
            Explore our interactive platform capabilities designed to enhance your trading experience
          </p>
        </div>
      </div>
      <div className="h-[450px] w-full">  {/* Reduced height from 600px to 450px */}
        <RadialOrbitalTimeline timelineData={featureData} />
      </div>
    </section>
  );
}