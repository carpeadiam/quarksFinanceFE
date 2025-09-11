'use client';

import { useState, useEffect, useRef } from 'react';

interface TerminalOutput {
  id: string;
  type: 'command' | 'output' | 'error' | 'success' | 'info';
  content: string;
  timestamp: Date;
}

function TerminalInterface({ isVisible, onClose }: { isVisible: boolean; onClose: () => void }) {
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
  const [theme, setTheme] = useState<'green' | 'blue' | 'amber' | 'purple'>('green');
  const [showTimestamps, setShowTimestamps] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const themes = {
    green: { primary: 'text-green-400', bg: 'bg-gray-900', accent: 'text-green-300' },
    blue: { primary: 'text-blue-400', bg: 'bg-slate-900', accent: 'text-blue-300' },
    amber: { primary: 'text-amber-400', bg: 'bg-stone-900', accent: 'text-amber-300' },
    purple: { primary: 'text-purple-400', bg: 'bg-gray-900', accent: 'text-purple-300' }
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
    'EXIT'
  ];

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

  const getSuggestedCommands = (input: string, maxSuggestions: number = 3): string[] => {
    const localCommands = ['help', 'clear', 'cls', 'history', 'theme', 'fontsize', 'timestamp', 'status', 'reset', 'help remote'];
    const allCommands = [...localCommands, ...remoteCommands.map(cmd => cmd.toLowerCase())];
    
    const suggestions = allCommands
      .map(cmd => ({
        command: cmd,
        distance: getLevenshteinDistance(input.toLowerCase().trim(), cmd)
      }))
      .filter(item => item.distance <= Math.max(2, Math.floor(input.length / 3)))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, maxSuggestions)
      .map(item => item.command);
      
    return suggestions;
  };

  const currentTheme = themes[theme];

  // Check for auth token on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Using in-memory storage instead of localStorage
      const storedToken = 'dummy_token'; // Replace with actual token retrieval logic
      setToken(storedToken);
    }
  }, []);

  // Focus input when terminal opens
  useEffect(() => {
    if (isVisible && inputRef.current && !isMinimized) {
      inputRef.current.focus();
    }
  }, [isVisible, isMinimized]);

  // Handle keyboard shortcuts
  useEffect(() => {
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
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, isMinimized, onClose]);

  // Scroll to bottom when output changes
  useEffect(() => {
    if (terminalRef.current && !isMinimized) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [output, isMinimized]);

  // Handle resizing
  useEffect(() => {
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
  }, [isResizing]);

  const addOutput = (content: string, type: TerminalOutput['type'] = 'output') => {
    const newOutput: TerminalOutput = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date()
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

  const formatData = (data: any, indent: number = 0): string => {
    const spaces = '  '.repeat(indent);
    const nextIndent = indent + 1;
    const nextSpaces = '  '.repeat(nextIndent);
    
    if (typeof data === 'string') return `"${data}"`;
    if (typeof data === 'number') return data.toString();
    if (typeof data === 'boolean') return data ? 'true' : 'false';
    if (data === null) return 'null';
    if (data === undefined) return 'undefined';
    
    if (Array.isArray(data)) {
      if (data.length === 0) return '[]';
      
      const formattedItems = data.map((item, index) => {
        const formattedItem = formatData(item, nextIndent);
        return `${nextSpaces}[${index}] ${formattedItem}`;
      });
      
      return '[\n' + formattedItems.join('\n') + '\n' + spaces + ']';
    }
    
    if (typeof data === 'object') {
      const entries = Object.entries(data);
      if (entries.length === 0) return '{}';
      
      const formattedEntries = entries.map(([key, value]) => {
        const formattedValue = formatData(value, nextIndent);
        
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

  const handleLocalCommand = (cmd: string): boolean => {
    const parts = cmd.trim().toLowerCase().split(' ');
    const baseCmd = parts[0];
    
    switch (baseCmd) {
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
Analysis:
  GENERATE ADVICE symbol=<symbol>
Other:
  EXIT`, 'info');
        } else {
          addOutput(`Available Commands:
        
Local Commands:
  HELP                    - Show this help message
  HELP REMOTE             - Show QuarkScript API commands
  CLEAR, CLS             - Clear terminal output
  HISTORY [limit]        - Show command history (optional limit)
  THEME <color>          - Change theme (green, blue, amber, purple)
  FONTSIZE <size>        - Change font size (10-24)
  TIMESTAMP              - Toggle timestamp display
  STATUS                 - Show terminal status
  RESET                  - Reset terminal to defaults
  
Accessibility:
  Ctrl+L                 - Clear terminal
  Shift+T                - Toggle terminal
  Escape                 - Minimize terminal
  Arrow Up/Down          - Navigate command history
  
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
          addOutput('Available themes: green, blue, amber, purple', 'error');
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
  Command History: ${commandHistory.length}`, 'info');
        return true;
        
      case 'reset':
        setTheme('green');
        setFontSize(14);
        setMaxHistory(100);
        setShowTimestamps(false);
        addOutput('Terminal reset to default settings.', 'success');
        return true;
        
      default:
        return false;
    }
  };

  const executeCommand = async () => {
    if (!command.trim()) return;

    // Add command to history
    setCommandHistory(prev => [...prev, command]);
    setHistoryIndex(-1);
    
    // Add command to output
    addOutput(`QuarkScript> ${command}`, 'command');
    
    // Check if it's a local command
    if (handleLocalCommand(command)) {
      setCommand('');
      return;
    }
    
    // Check auth for remote commands
    if (!token) {
      addOutput('Error: Authentication token missing. Please login first.', 'error');
      setCommand('');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('https://thecodeworks.in/quarksfinance/api/terminal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': token,
        },
        body: JSON.stringify({ command })
      });

      const data = await response.json();

      if (response.ok && data) {
        const formattedResult = formatData(data.result || data);
        addOutput(formattedResult, 'output');
      } else {
        const errorMsg = data.message || 'Something went wrong';
        addOutput(`Error: ${errorMsg}`, 'error');
        
        // Suggest similar commands if it might be a typo
        const suggestions = getSuggestedCommands(command);
        if (suggestions.length > 0) {
          addOutput(`Did you mean: ${suggestions.join(', ')}?`, 'info');
        }
      }
    } catch (err) {
      addOutput('Error: Failed to connect to server. Check your connection.', 'error');
      
      // Still provide suggestions for potential command typos
      const suggestions = getSuggestedCommands(command);
      if (suggestions.length > 0) {
        addOutput(`If this was a command typo, did you mean: ${suggestions.join(', ')}?`, 'info');
      }
    } finally {
      setLoading(false);
      setCommand('');
    }
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
    }
    
    if (e.key === 'Enter') {
      executeCommand();
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      // Enhanced autocomplete with remote commands
      const allCommands = [
        'help', 'help remote', 'clear', 'cls', 'history', 'theme', 'fontsize', 
        'timestamp', 'status', 'reset', ...remoteCommands
      ];
      const matches = allCommands.filter(cmd => 
        cmd.toLowerCase().startsWith(command.toLowerCase().trim())
      );
      
      if (matches.length === 1) {
        setCommand(matches[0]);
      } else if (matches.length > 1) {
        // Show available completions
        addOutput(`Available completions: ${matches.slice(0, 8).join(', ')}${matches.length > 8 ? '...' : ''}`, 'info');
      } else {
        // Show suggestions for similar commands
        const suggestions = getSuggestedCommands(command);
        if (suggestions.length > 0) {
          addOutput(`Similar commands: ${suggestions.join(', ')}`, 'info');
        }
      }
    }
  };

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const getOutputColor = (type: TerminalOutput['type']) => {
    switch (type) {
      case 'command': return currentTheme.accent;
      case 'error': return 'text-red-400';
      case 'success': return 'text-green-400';
      case 'info': return 'text-cyan-400';
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

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed bottom-0 left-0 right-0 z-50 border-t border-gray-700 shadow-2xl ${isMinimized ? 'h-10' : ''}`}
      style={{
        backgroundColor: '#1e1e1e',
        height: isMinimized ? '2.5rem' : `${height}px`
      }}
      role="dialog"
      aria-label="Terminal Interface"
      aria-describedby="terminal-content"
    >
      {/* Resize Handle */}
      {!isMinimized && (
        <div
          className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize hover:bg-gray-600 transition-colors"
          onMouseDown={startResize}
          role="separator"
          aria-label="Resize terminal"
        >
          <div className="flex justify-center pt-1">
            <div className="w-8 h-1 bg-gray-600 rounded-full"></div>
          </div>
        </div>
      )}
      
      {/* Terminal Header */}
      <div className="flex justify-between items-center px-4 py-2 bg-gray-800 border-b border-gray-700 mt-2">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5" role="group" aria-label="Window controls">
            <div className="w-3 h-3 bg-red-500 rounded-full" aria-label="Close"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full" aria-label="Minimize"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full" aria-label="Maximize"></div>
          </div>
          <span className="text-gray-300 ml-2 text-sm">quarks-terminal-v2</span>
          <span className={`text-xs ${currentTheme.accent}`}>({theme})</span>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsMinimized(!isMinimized)}
            className="text-gray-400 hover:text-white text-sm"
            aria-label={isMinimized ? "Restore terminal" : "Minimize terminal"}
          >
            {isMinimized ? '□' : '−'}
          </button>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white text-sm"
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
                  <span className="text-gray-500 text-xs mr-2">
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
            
            <div className="flex items-center mt-2">
              <span className={`${currentTheme.accent} mr-2`}>QuarkScript&gt;</span>
              <input
                ref={inputRef}
                type="text"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                onKeyDown={handleKeyDown}
                className={`flex-grow bg-transparent outline-none ${currentTheme.primary}`}
                style={{ fontSize: `${fontSize}px` }}
                autoFocus
                disabled={loading}
                aria-label="Terminal command input"
                autoComplete="off"
                spellCheck="false"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default TerminalInterface;