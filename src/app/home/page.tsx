'use client';

import { useState, useEffect } from 'react';
import FeatureGrid from '../../components/dashboard/FeatureGrid';
import Navbar from '../../components/navigation/Navbar';
import Link from 'next/link';
import AudioPlayer from '../../components/ui/AudioPlayer';

export default function Home() {
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  const [lyricsData, setLyricsData] = useState('');
  const [keyPressTime, setKeyPressTime] = useState<number | null>(null);
  
  useEffect(() => {
    // Fetch lyrics data
    fetch('/api/lyrics')
      .then(response => response.text())
      .then(data => setLyricsData(data))
      .catch(error => console.error('Error loading lyrics:', error));
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl+Shift+Q
      if (e.ctrlKey && e.shiftKey && e.key === 'Q') {
        e.preventDefault();
        const now = Date.now();
        setKeyPressTime(now);
        
        // Set a timeout to check if 5 seconds have passed
        setTimeout(() => {
          setKeyPressTime(null);
        }, 5000);
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Q' && keyPressTime && Date.now() - keyPressTime < 5000) {
        setShowAudioPlayer(true);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [keyPressTime]);
  
  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <Link href="/home" className="mt-4 block ml-6 text-black text-xl" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>Home</Link>
      
      <div className="container mx-auto px-40 py-10">
        <h1 className="sr-only">QuarksLab Dashboard</h1>
        <FeatureGrid />
      </div>
      
      {showAudioPlayer && (
        <AudioPlayer 
          audioSrc="/api/audio"
          lyricsData={lyricsData}
          isVisible={showAudioPlayer}
          onClose={() => setShowAudioPlayer(false)}
        />
      )}
    </main>
  );
}