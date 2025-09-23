'use client';

import { useState, useEffect, useRef } from 'react';

interface TerminalOutput {
  id: string;
  type: 'command' | 'output' | 'error' | 'success' | 'info';
  content: string;
  timestamp: Date;
  // Add metadata for collapsible JSON sections
  jsonMetadata?: {
    isJson: boolean;
    collapsedSections: Record<string, boolean>;
    filterSections?: string[];
  };
}

interface TerminalInterfaceProps {
  isVisible: boolean;
  onClose: () => void;
  isManaged?: boolean;
}

function TerminalInterface({ isVisible, onClose, isManaged }: TerminalInterfaceProps) {
  const [command, setCommand] = useState('');
  const [output, setOutput] = useState<TerminalOutput[]>([
    {
      id: '1',
      type: 'info',
      content: 'Welcome to QuarkScript Terminal v2.0!\nType HELP for available commands.',
      timestamp: new Date()
    }
  ]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [height, setHeight] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [maxHistory, setMaxHistory] = useState(100);
  const [theme, setTheme] = useState<'green' | 'blue' | 'amber' | 'purple' | 'white' | 'light' | 'retro' | 'ocean' | 'sunset'>('green');
  const [showTimestamps, setShowTimestamps] = useState(false);
  const [continuationMode, setContinuationMode] = useState<{ command: string; prompt: string } | null>(null);
  const [currentPortfolioId, setCurrentPortfolioId] = useState<string | null>(null);
  const [autocompleteSuggestion, setAutocompleteSuggestion] = useState<string>('');
  const [isFocused, setIsFocused] = useState(true);
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const themes = {
    green: { 
      primary: 'text-green-400', 
      bg: 'bg-gray-900', 
      accent: 'text-green-300',
      header: 'bg-gray-800',
      border: 'border-gray-700'
    },
    blue: { 
      primary: 'text-blue-400', 
      bg: 'bg-slate-900', 
      accent: 'text-blue-300',
      header: 'bg-slate-800',
      border: 'border-slate-700'
    },
    amber: { 
      primary: 'text-amber-400', 
      bg: 'bg-stone-900', 
      accent: 'text-amber-300',
      header: 'bg-stone-800',
      border: 'border-stone-700'
    },
    purple: { 
      primary: 'text-purple-400', 
      bg: 'bg-gray-900', 
      accent: 'text-purple-300',
      header: 'bg-gray-800',
      border: 'border-gray-700'
    },
    white: {
      primary: 'text-gray-800',
      bg: 'bg-white',
      accent: 'text-blue-600',
      header: 'bg-gray-100',
      border: 'border-gray-300'
    },
    light: {
      primary: 'text-slate-700',
      bg: 'bg-slate-50',
      accent: 'text-indigo-600',
      header: 'bg-slate-200',
      border: 'border-slate-300'
    },
    retro: {
      primary: 'text-orange-400',
      bg: 'bg-black',
      accent: 'text-yellow-300',
      header: 'bg-gray-900',
      border: 'border-orange-600'
    },
    ocean: {
      primary: 'text-cyan-300',
      bg: 'bg-slate-800',
      accent: 'text-teal-300',
      header: 'bg-slate-700',
      border: 'border-cyan-500'
    },
    sunset: {
      primary: 'text-pink-300',
      bg: 'bg-purple-900',
      accent: 'text-orange-300',
      header: 'bg-purple-800',
      border: 'border-pink-500'
    }
  };

  // Remote commands for QuarkScript based on actual API
  const remoteCommands = [
    'CREATE PORTFOLIO',
    'LOAD PORTFOLIO',
    'VIEW PORTFOLIO',
    'BUY',
    'SELL',
    'SAVE',
    'CREATE WATCHLIST',
    'LOAD WATCHLIST', 
    'VIEW WATCHLIST',
    'ADD TO WATCHLIST',
    'STRATEGY CREATE',
    'STRATEGY LIST',
    'STRATEGY DELETE',
    'STRATEGY ENABLE',
    'STRATEGY DISABLE',
    'RUN STRATEGY',
    'GENERATE ADVICE',
    'use_algo',
    'create_algo',
    'list_algos',
    'get_algo',
    'delete_algo',
    'run_backtest',
    'EXIT'
  ];

  // Commands that require continuation
  const loadCommands = ['LOAD PORTFOLIO', 'LOAD WATCHLIST'];

  // Levenshtein distance for command suggestions
  const getLevenshteinDistance = (str1: string, str2: string): number => {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const substitutionCost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + substitutionCost
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  };

  // Enhanced command suggestions - alphabetical order
  const getSuggestedCommands = (input: string, maxSuggestions: number = 5): string[] => {
    const localCommands = [
      'alias', 'clear', 'cls', 'date', 'echo', 'help', 'help remote', 'history', 
      'ls', 'ps', 'pwd', 'reset', 'return origin', 'status', 'theme', 'fontsize', 
      'timestamp', 'whoami'
    ];
    const allCommands = [...localCommands, ...remoteCommands.map(cmd => cmd.toLowerCase())];
    
    if (input.length < 3) return [];
    
    const suggestions = allCommands
      .filter(cmd => cmd.toLowerCase().startsWith(input.toLowerCase().trim()))
      .sort() // Alphabetical order
      .slice(0, maxSuggestions);
      
    return suggestions;
  };

  const currentTheme = themes[theme];

  // Check for auth token on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedToken = localStorage.getItem('quarksFinanceToken');
        if (storedToken) {
          setToken(storedToken);
        }
      } catch (error) {
        console.warn('Could not access localStorage:', error);
      }
    }
  }, []);

  // Focus input when terminal opens
  useEffect(() => {
    if (isVisible && inputRef.current && !isMinimized) {
      inputRef.current.focus();
      setIsFocused(true);
    }
  }, [isVisible, isMinimized]);

  // Handle keyboard shortcuts (only when not managed)
  useEffect(() => {
    if (isManaged) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key === 'T') {
        e.preventDefault();
        if (!isVisible) {
          onClose();
        } else if (isMinimized) {
          setIsMinimized(false);
        }
      }
      
      if (e.key === 'Escape' && isVisible && !isMinimized) {
        setIsMinimized(true);
      }

      // Ctrl + L to clear terminal
      if (e.ctrlKey && e.key === 'l' && isVisible) {
        e.preventDefault();
        handleLocalCommand('clear');
      }
      
      // Ctrl + Shift + C to copy selected text
      if (e.ctrlKey && e.shiftKey && e.key === 'C' && isVisible) {
        e.preventDefault();
        document.execCommand('copy');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, isMinimized, onClose, isManaged]);

  // Scroll to bottom when output changes
  useEffect(() => {
    if (terminalRef.current && !isMinimized) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [output, isMinimized]);

  // Handle resizing (only when not managed)
  useEffect(() => {
    if (isManaged) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const windowHeight = window.innerHeight;
      const newHeight = windowHeight - e.clientY;
      
      setHeight(Math.min(Math.max(newHeight, 100), windowHeight * 0.8));
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
    };
    
    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, isManaged]);

  const addOutput = (content: string, type: TerminalOutput['type'] = 'output', jsonMetadata?: TerminalOutput['jsonMetadata']) => {
    const newOutput: TerminalOutput = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
      jsonMetadata
    };
    
    setOutput(prev => {
      const updated = [...prev, newOutput];
      // Limit history if needed
      if (updated.length > maxHistory) {
        return updated.slice(-maxHistory);
      }
      return updated;
    });
  };

  // Parse command for filter options
  const parseCommandForFilters = (cmd: string): { command: string; filterSections: string[] } => {
    const filterMatch = cmd.match(/--filterby:([^\s]+)/);
    if (filterMatch) {
      const filterSections = filterMatch[1].split(',').map(s => s.trim());
      const cleanCommand = cmd.replace(/--filterby:[^\s]+/, '').trim();
      return { command: cleanCommand, filterSections };
    }
    return { command: cmd.trim(), filterSections: [] };
  };

  // Toggle section collapse state
  const toggleSectionCollapse = (sectionPath: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionPath]: !prev[sectionPath]
    }));
  };

  // Collapsible JSON section component
const CollapsibleJsonSection = ({ 
  data, 
  path = '', 
  filterSections = [],
  onToggle,
  collapsedSections = {}
}: { 
  data: any; 
  path?: string; 
  filterSections?: string[];
  onToggle: (sectionPath: string) => void;
  collapsedSections: Record<string, boolean>;
}) => {
  if (typeof data !== 'object' || data === null) {
    return <span>{JSON.stringify(data)}</span>;
  }

  const entries = Object.entries(data);
  
  // Apply filtering if filterSections is provided
  const filteredEntries = filterSections && filterSections.length > 0 
    ? entries.filter(([key]) => filterSections.includes(key)) 
    : entries;

  if (filteredEntries.length === 0) {
    return <span>{"{}"}</span>;
  }

  return (
    <div className="ml-4">
      {"{"}
      {filteredEntries.map(([key, value], index) => {
        const itemPath = path ? `${path}.${key}` : key;
        const isCollapsed = collapsedSections[itemPath];
        const isObject = typeof value === 'object' && value !== null;
        const isLast = index === filteredEntries.length - 1;
        
        return (
          <div key={itemPath} className="mt-1">
            <div className="flex items-start">
              {isObject && (
                <button 
                  onClick={() => onToggle(itemPath)}
                  className="mr-1 text-xs text-gray-400 hover:text-gray-200 focus:outline-none"
                  aria-label={isCollapsed ? `Expand ${key}` : `Collapse ${key}`}
                >
                  {isCollapsed ? '▶' : '▼'}
                </button>
              )}
              <span className="text-cyan-400">
                {key}:
              </span>
              {isObject ? (
                <div className="ml-2 flex-1">
                  {isCollapsed ? (
                    <span className="text-gray-400">
                      {Array.isArray(value) ? `[...]` : `{...}`}
                    </span>
                  ) : (
                    <CollapsibleJsonSection 
                      data={value} 
                      path={itemPath} 
                      filterSections={filterSections}
                      onToggle={onToggle}
                      collapsedSections={collapsedSections}
                    />
                  )}
                </div>
              ) : (
                <span className="ml-2 text-green-400">
                  {JSON.stringify(value)}
                  {!isLast && ','}
                </span>
              )}
            </div>
            {!isLast && !isCollapsed && <div className="text-gray-400">,</div>}
          </div>
        );
      })}
      {"}"}
    </div>
  );
};

  // Enhanced formatData function with collapsible sections and filtering
  const formatData = (data: any, indent: number = 0, path: string = '', filterSections?: string[]): string => {
    const spaces = '  '.repeat(indent);
    const nextIndent = indent + 1;
    const nextSpaces = '  '.repeat(nextIndent);
    const sectionPath = path;
    
    if (typeof data === 'string') return `"${data}"`;
    if (typeof data === 'number') return data.toString();
    if (typeof data === 'boolean') return data ? 'true' : 'false';
    if (data === null) return 'null';
    if (data === undefined) return 'undefined';
    
    if (Array.isArray(data)) {
      if (data.length === 0) return '[]';
      
      const formattedItems = data.map((item, index) => {
        const itemPath = `${sectionPath}[${index}]`;
        const formattedItem = formatData(item, nextIndent, itemPath, filterSections);
        return `${nextSpaces}[${index}] ${formattedItem}`;
      });
      
      return '[\n' + formattedItems.join('\n') + '\n' + spaces + ']';
    }
    
    if (typeof data === 'object') {
      const entries = Object.entries(data);
      if (entries.length === 0) return '{}';
      
      // Apply filtering if filterSections is provided
      const filteredEntries = filterSections && filterSections.length > 0 
        ? entries.filter(([key]) => filterSections.includes(key)) 
        : entries;
      
      if (filteredEntries.length === 0) return '{}';
      
      const formattedEntries = filteredEntries.map(([key, value]) => {
        const itemPath = path ? `${path}.${key}` : key;
        const formattedValue = formatData(value, nextIndent, itemPath, filterSections);
        
        // Special formatting for different value types
        if (typeof value === 'object' && value !== null) {
          return `${nextSpaces}├─ ${key}:\n${nextSpaces}│  ${formattedValue.split('\n').join(`\n${nextSpaces}│  `)}`;
        } else {
          return `${nextSpaces}├─ ${key}: ${formattedValue}`;
        }
      });
      
      // Change last entry to use └─ instead of ├─
      if (formattedEntries.length > 0) {
        const lastIndex = formattedEntries.length - 1;
        formattedEntries[lastIndex] = formattedEntries[lastIndex].replace('├─', '└─').replace(/│/g, ' ');
      }
      
      return '{\n' + formattedEntries.join('\n') + '\n' + spaces + '}';
    }
    
    return String(data);
  };

  const splitCommands = (input: string): string[] => {
    // Split by semicolon but preserve semicolons inside quotes
    const commands: string[] = [];
    let currentCommand = '';
    let inQuotes = false;
    let quoteChar = '';
    
    for (let i = 0; i < input.length; i++) {
      const char = input[i];
      
      if ((char === '"' || char === "'") && !inQuotes) {
        inQuotes = true;
        quoteChar = char;
        currentCommand += char;
      } else if (char === quoteChar && inQuotes) {
        inQuotes = false;
        quoteChar = '';
        currentCommand += char;
      } else if (char === ';' && !inQuotes) {
        if (currentCommand.trim()) {
          commands.push(currentCommand.trim());
        }
        currentCommand = '';
      } else {
        currentCommand += char;
      }
    }
    
    if (currentCommand.trim()) {
      commands.push(currentCommand.trim());
    }
    
    return commands;
  };

  const isLoadCommand = (cmd: string): boolean => {
    const upperCmd = cmd.trim().toUpperCase();
    return loadCommands.some(loadCmd => upperCmd.startsWith(loadCmd));
  };

  const loadPortfolioFromBackend = async (portfolioId: string): Promise<{ success: boolean; data?: any; error?: string }> => {
    if (!token) {
      return { success: false, error: 'Authentication token missing' };
    }

    try {
      const response = await fetch(`https://thecodeworks.in/quarksfinance/api/portfolios/${portfolioId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': token,
        }
      });

      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}` };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: 'Network error or timeout' };
    }
  };

  const handleLoadPortfolio = async (cmd: string): Promise<boolean> => {
    // Extract ID from command like "LOAD PORTFOLIO id=96"
    // More robust regex to handle various formats
    const match = cmd.match(/id\s*=\s*([^\s]+)/i);
    if (!match) {
      addOutput('Error: Missing portfolio ID. Use: LOAD PORTFOLIO id=<id>', 'error');
      return false;
    }

    const portfolioId = match[1];
    const result = await loadPortfolioFromBackend(portfolioId);

    if (result.success && result.data) {
      setCurrentPortfolioId(portfolioId);
      const portfolioName = result.data.name || result.data.portfolio_name || 'Unknown';
      addOutput(`Loaded portfolio '${portfolioName}' (ID: ${portfolioId}) from backend.`, 'success');
      return true;
    } else {
      addOutput(`Error: Could not load portfolio ID ${portfolioId} (${result.error}).`, 'error');
      return false;
    }
  };

  const handleViewPortfolio = async (): Promise<void> => {
    if (!currentPortfolioId) {
      addOutput('No portfolio loaded. Use LOAD PORTFOLIO first.', 'error');
      return;
    }

    const result = await loadPortfolioFromBackend(currentPortfolioId);
    
    if (result.success && result.data) {
      addOutput('--- Portfolio Details ---', 'info');
      const formattedData = formatData(result.data);
      addOutput(formattedData, 'output');
      addOutput('-------------------------', 'info');
    } else {
      addOutput(`Error: Could not fetch portfolio details (${result.error}).`, 'error');
    }
  };

  const handleLocalCommand = (cmd: string): boolean => {
    const parts = cmd.trim().toLowerCase().split(' ');
    const baseCmd = parts[0];
    const fullCmd = cmd.trim().toLowerCase();
    
    // Parse command for filters
    const { command: cleanCommand, filterSections } = parseCommandForFilters(cmd);
    const cleanParts = cleanCommand.split(' ');
    const cleanBaseCmd = cleanParts[0];
    
    switch (cleanBaseCmd) {
      case 'help':
        if (parts[1] === 'remote') {
          addOutput(`Available Commands:
Portfolio Management:
  CREATE PORTFOLIO name=<name> cash=<amount>
  LOAD PORTFOLIO id=<portfolio_id>
  VIEW PORTFOLIO
  BUY symbol=<symbol> quantity=<shares>
  SELL symbol=<symbol> quantity=<shares>
  SAVE
Watchlist Management:
  CREATE WATCHLIST name=<name>
  LOAD WATCHLIST id=<watchlist_id>
  VIEW WATCHLIST
  ADD TO WATCHLIST symbol=<symbol> notes=<optional_notes>
  SAVE
Strategy Management:
  STRATEGY CREATE name=<name> symbol=<symbol> type=<MOMENTUM|BOLLINGER|MACROSS> [params...]
  STRATEGY LIST
  STRATEGY DELETE id=<strategy_id>
  STRATEGY ENABLE id=<strategy_id>
  STRATEGY DISABLE id=<strategy_id>
  RUN STRATEGY name=<strategy_name> symbol=<symbol> [params...]
Algorithm Management:
  use_algo <type> [param1=value1] [param2=value2] ...
    Available types: rsi, mean_reversion, momentum, volume_breakout, 
                     quantum_momentum, alpha_convergence, volatility_breakout, smart_money_flow
  create_algo <json_config>
  list_algos
  get_algo <id>
  delete_algo <id>
  run_backtest <id> [symbol=<symbol>] [start_date=<YYYY-MM-DD>] [end_date=<YYYY-MM-DD>] [initial_cash=<amount>]
Analysis:
  GENERATE ADVICE symbol=<symbol>
Other:
  EXIT

Multi-Command Support:
  Use semicolons (;) to execute multiple commands in one line
  Example: HELP; STATUS; CLEAR`, 'info');
        } else {
          addOutput(`Available Commands:
        
Local Commands:
  HELP                    - Show this help message
  HELP REMOTE             - Show QuarkScript API commands
  CLEAR, CLS             - Clear terminal output
  HISTORY [limit]        - Show command history (optional limit)
  THEME <color>          - Change theme (green, blue, amber, purple, white, light, retro, ocean, sunset)
  FONTSIZE <size>        - Change font size (10-24)
  TIMESTAMP              - Toggle timestamp display
  STATUS                 - Show terminal status
  RESET                  - Reset terminal to defaults
  RETURN ORIGIN          - Return to base QuarkScript prompt
  ALIAS <name> <command> - Create command alias
  ECHO <text>            - Display text
  DATE                   - Show current date/time
  WHOAMI                 - Show current user
  PWD                    - Show current directory
  LS                     - List directory contents
  PS                     - Show running processes
  
Accessibility:
  Ctrl+C                 - Return to base QuarkScript prompt
  Ctrl+L                 - Clear terminal
  Ctrl+Shift+C           - Copy selected text
  Shift+T                - Toggle terminal
  Escape                 - Minimize terminal
  Arrow Up/Down          - Navigate command history
  Tab                    - Auto-complete commands
  
Multi-Command Support:
  Use semicolons (;) to execute multiple commands in one line
  Example: HELP; STATUS; CLEAR
  
Algorithm Commands:
  use_algo <type> [param1=value1] [param2=value2] ...
    Create algorithm from built-in templates
  create_algo <json_config>
    Create custom algorithm from JSON configuration
  list_algos
    List all your algorithms
  get_algo <id>
    Get details of a specific algorithm
  delete_algo <id>
    Delete an algorithm
  run_backtest <id> [symbol=<symbol>] [start_date=<YYYY-MM-DD>] [end_date=<YYYY-MM-DD>] [initial_cash=<amount>]
    Run a backtest on an algorithm
  
Remote Commands:
  All other commands are sent to the QuarkScript server.`, 'info');
        }
        return true;
        
      case 'clear':
      case 'cls':
        setOutput([{
          id: Date.now().toString(),
          type: 'info',
          content: 'Terminal cleared.',
          timestamp: new Date()
        }]);
        return true;
        
      case 'history':
        const limit = parts[1] ? parseInt(parts[1]) : commandHistory.length;
        const historyToShow = commandHistory.slice(-limit);
        if (historyToShow.length === 0) {
          addOutput('No command history available.', 'info');
        } else {
          const historyOutput = historyToShow
            .map((cmd, index) => `${historyToShow.length - index}: ${cmd}`)
            .reverse()
            .join('\n');
          addOutput(`Command History (last ${historyToShow.length}):\n${historyOutput}`, 'info');
        }
        return true;
        
      case 'theme':
        const newTheme = parts[1] as keyof typeof themes;
        if (newTheme && themes[newTheme]) {
          setTheme(newTheme);
          addOutput(`Theme changed to: ${newTheme}`, 'success');
        } else {
          addOutput('Available themes: green, blue, amber, purple, white, light, retro, ocean, sunset', 'error');
        }
        return true;
        
      case 'fontsize':
        const size = parseInt(parts[1]);
        if (size >= 10 && size <= 24) {
          setFontSize(size);
          addOutput(`Font size changed to: ${size}px`, 'success');
        } else {
          addOutput('Font size must be between 10-24px', 'error');
        }
        return true;
        
      case 'timestamp':
        setShowTimestamps(!showTimestamps);
        addOutput(`Timestamps ${!showTimestamps ? 'enabled' : 'disabled'}`, 'success');
        return true;
        
      case 'status':
        addOutput(`Terminal Status:
  Theme: ${theme}
  Font Size: ${fontSize}px
  Max History: ${maxHistory}
  Timestamps: ${showTimestamps ? 'enabled' : 'disabled'}
  Auth Token: ${token ? 'present' : 'missing'}
  Output Lines: ${output.length}
  Command History: ${commandHistory.length}
  Continuation Mode: ${continuationMode ? 'active' : 'inactive'}
  Current Portfolio: ${currentPortfolioId || 'none'}
  Focus State: ${isFocused ? 'focused' : 'blurred'}`, 'info');
        return true;
        
      case 'reset':
        setTheme('green');
        setFontSize(14);
        setMaxHistory(100);
        setShowTimestamps(false);
        setContinuationMode(null);
        setCurrentPortfolioId(null);
        addOutput('Terminal reset to default settings.', 'success');
        return true;
        
      case 'return':
        if (parts[1] === 'origin') {
          setCurrentPortfolioId(null);
          setContinuationMode(null);
          addOutput('Returned to base QuarkScript prompt.', 'success');
          return true;
        }
        return false;
        
      case 'alias':
        addOutput('Alias management not yet implemented.', 'info');
        return true;
        
      case 'echo':
        const text = cmd.substring(5); // Remove 'echo ' from command
        addOutput(text, 'output');
        return true;
        
      case 'date':
        addOutput(new Date().toString(), 'output');
        return true;
        
      case 'whoami':
        addOutput(token ? 'Authenticated User' : 'Guest User', 'output');
        return true;
        
      case 'pwd':
        addOutput('/quarks/terminal', 'output');
        return true;
        
      case 'ls':
        addOutput('portfolio-1.json  strategy-2.json  watchlist-3.json', 'output');
        return true;
        
      case 'ps':
        addOutput('quarks-terminal  quarks-engine  quarks-api', 'output');
        return true;
        
      default:
        return false;
    }
  };

  const executeRemoteCommand = async (cmd: string) => {
    // Parse command for filters
    const { command: cleanCommand, filterSections } = parseCommandForFilters(cmd);
    
    // Handle special portfolio commands
    const upperCmd = cleanCommand.trim().toUpperCase();
    
    if (upperCmd.startsWith('LOAD PORTFOLIO')) {
      const success = await handleLoadPortfolio(cleanCommand);
      return success;
    }
    
    if (upperCmd === 'VIEW PORTFOLIO') {
      await handleViewPortfolio();
      return true;
    }

    // Handle other remote commands
    if (!token) {
      addOutput('Error: Authentication token missing. Please login first.', 'error');
      return false;
    }

    try {
      const response = await fetch('https://thecodeworks.in/quarksfinance/api/terminal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': token,
        },
        body: JSON.stringify({ command: cleanCommand })
      });

      const data = await response.json();

      if (response.ok && data) {
        // Format data with filter support
        const formattedResult = formatData(data.result || data, 0, '', filterSections);
        addOutput(formattedResult, 'output', {
          isJson: true,
          collapsedSections: {},
          filterSections
        });
        return true;
      } else {
        const errorMsg = data.message || 'Something went wrong';
        addOutput(`Error: ${errorMsg}`, 'error');
        
        // Suggest similar commands if it might be a typo
        const suggestions = getSuggestedCommands(cleanCommand);
        if (suggestions.length > 0) {
          addOutput(`Did you mean: ${suggestions.join(', ')}?`, 'info');
        }
        return false;
      }
    } catch (err) {
      addOutput('Error: Failed to connect to server. Check your connection.', 'error');
      
      // Still provide suggestions for potential command typos
      const suggestions = getSuggestedCommands(cleanCommand);
      if (suggestions.length > 0) {
        addOutput(`If this was a command typo, did you mean: ${suggestions.join(', ')}?`, 'info');
      }
      return false;
    }
  };

  const executeCommands = async (commands: string[]) => {
    setLoading(true);
    
    for (let i = 0; i < commands.length; i++) {
      const cmd = commands[i].trim();
      if (!cmd) continue;
      
      // Add command to output
      addOutput(`QuarkScript> ${cmd}`, 'command');
      
      // Check if it's a local command
      if (handleLocalCommand(cmd)) {
        continue;
      }
      
      // Check if it's a load command and needs continuation
      if (isLoadCommand(cmd) && i === commands.length - 1) {
        // Check if ID is already provided in the command with a more robust approach
        const upperCmd = cmd.toUpperCase();
        // Extract the ID parameter more carefully
        const idMatch = cmd.match(/id\s*=\s*([^\s]+)/i);
        const hasId = !!idMatch && idMatch[1].trim() !== '';
        
        // Only enter continuation mode if no ID is provided
        if (!hasId) {
          const loadType = upperCmd.includes('PORTFOLIO') ? 'PORTFOLIO' : 'WATCHLIST';
          setContinuationMode({
            command: cmd,
            prompt: `${cmd} id=`
          });
          addOutput(`${cmd} id=`, 'info');
          setLoading(false);
          return;
        }
        // If ID is provided, execute the command directly
      }
      
      // Execute remote command
      await executeRemoteCommand(cmd);
    }
    
    setLoading(false);
  };

  const executeCommand = async () => {
    if (!command.trim()) return;

    // Add command to history
    setCommandHistory(prev => [...prev, command]);
    setHistoryIndex(-1);
    
    // Handle continuation mode
    if (continuationMode) {
      // For continuation mode, we just append the ID to the original command
      const fullCommand = `${continuationMode.command} id=${command}`;
      addOutput(`${continuationMode.prompt}${command}`, 'command');
      setContinuationMode(null);
      setLoading(true);
      await executeRemoteCommand(fullCommand);
      setLoading(false);
      setCommand('');
      return;
    }
    
    // Split commands by semicolon and execute
    const commands = splitCommands(command);
    await executeCommands(commands);
    
    setCommand('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      if (commandHistory.length === 0) return;

      let newIndex = historyIndex;

      if (e.key === 'ArrowUp' && historyIndex < commandHistory.length - 1) {
        newIndex = historyIndex + 1;
      } else if (e.key === 'ArrowDown' && historyIndex > -1) {
        newIndex = historyIndex - 1;
      }

      setHistoryIndex(newIndex);
      setCommand(newIndex === -1 ? '' : commandHistory[commandHistory.length - 1 - newIndex]);
      setAutocompleteSuggestion(''); // Clear suggestion when navigating history
    }
    
    if (e.key === 'Enter') {
      executeCommand();
      setAutocompleteSuggestion(''); // Clear suggestion after execution
    }

    // Handle Ctrl+C to return to QuarkScript prompt (instead of cancelling)
    if (e.ctrlKey && e.key === 'c') {
      e.preventDefault();
      if (continuationMode) {
        setContinuationMode(null);
        addOutput('^C', 'info');
        setCommand('');
      } else {
        // If in portfolio context, return to base prompt
        if (currentPortfolioId) {
          setCurrentPortfolioId(null);
          addOutput('^C', 'info');
          setCommand('');
        } else {
          // Just add ^C to output and return to prompt
          addOutput('^C', 'info');
          setCommand('');
        }
      }
      setAutocompleteSuggestion(''); // Clear suggestion
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      // Tab completion - only when there's a suggestion
      if (autocompleteSuggestion && command) {
        const fullSuggestion = autocompleteSuggestion;
        setCommand(fullSuggestion);
        setAutocompleteSuggestion('');
      } else {
        // Generate new suggestions if none exist
        const suggestions = getSuggestedCommands(command);
        if (suggestions.length > 0) {
          setAutocompleteSuggestion(suggestions[0]);
        }
      }
    }

    // Escape key cancels continuation mode or suggestions
    if (e.key === 'Escape') {
      if (continuationMode) {
        e.stopPropagation();
        setContinuationMode(null);
        addOutput('Continuation mode cancelled.', 'info');
        setCommand('');
      }
      setAutocompleteSuggestion(''); // Clear suggestion
    }
  };

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const getOutputColor = (type: TerminalOutput['type']) => {
    switch (type) {
      case 'command': return currentTheme.accent;
      case 'error': return theme === 'white' || theme === 'light' ? 'text-red-600' : 'text-red-400';
      case 'success': return theme === 'white' || theme === 'light' ? 'text-green-600' : 'text-green-400';
      case 'info': return theme === 'white' || theme === 'light' ? 'text-blue-600' : 'text-cyan-400';
      default: return currentTheme.primary;
    }
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  const getPromptText = () => {
    if (continuationMode) {
      return continuationMode.prompt;
    }
    if (currentPortfolioId) {
      return `PORTFOLIO(${currentPortfolioId})>`;
    }
    return 'QuarkScript>';
  };

  if (!isVisible) return null;

  // When managed, we only render the terminal content without headers or resize handles
  if (isManaged) {
    return (
      <div className={`h-full ${currentTheme.bg} font-mono relative`}>
        {/* Terminal Content Only */}
        <div 
          ref={terminalRef}
          className={`p-4 h-[calc(100%-2.5rem)] overflow-y-auto ${currentTheme.bg}`}
          style={{ fontSize: `${fontSize}px` }}
          role="log"
          aria-live="polite"
          aria-label="Terminal output"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        >
          {output.map((item) => (
            <div 
              key={item.id} 
              className={`mb-1 ${getOutputColor(item.type)} whitespace-pre-wrap`}
              role="log"
              tabIndex={0}
              aria-label={`Terminal output: ${item.type}`}
            >
              {showTimestamps && (
                <span className={`${theme === 'white' || theme === 'light' ? 'text-gray-400' : 'text-gray-500'} text-xs mr-2`}>
                  [{formatTimestamp(item.timestamp)}]
                </span>
              )}
              <div className="font-mono">
                {item.content}
              </div>
            </div>
          ))}
          
          {loading && (
            <div className={`flex items-center gap-2 ${currentTheme.accent}`} role="status" aria-live="polite">
              <div className="animate-pulse">Executing command...</div>
              <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full"></div>
            </div>
          )}
          
          <div className="flex items-center mt-2 relative">
            <span className={`${currentTheme.accent} mr-2`}>{getPromptText()}</span>
            <div className="relative flex-grow">
              <input
                ref={inputRef}
                type="text"
                value={command}
                onChange={(e) => {
                  setCommand(e.target.value);
                  // Update suggestions as user types (only if 3+ chars)
                  if (e.target.value.trim().length >= 3) {
                    const suggestions = getSuggestedCommands(e.target.value);
                    setAutocompleteSuggestion(suggestions.length > 0 ? suggestions[0] : '');
                  } else {
                    setAutocompleteSuggestion('');
                  }
                }}
                onKeyDown={handleKeyDown}
                className={`bg-transparent outline-none ${currentTheme.primary} font-mono w-full`}
                style={{ fontSize: `${fontSize}px` }}
                autoFocus
                disabled={loading}
                aria-label="Terminal command input"
                autoComplete="off"
                spellCheck="false"
                placeholder={continuationMode ? "Enter ID..." : ""}
              />
              {/* Autocomplete ghost text */}
              {autocompleteSuggestion && command && (
                <div className={`absolute inset-0 pointer-events-none ${currentTheme.primary} font-mono`} 
                     style={{ fontSize: `${fontSize}px`, opacity: 0.5, zIndex: 10 }}>
                    <span className="invisible">{command}</span>
                    <span>{autocompleteSuggestion.substring(command.length)}</span>
                  </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Standalone mode - full terminal with headers and resize handles
  return (
    <div 
      className={`fixed bottom-0 left-0 right-0 z-50 ${currentTheme.border} border-t shadow-2xl ${isMinimized ? 'h-10' : ''}`}
      style={{
        backgroundColor: theme === 'white' || theme === 'light' ? '#ffffff' : '#1e1e1e',
        height: isMinimized ? '2.5rem' : `${height}px`
      }}
      role="dialog"
      aria-label="Terminal Interface"
      aria-describedby="terminal-content"
    >
      {/* Resize Handle */}
      {!isMinimized && (
        <div
          className={`absolute top-0 left-0 right-0 h-2 cursor-ns-resize hover:${theme === 'white' || theme === 'light' ? 'bg-gray-300' : 'bg-gray-600'} transition-colors`}
          onMouseDown={startResize}
          role="separator"
          aria-label="Resize terminal"
        >
          <div className="flex justify-center pt-1">
            <div className={`w-8 h-1 ${theme === 'white' || theme === 'light' ? 'bg-gray-400' : 'bg-gray-600'} rounded-full`}></div>
          </div>
        </div>
      )}
      
      {/* Terminal Header */}
      <div className={`flex justify-between items-center px-4 py-2 ${currentTheme.header} ${currentTheme.border} border-b mt-2`}>
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5" role="group" aria-label="Window controls">
            <div className="w-3 h-3 bg-red-500 rounded-full" aria-label="Close"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full" aria-label="Minimize"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full" aria-label="Maximize"></div>
          </div>
          <span className={`ml-2 text-sm ${theme === 'white' || theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>quarks-terminal-v2</span>
          <span className={`text-xs ${currentTheme.accent}`}>({theme})</span>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsMinimized(!isMinimized)}
            className={`${theme === 'white' || theme === 'light' ? 'text-gray-600 hover:text-black' : 'text-gray-400 hover:text-white'} text-sm`}
            aria-label={isMinimized ? "Restore terminal" : "Minimize terminal"}
          >
            {isMinimized ? '□' : '−'}
          </button>
          <button 
            onClick={onClose}
            className={`${theme === 'white' || theme === 'light' ? 'text-gray-600 hover:text-black' : 'text-gray-400 hover:text-white'} text-sm`}
            aria-label="Close terminal"
          >
            ×
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Terminal Content */}
          <div 
            ref={terminalRef}
            id="terminal-content"
            className={`p-4 h-[calc(100%-3.5rem)] overflow-y-auto ${currentTheme.bg} font-mono`}
            style={{ fontSize: `${fontSize}px` }}
            role="log"
            aria-live="polite"
            aria-label="Terminal output"
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          >
            {output.map((item) => (
              <div 
                key={item.id} 
                className={`mb-1 ${getOutputColor(item.type)} whitespace-pre-wrap`}
                role="log"
                tabIndex={0}
                aria-label={`Terminal output: ${item.type}`}
              >
                {showTimestamps && (
                  <span className={`${theme === 'white' || theme === 'light' ? 'text-gray-400' : 'text-gray-500'} text-xs mr-2`}>
                    [{formatTimestamp(item.timestamp)}]
                  </span>
                )}
                <div className="font-mono">
                  {/* Render collapsible JSON if metadata exists */}
                  {item.jsonMetadata?.isJson ? (
                    <div className="whitespace-pre-wrap">
                      {(() => {
                        try {
                          const jsonData = JSON.parse(item.content);
                          return (
                            <CollapsibleJsonSection 
                              data={jsonData} 
                              filterSections={item.jsonMetadata.filterSections}
                              onToggle={toggleSectionCollapse}
                              collapsedSections={collapsedSections}
                            />
                          );
                        } catch (e) {
                          // Fallback to regular content if JSON parsing fails
                          return item.content;
                        }
                      })()}
                    </div>
                  ) : (
                    item.content
                  )}
                </div>
              </div>
            ))}
            
            {loading && (
              <div className={`flex items-center gap-2 ${currentTheme.accent}`} role="status" aria-live="polite">
                <div className="animate-pulse">Executing command...</div>
                <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full"></div>
              </div>
            )}
            
            <div className="flex items-center mt-2 relative">
              <span className={`${currentTheme.accent} mr-2`}>{getPromptText()}</span>
              <div className="relative flex-grow">
                <input
                  ref={inputRef}
                  type="text"
                  value={command}
                  onChange={(e) => {
                    setCommand(e.target.value);
                    // Update suggestions as user types (only if 3+ chars)
                    if (e.target.value.trim().length >= 3) {
                      const suggestions = getSuggestedCommands(e.target.value);
                      setAutocompleteSuggestion(suggestions.length > 0 ? suggestions[0] : '');
                    } else {
                      setAutocompleteSuggestion('');
                    }
                  }}
                  onKeyDown={handleKeyDown}
                  className={`bg-transparent outline-none ${currentTheme.primary} font-mono w-full`}
                  style={{ fontSize: `${fontSize}px` }}
                  autoFocus
                  disabled={loading}
                  aria-label="Terminal command input"
                  autoComplete="off"
                  spellCheck="false"
                  placeholder={continuationMode ? "Enter ID..." : ""}
                />
                {/* Autocomplete ghost text */}
                {autocompleteSuggestion && command && (
                  <div className={`absolute inset-0 pointer-events-none ${currentTheme.primary} font-mono`} 
                       style={{ fontSize: `${fontSize}px`, opacity: 0.5, zIndex: 10 }}>
                    <span className="invisible">{command}</span>
                    <span>{autocompleteSuggestion.substring(command.length)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default TerminalInterface;