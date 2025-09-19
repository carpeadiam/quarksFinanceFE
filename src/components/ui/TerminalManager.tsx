'use client';

import { useState, useEffect, useRef } from 'react';
import TerminalInterface from './TerminalInterface';

interface TerminalInstance {
  id: string;
  name: string;
  isActive: boolean;
}

function TerminalManager({ isVisible, onClose }: { isVisible: boolean; onClose: () => void }) {
  const [terminals, setTerminals] = useState<TerminalInstance[]>([
    { id: '1', name: 'Terminal 1', isActive: true }
  ]);
  const [nextId, setNextId] = useState(2);
  const [editingTerminalId, setEditingTerminalId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [height, setHeight] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
  const editInputRef = useRef<HTMLInputElement>(null);
  const terminalContentRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef(0);

  // Focus active terminal when terminals change
  useEffect(() => {
    if (terminals.length > 0 && !terminals.some(t => t.isActive)) {
      setTerminals(prev => prev.map((t, i) => i === 0 ? {...t, isActive: true} : t));
    }
  }, [terminals]);

  // Focus input when editing
  useEffect(() => {
    if (editingTerminalId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingTerminalId]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle Shift+T to close terminal when it's visible
      if (e.shiftKey && e.key === 'T' && isVisible) {
        e.preventDefault();
        // Close the terminal entirely when Shift+T is pressed while visible
        closeManager();
      }
      
      // Handle Escape key to minimize terminal
      if (e.key === 'Escape' && isVisible && !isMinimized) {
        e.preventDefault();
        setIsMinimized(true);
      }
      
      // Handle F11 for fullscreen toggle
      if (e.key === 'F11' && isVisible && !isMinimized) {
        e.preventDefault();
        setIsFullscreen(!isFullscreen);
      }
    };

    // Add event listener regardless of visibility to ensure consistent behavior
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isVisible, isMinimized, isFullscreen]);

  // Handle scrolling when minimizing/restoring
  useEffect(() => {
    if (!terminalContentRef.current) return;

    if (isMinimized) {
      // Save scroll position when minimizing
      scrollPositionRef.current = terminalContentRef.current.scrollTop;
    } else {
      // Restore scroll position when restoring
      terminalContentRef.current.scrollTop = scrollPositionRef.current;
    }
  }, [isMinimized]);

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

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const addTerminal = () => {
    if (terminals.length >= 4) return; // Limit to 4 terminals
    
    const newTerminal: TerminalInstance = {
      id: nextId.toString(),
      name: `Terminal ${nextId}`,
      isActive: false
    };
    
    setTerminals(prev => [...prev, newTerminal]);
    setNextId(prev => prev + 1);
  };

  const removeTerminal = (id: string) => {
    if (terminals.length <= 1) return; // Keep at least one terminal
    
    setTerminals(prev => {
      const newTerminals = prev.filter(t => t.id !== id);
      if (prev.find(t => t.id === id)?.isActive && newTerminals.length > 0) {
        // Activate the first terminal if we're removing the active one
        newTerminals[0].isActive = true;
      }
      return newTerminals;
    });
  };

  const activateTerminal = (id: string) => {
    setTerminals(prev => prev.map(t => ({
      ...t,
      isActive: t.id === id
    })));
  };

  const closeManager = () => {
    // Reset to single terminal when closing
    setTerminals([{ id: '1', name: 'Terminal 1', isActive: true }]);
    setNextId(2);
    setEditingTerminalId(null);
    setIsMinimized(false); // Reset minimize state when closing
    setIsFullscreen(false); // Reset fullscreen state when closing
    onClose();
  };

  const startEditing = (id: string, currentName: string) => {
    setEditingTerminalId(id);
    setEditValue(currentName);
  };

  const saveEdit = (id: string) => {
    if (editValue.trim()) {
      setTerminals(prev => prev.map(t => 
        t.id === id ? { ...t, name: editValue.trim() } : t
      ));
    }
    setEditingTerminalId(null);
    setEditValue('');
  };

  const cancelEdit = () => {
    setEditingTerminalId(null);
    setEditValue('');
  };

  const handleEditKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter') {
      saveEdit(id);
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed bottom-0 left-0 z-50 border-t border-l shadow-2xl bg-gray-900 border-gray-700 ${isMinimized ? 'h-10' : ''} ${isFullscreen ? 'fixed inset-0 h-screen w-screen rounded-none' : 'right-0 rounded-tl-lg'}`} 
         style={{ 
           height: isMinimized ? '2.5rem' : (isFullscreen ? '100vh' : `${height}px`)
         }}>
      {/* Resize Handle */}
      {!isMinimized && !isFullscreen && (
        <div
          className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize hover:bg-gray-600 transition-colors"
          onMouseDown={startResize}
        >
          <div className="flex justify-center pt-1">
            <div className="w-8 h-1 bg-gray-600 rounded-full"></div>
          </div>
        </div>
      )}
      
      {/* Terminal Header with Tabs */}
      <div className="flex justify-between items-center px-4 py-2 bg-gray-800 border-b border-gray-700 mt-2">
        <div className="flex items-center gap-1">
          {terminals.map(terminal => (
            <div 
              key={terminal.id}
              className={`px-3 py-1 text-sm cursor-pointer flex items-center gap-2 ${
                terminal.isActive 
                  ? 'bg-gray-900 text-green-400' 
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
              onClick={() => activateTerminal(terminal.id)}
            >
              {editingTerminalId === terminal.id ? (
                <input
                  ref={editInputRef}
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => saveEdit(terminal.id)}
                  onKeyDown={(e) => handleEditKeyDown(e, terminal.id)}
                  className="bg-gray-700 text-white px-1 rounded"
                  style={{ width: '100px' }}
                />
              ) : (
                <span 
                  onDoubleClick={() => startEditing(terminal.id, terminal.name)}
                  className="truncate"
                  style={{ maxWidth: '120px' }}
                >
                  {terminal.name}
                </span>
              )}
              {terminals.length > 1 && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTerminal(terminal.id);
                  }}
                  className="text-gray-500 hover:text-white"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          {terminals.length < 4 && (
            <button 
              onClick={addTerminal}
              className="px-2 py-1 bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white rounded text-lg font-bold"
              aria-label="Add terminal"
            >
              +
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="text-gray-400 hover:text-white text-sm"
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? '❐' : '□'}
          </button>
          <button 
            onClick={() => setIsMinimized(!isMinimized)}
            className="text-gray-400 hover:text-white text-sm"
            aria-label={isMinimized ? "Restore terminal" : "Minimize terminal"}
          >
            {isMinimized ? '□' : '−'}
          </button>
          <button 
            onClick={closeManager}
            className="text-gray-400 hover:text-white text-sm"
            aria-label="Close terminals"
          >
            ×
          </button>
        </div>
      </div>

      {!isMinimized && (
        // Terminal Content */}
        <div 
          ref={terminalContentRef}
          className="h-[calc(100%-3.5rem)] overflow-y-auto"
        >
          {terminals.map(terminal => (
            <div 
              key={terminal.id} 
              className={`h-full ${terminal.isActive ? 'block' : 'hidden'}`}
            >
              <TerminalInterface 
                isVisible={true} 
                onClose={() => {}} // Handled by TerminalManager
                isManaged={true}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TerminalManager;