"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AuthButtons() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');

  useEffect(() => {
    // Check authentication status on component mount
    const storedToken = localStorage.getItem('quarksFinanceToken');
    const storedUsername = localStorage.getItem('quarksFinanceUsername');
    
    if (storedToken && storedUsername) {
      setIsLoggedIn(true);
      setUsername(storedUsername);
    }
  }, []);

  const handleLogout = () => {
    // Clear authentication data
    localStorage.removeItem('quarksFinanceToken');
    localStorage.removeItem('quarksFinanceUserId');
    localStorage.removeItem('quarksFinanceUsername');
    
    // Update state
    setIsLoggedIn(false);
    setUsername('');
    
    // Redirect to login page
    router.push('/login');
  };

  if (isLoggedIn) {
    return (
      <div className="flex items-center gap-2 md:gap-4">
        <span className="text-black text-sm md:text-base" style={{ fontFamily: 'Rubik, sans-serif' }}>{username}</span>
        <button 
          onClick={handleLogout}
          className="px-3 py-1 md:px-4 md:py-2 text-black border border-gray-300 rounded-full hover:bg-gray-100 transition-colors text-sm md:text-base"
          style={{ fontFamily: 'Rubik, sans-serif' }}>
          Log out
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 md:gap-4">
      <Link 
        href="/login"
        className="px-3 py-1 md:px-4 md:py-2 text-black border border-gray-300 rounded-full hover:bg-gray-100 transition-colors text-sm md:text-base"
        style={{ fontFamily: 'Rubik, sans-serif' }}>
        Sign up
      </Link>
      <Link 
        href="/login"
        className="px-3 py-1 md:px-4 md:py-2 text-black border border-gray-300 rounded-full hover:bg-gray-100 transition-colors text-sm md:text-base"
        style={{ fontFamily: 'Rubik, sans-serif' }}>
        Log in
      </Link>
    </div>
  );
}