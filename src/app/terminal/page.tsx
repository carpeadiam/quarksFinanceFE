'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/navigation/Navbar';
import Link from 'next/link';

export default function TerminalPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState<string[]>([]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const storedToken = localStorage.getItem('quarksFinanceToken');
    if (storedToken) {
      setToken(storedToken);
      setIsLoggedIn(true);
      setOutput([
        'Welcome to QuarkScript Terminal!',
        'Type HELP for available commands.'
      ]);
    } else {
      router.push('/login');
    }
  }, [router]);

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
      setInput(newIndex === -1 ? '' : commandHistory[commandHistory.length - 1 - newIndex]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !token) return;

    setCommandHistory(prev => [...prev, input]);
    setHistoryIndex(-1);
    setLoading(true);

    try {
      const response = await fetch('https://thecodeworks.in/quarksfinance/api/terminal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': token,
        },
        body: JSON.stringify({ command: input })
      });

      const data = await response.json();

      if (response.ok && data) {
        const formattedResult =
          typeof data.result === 'string'
            ? data.result
            : JSON.stringify(data.result, null, 2);

        setOutput(prev => [...prev, `QuarkScript> ${input}`, formattedResult]);
      } else {
        setOutput(prev => [...prev, `QuarkScript> ${input}`, `Error: ${data.message || 'Something went wrong'}`]);
      }
    } catch (err) {
      setOutput(prev => [...prev, `QuarkScript> ${input}`, 'Error executing command.']);
    } finally {
      setLoading(false);
      setInput('');
    }
  };

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [output]);

  if (!isLoggedIn) return null; // Wait for token check

  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      {/* Breadcrumb navigation */}
      <nav className="px-6 mt-4 flex items-center gap-4 text-sm">
        <Link href="/home" className="text-black text-2xl" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>Home</Link>
        <span className="text-black text-2xl" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>&gt;</span>
        <Link href="/terminal" className="text-black text-2xl" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>QuarkScript Terminal</Link>
      </nav>

      <div className="container mx-auto px-4 md:px-40 py-8">
      <div className="w-full px-4 mt-4">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-24 bg-white rounded-lg p-8 relative overflow-hidden border shadow-sm" style={{ minHeight: '100px' }}>
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'JetBrains Mono, monospace', color: '#4C555A' }}>
            QuarkScript Terminal
          </h1>
          <p className="text-black" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '17px' }}>
            Interactive terminal for portfolio management and strategy execution
          </p>
        </div>
        <div className="absolute left-196 w-full h-full">
          <img 
            src="/images/terminal1.svg" 
            alt="Portfolio illustration" 
            className="scale-148"
          />
        </div>
      </div>



      
<div className="text-center mb-4">
  <a 
    href="/terminaldocs" 
    className="inline-flex items-center gap-2 text-blue-600  hover:text-blue-800 hover:underline font-medium"
  >
    Learn more about QuarksScript - View Complete Documentation
    <svg 
      className="w-4 h-4" 
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24"
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d="M17 8l4 4m0 0l-4 4m4-4H3" 
      />
    </svg>
  </a>
</div>







        <div className="max-w-4xl mx-auto mb-12 bg-white p-8 rounded-xl border border-gray-200" style={{ fontFamily: 'Rubik, sans-serif' }}>
<div
  ref={terminalRef}
  className="h-96 bg-gray-900 text-green-400 font-mono p-4 overflow-y-auto rounded-lg mb-4 whitespace-pre-wrap"
>
  {output.map((line, i) => (
    <div key={i} className="mb-1">
      {typeof line === 'string' ? (
        line.split('\n').map((paragraph, j) => (
          <div key={j}>
            {paragraph}
            {j < line.split('\n').length - 1 && <br />}
          </div>
        ))
      ) : (
        <pre className="whitespace-pre-wrap">{JSON.stringify(line, null, 2)}</pre>
      )}
    </div>
  ))}
  {loading && (
    <div className="flex items-center gap-2">
      <div className="animate-pulse">Executing...</div>
    </div>
  )}
</div>

          <form onSubmit={handleSubmit} className="flex gap-2">
            <span className="text-green-400 font-mono">QuarkScript&gt;</span>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 shadow-sm text-gray-800 bg-gray-50 font-mono"
              disabled={loading || !token}
            />
            <button
              type="submit"
              className="px-6 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-700 focus:ring-offset-2 disabled:opacity-50 shadow-sm transition-colors duration-200"
              disabled={loading || !token}
            >
              Execute
            </button>
          </form>
        </div>
      </div>
      </div>
    </main>
  );
}
