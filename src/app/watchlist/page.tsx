"use client";
import Navbar from '../../components/navigation/Navbar';
import Link from 'next/link';
import TerminalManager from '../../components/ui/TerminalManager';
import { useState, useEffect } from 'react';
import Watchlist from '../../components/dashboard/Watchlist';

export default function WatchlistPage() {
  const [showTerminal, setShowTerminal] = useState(false);
  
  // Add keyboard event listener for terminal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Shift+T (terminal)
      if (e.shiftKey && e.key === 'T') {
        e.preventDefault();
        setShowTerminal(true);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <nav className="px-6 mt-4 flex items-center gap-4 text-sm">
        <Link href="/home" className="text-black text-2xl" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>Home</Link>
        <span className="text-black text-2xl" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>&gt;</span>
        <Link href="/watchlist" className="text-black text-2xl" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>Watchlists</Link>
      </nav>
      <div className="container mx-auto px-4 md:px-40 py-8">
        <Watchlist />
      </div>
      <TerminalManager 
        isVisible={showTerminal}
        onClose={() => setShowTerminal(false)}
      />
    </main>
  );
}