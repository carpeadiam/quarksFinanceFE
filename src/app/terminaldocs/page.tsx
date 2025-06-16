'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Navbar from '../../components/navigation/Navbar';

interface Command {
  name: string;
  syntax: string;
  description: string;
}

interface Parameter {
  type: string;
  params: string;
  description: string;
}

interface ContentItem {
  title: string;
  description?: string;
  commands?: Command[];
  parameters?: Parameter[];
}

interface TerminalDocSection {
  section: string;
  content: ContentItem[];
}

const terminalDocs: TerminalDocSection[] = [
  {
    section: 'Getting Started',
    content: [
      {
        title: 'Introduction',
        description: 'The QuarkScript Terminal is an interactive command-line interface for managing portfolios, executing trading strategies, and analyzing market data. It provides a powerful set of commands for both basic and advanced trading operations.'
      },
      {
        title: 'Basic Usage',
        description: 'Type commands in the terminal prompt and press Enter or click Execute to run them. Use the up and down arrow keys to navigate through command history. Type HELP to see all available commands. All commands to be used in a single run need to be terminated with semi-colons (;) '
      }
    ]
  },
  {
    section: 'Portfolio Management',
    content: [
      {
        title: 'Portfolio Commands',
        commands: [
          { name: 'CREATE PORTFOLIO', syntax: 'CREATE PORTFOLIO name=<name> cash=<amount>', description: 'Create a new portfolio with specified name and initial cash amount' },
          { name: 'LOAD PORTFOLIO', syntax: 'LOAD PORTFOLIO id=<id>', description: 'Load an existing portfolio by ID' },
          { name: 'VIEW PORTFOLIO', syntax: 'VIEW PORTFOLIO', description: 'View current portfolio details and holdings' },
          { name: 'LIST PORTFOLIOS', syntax: 'LIST PORTFOLIOS', description: 'List all available portfolios' },
          { name: 'BUY', syntax: 'BUY symbol=<symbol> quantity=<shares>', description: 'Buy shares in the current portfolio' },
          { name: 'SELL', syntax: 'SELL symbol=<symbol> quantity=<shares>', description: 'Sell shares from the current portfolio' },
          { name: 'SAVE', syntax: 'SAVE', description: 'Save current portfolio/watchlist changes' }
        ]
      }
    ]
  },
  {
    section: 'Watchlist Management',
    content: [
      {
        title: 'Watchlist Commands',
        commands: [
          { name: 'CREATE WATCHLIST', syntax: 'CREATE WATCHLIST name=<name>', description: 'Create a new watchlist with specified name' },
          { name: 'LOAD WATCHLIST', syntax: 'LOAD WATCHLIST id=<id>', description: 'Load an existing watchlist by ID' },
          { name: 'VIEW WATCHLIST', syntax: 'VIEW WATCHLIST', description: 'View current watchlist and tracked stocks' },
          { name: 'LIST WATCHLISTS', syntax: 'LIST WATCHLISTS', description: 'List all available watchlists' },
          { name: 'ADD TO WATCHLIST', syntax: 'ADD TO WATCHLIST symbol=<symbol> [notes=<text>]', description: 'Add a stock to current watchlist with optional notes' },
          { name: 'REMOVE FROM WATCHLIST', syntax: 'REMOVE FROM WATCHLIST symbol=<symbol>', description: 'Remove a stock from current watchlist' }
        ]
      }
    ]
  },
  {
    section: 'Strategy Management',
    content: [
      {
        title: 'Strategy Commands',
        commands: [
          { name: 'STRATEGY CREATE', syntax: 'STRATEGY CREATE name=<name> symbol=<symbol> type=<MOMENTUM|BOLLINGER|MACROSS|...> [params...]', description: 'Create a new trading strategy with specified parameters' },
          { name: 'STRATEGY LIST', syntax: 'STRATEGY LIST', description: 'List all available strategies' },
          { name: 'STRATEGY DELETE', syntax: 'STRATEGY DELETE id=<id>', description: 'Delete a strategy by ID' },
          { name: 'STRATEGY ENABLE', syntax: 'STRATEGY ENABLE id=<id>', description: 'Enable a strategy for automatic execution' },
          { name: 'STRATEGY DISABLE', syntax: 'STRATEGY DISABLE id=<id>', description: 'Disable a strategy from automatic execution' },
          { name: 'RUN STRATEGY', syntax: 'RUN STRATEGY name=<name> symbol=<symbol> [params...]', description: 'Manually execute a strategy with specified parameters' },
          { name: 'LIST STRATEGIES', syntax: 'LIST STRATEGIES', description: 'List all strategies (alternative command)' }
        ]
      },
      {
  "title": "Strategy Parameters",
  "description": "Different strategy types accept specific parameters for customization:",
  "parameters": [
    {
      "type": "MOMENTUM",
      "params": "lookback_days=<14> threshold=<0.05>",
      "description": "Momentum strategy with lookback period and threshold"
    },
    {
      "type": "BOLLINGER",
      "params": "window=<20> num_std=<2>",
      "description": "Bollinger Bands strategy with window size and standard deviations"
    },
    {
      "type": "MACROSS",
      "params": "short_window=<50> long_window=<200>",
      "description": "Moving Average Crossover strategy with short and long windows"
    },
    {
      "type": "RSI",
      "params": "window=<14> overbought=<70> oversold=<30>",
      "description": "Relative Strength Index strategy with window size and overbought/oversold levels"
    },
    {
      "type": "MACD",
      "params": "fast=<12> slow=<26> signal=<9>",
      "description": "Moving Average Convergence Divergence strategy with fast, slow and signal periods"
    },
    {
      "type": "MEANREVERSION",
      "params": "window=<20> z_threshold=<2>",
      "description": "Mean Reversion strategy with window size and z-score threshold"
    },
    {
      "type": "BREAKOUT",
      "params": "window=<20> multiplier=<1.01>",
      "description": "Breakout strategy with window size and resistance multiplier"
    },
    {
      "type": "VOLUMESPIKE",
      "params": "window=<20> multiplier=<2.5>",
      "description": "Volume Spike strategy with window size and volume multiplier"
    },
    {
      "type": "KELTNER",
      "params": "window=<20> atr_multiplier=<2>",
      "description": "Keltner Channels strategy with window size and ATR multiplier"
    },
    {
      "type": "STOCHASTIC",
      "params": "k_window=<14> d_window=<3> overbought=<80> oversold=<20>",
      "description": "Stochastic Oscillator strategy with %K, %D periods and overbought/oversold levels"
    },
    {
      "type": "PARABOLICSAR",
      "params": "acceleration=<0.02> maximum=<0.2>",
      "description": "Parabolic SAR strategy with acceleration factor and maximum value"
    }
  ]
}
    ]
  },
  {
    section: 'Price Information',
    content: [
      {
        title: 'Price and Analysis Commands',
        commands: [
          { name: 'PRICE', syntax: 'PRICE symbol=<symbol>', description: 'Get current stock price for specified symbol' },
          { name: 'HISTORICAL_PRICE', syntax: 'HISTORICAL_PRICE symbol=<symbol> date=<YYYY-MM-DD>', description: 'Get historical price for a specific date' },
          { name: 'COMPARE_PRICE', syntax: 'COMPARE_PRICE symbol=<symbol> start_date=<YYYY-MM-DD> [end_date=<YYYY-MM-DD>]', description: 'Compare prices between dates' },
          { name: 'GENERATE ADVICE', syntax: 'GENERATE ADVICE symbol=<symbol>', description: 'Generate AI-powered trading advice for a stock' }
        ]
      }
    ]
  },
  {
    section: 'Advanced Features',
    content: [
      {
        title: 'Command History',
        description: 'The terminal maintains a history of executed commands. Use the up and down arrow keys to navigate through previously executed commands.',
        commands: [
          { name: 'HISTORY', syntax: 'HISTORY [limit=<number>]', description: 'Show command history with optional limit on number of commands' },
          { name: 'REPEAT', syntax: 'REPEAT index=<number>', description: 'Repeat a command from history using its index number' }
        ]
      },
      {
        title: 'System Commands',
        commands: [
          { name: 'HELP', syntax: 'HELP', description: 'Display all available commands and their syntax' },
          { name: 'EXIT', syntax: 'EXIT', description: 'Exit the QuarkScript terminal' }
        ]
      },
      {
        title: 'Output Formatting',
        description: 'Complex command outputs are automatically formatted as JSON for better readability. The terminal supports colored output and structured data display.'
      }
    ]
  }
];

export default function TerminalDocs() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSection, setActiveSection] = useState('Getting Started');

  // Filter and search functionality
  const filteredDocs = useMemo(() => {
    if (!searchTerm.trim()) return terminalDocs;

    return terminalDocs.map(section => ({
      ...section,
      content: section.content.filter(item => 
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.commands && item.commands.some((cmd: Command) => 
          cmd.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cmd.syntax.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cmd.description.toLowerCase().includes(searchTerm.toLowerCase())
        )) ||
        (item.parameters && item.parameters.some((param: Parameter) =>
          param.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
          param.params.toLowerCase().includes(searchTerm.toLowerCase()) ||
          param.description.toLowerCase().includes(searchTerm.toLowerCase())
        ))
      )
    })).filter(section => section.content.length > 0);
  }, [searchTerm]);

  return (
    <main className="min-h-screen bg-white" style={{ fontFamily: 'Rubik, sans-serif'}}>
      <Navbar />
      
<nav className="px-6 mt-4 flex items-center gap-4 text-sm">
        <Link href="/home" className="text-black text-2xl" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>Home</Link>
        <span className="text-black text-2xl" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>&gt;</span>
        <Link href="/terminal" className="text-black text-2xl" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>Terminal</Link>
        <span className="text-black text-2xl" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>&gt;</span>
        <Link href="/terminaldocs" className="text-black text-2xl" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>Documentation</Link>
    
      </nav>

      <div className="container mx-auto px-4 max-w-6xl ">
        <div className="text-center mb-12">
          <br></br>
          <br></br>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">QuarkScript Terminal Documentation</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Complete guide to using the QuarkScript Terminal for portfolio management, watchlists, and trading strategies
          </p>
        </div>

        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <div className="w-64 flex-shrink-0">
            <div className="sticky top-8">
              <input
                type="text"
                placeholder="Search documentation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 mb-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 shadow-sm text-gray-800 bg-gray-50"
              />
              <nav className="space-y-1">
                {(searchTerm ? filteredDocs : terminalDocs).map((section) => (
                  <button
                    key={section.section}
                    onClick={() => setActiveSection(section.section)}
                    className={`w-full text-left px-4 py-2 rounded-lg ${activeSection === section.section ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    {section.section}
                  </button>
                ))}
              </nav>
              {searchTerm && filteredDocs.length === 0 && (
                <div className="text-gray-500 text-sm mt-4 px-4">
                  No results found for "{searchTerm}"
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {(searchTerm ? filteredDocs : terminalDocs).map((section) => (
              <div
                key={section.section}
                className={`${activeSection === section.section ? 'block' : 'hidden'}`}
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-6">{section.section}</h2>
                
                {section.content.map((item, index) => (
                  <div key={`${item.title}-${index}`} className="mb-8">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">{item.title}</h3>
                    
                    {item.description && (
                      <p className="text-gray-600 mb-4">{item.description}</p>
                    )}

                    {item.commands && Array.isArray(item.commands) && (
                      <div className="overflow-hidden rounded-lg border border-gray-200 mb-4">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Command</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Syntax</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {item.commands.map((cmd, cmdIndex) => (
                              <tr key={cmd.name} className={cmdIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{cmd.name}</td>
                                <td className="px-6 py-4 text-sm font-mono text-gray-500 break-words">{cmd.syntax}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">{cmd.description}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {item.parameters && Array.isArray(item.parameters) && (
                      <div className="overflow-hidden rounded-lg border border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Strategy Type</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parameters</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {item.parameters.map((param, paramIndex) => (
                              <tr key={param.type} className={paramIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{param.type}</td>
                                <td className="px-6 py-4 text-sm font-mono text-gray-500 break-words">{param.params}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">{param.description}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}