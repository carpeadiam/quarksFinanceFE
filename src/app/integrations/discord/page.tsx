'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../../components/navigation/Navbar';
import Link from 'next/link';
import LoadingSpinner from '@/src/components/ui/LoadingSpinner';

export default function DiscordIntegrationPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds

  // Generate code on page load
  useEffect(() => {
    const generateCode = async () => {
      try {
        const token = localStorage.getItem('quarksFinanceToken');
        if (!token) {
          router.push('/login');
          return;
        }

        const response = await fetch('https://thecodeworks.in/quarksfinance/api/discord/generate-code', {
          headers: {
            'x-access-token': token
          }
        });

        if (!response.ok) throw new Error('Failed to generate code');
        
        const data = await response.json();
        setCode(data.code);
        setLoading(false);
        
        // Start countdown timer
        const timer = setInterval(() => {
          setTimeLeft(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        return () => clearInterval(timer);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    };

    generateCode();
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-10 p-4 bg-red-50 border border-red-200 rounded-lg" style={{ fontFamily: 'Rubik, sans-serif'}}>
        <div className="flex items-center text-red-700">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{error}. Sure you logged in?</span>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white " style={{ fontFamily: 'Rubik, sans-serif'}}>
        <Navbar />
      
      {/* Breadcrumb navigation */}
      <nav className="px-6 mt-4 flex items-center gap-4 text-sm">
        <Link href="/home" className="text-black text-2xl" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>Home</Link>
        <span className="text-black text-2xl" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>&gt;</span>
        <Link href="/integrations/discord" className="text-black text-2xl" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>Integrations Discord</Link>
      </nav>
      <div className="max-w-md mx-auto bg-white p-8 rounded-lg border border-gray-200">
        <h1 className="text-2xl font-bold mb-6">Connect Discord Account</h1>
        
        <div className="mb-6">
          <p className="mb-4">1. Install our Discord bot:</p>
          <a 
            href="https://discord.com/oauth2/authorize?client_id=1384135959255191672" 
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-3 bg-[#5865F2] text-white rounded-md hover:bg-[#4752C4] transition-colors"
          >
            Install Discord Bot
          </a>
        </div>

      <div className="mb-6">
  <p className="mb-2">2. Use this verification code in Discord:</p>
  <div className="p-4 bg-gray-100 rounded-md flex items-center justify-between gap-2">
    <code className="text-sm font-mono break-all flex-1">
      {code}
    </code>
    <button
      onClick={() => {
        navigator.clipboard.writeText(code);
        // Optional: Add toast/notification here
      }}
      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-md transition-colors"
      title="Copy to clipboard"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
      </svg>
    </button>
  </div>
  <p className="mt-2 text-sm text-gray-600">
    Run <code className="bg-gray-100 px-1 py-0.5 rounded">/verify --code--</code> in any Discord channel
  </p>
</div>
        <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
          <h3 className="font-medium text-blue-800 mb-2">How to verify:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Install the bot to your server using the button above</li>
            <li>Go to any channel in your Discord server</li>
            <li>Type <code className="bg-gray-100 px-1 py-0.5 rounded">/verify --token-- </code></li>
            <li>The bot will confirm your account is linked</li>
            <li>IMPORTANT : For most features, App Install is sufficient. 
              For additional features like /fein , please use a Server Install
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}