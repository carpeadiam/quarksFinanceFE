'use client'; // Mark as Client Component
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, signInWithPopup, GoogleAuthProvider, GithubAuthProvider } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import Link from 'next/link';
import Navbar from '../../components/navigation/Navbar';

// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyD7sDZFPhuVJcUYGd2vv7pkhM-iDCWPoD0",
  authDomain: "quarksfinance-90c76.firebaseapp.com",
  projectId: "quarksfinance-90c76",
  storageBucket: "quarksfinance-90c76.firebasestorage.app",
  messagingSenderId: "690490131436",
  appId: "1:690490131436:web:72fc5f579ba201971276c9"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export default function AuthPage() {
  const router = useRouter();
  const baseURL = 'https://thecodeworks.in/quarksfinance/api';
  const [action, setAction] = useState<'login' | 'signup'>('login');
  
  // Login credentials for username/password auth
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Check if user is already logged in
  useEffect(() => {
    const storedToken = localStorage.getItem('quarksFinanceToken');
    const storedUserId = localStorage.getItem('quarksFinanceUserId');
    
    if (storedToken && storedUserId) {
      // Already logged in, redirect to home page
      router.push('/home');
    }
  }, [router]);

  const showMessage = (message: string, isError: boolean = false) => {
    if (isError) {
      setErrorMessage(message);
      setSuccessMessage('');
    } else {
      setSuccessMessage(message);
      setErrorMessage('');
    }
    
    // Clear messages after 3 seconds
    setTimeout(() => {
      setErrorMessage('');
      setSuccessMessage('');
    }, 3000);
  };

  const handleCredentialAuth = async (isLogin: boolean) => {
    try {
      const endpoint = isLogin ? 'login' : 'register';
      
      // Get IP location data for country
      const ip = await fetch(`https://api.ipgeolocation.io/ipgeo?apiKey=e92838188a614cbd9b7d9aeb4b4a2a02`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const ipdata = await ip.json();
      const countryName = ipdata.country_name;
      console.log(`country name : ${countryName}`);

      const response = await fetch(`${baseURL}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: username, 
          password: password,
          countryname: countryName 
        })
      });
      
      const data = await response.json();
      
      if (isLogin && data.token) {
        // Store in localStorage
        localStorage.setItem('quarksFinanceToken', data.token);
        localStorage.setItem('quarksFinanceUserId', data.user_id.toString());
        localStorage.setItem('quarksFinanceUsername', username);
        
        showMessage('Login successful!');
        
        // Redirect to home page
        setTimeout(() => {
          router.push('/home');
        }, 1000);
      } else if (!isLogin && data.message === "User created successfully") {
        showMessage('Registration successful! Please login.');
        setAction('login');
      } else {
        showMessage(data.message || `${isLogin ? 'Login' : 'Registration'} failed`, true);
      }
    } catch (err) {
      showMessage(`Error during ${isLogin ? 'login' : 'registration'}. Please try again.`, true);
      console.error(err);
    }
  };
  
  const handleSocialAuth = async (provider: 'google' | 'github') => {
    try {
      const authProvider = provider === 'google' 
        ? new GoogleAuthProvider() 
        : new GithubAuthProvider();

      if (provider === 'github') authProvider.addScope('user:email');

      const result = await signInWithPopup(auth, authProvider);
      const user = result.user;
      if (!user.email) throw new Error('Email not found');
      
      const endpoint = action === 'login' ? 'login' : 'register';
      
      // Get country information
      const ip = await fetch(`https://api.ipgeolocation.io/ipgeo?apiKey=e92838188a614cbd9b7d9aeb4b4a2a02`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const ipdata = await ip.json();
      const countryName = ipdata.country_name;
      console.log(`country name : ${countryName}`);

      const res = await fetch(`${baseURL}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.email,
          password: user.uid,
          countryname: countryName
        })
      });

      const data = await res.json();

      if (res.ok) {
        // Store in localStorage
        localStorage.setItem('quarksFinanceToken', data.token);
        localStorage.setItem('quarksFinanceUserId', data.user_id.toString());
        localStorage.setItem('quarksFinanceUsername', user.email);
        
        showMessage('Authentication successful!');
        
        setTimeout(() => {
          router.push('/home');
        }, 1000);
      } else {
        // If login fails but account exists, switch to login
        if (action === 'signup' && data.message?.includes('exists')) {
          showMessage('Account exists. Switch to login...', true);
          setAction('login');
        } else {
          throw new Error(data.message || 'Authentication failed');
        }
      }

    } catch (err) {
      showMessage(err instanceof Error ? err.message : 'Authentication failed', true);
      console.error(err);
    }
  };

  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      
      <div className="container mx-auto px-4 md:px-40 py-10">
        <div className="w-full max-w-6xl mx-auto px-4 py-6">
          <div className="mb-8 p-6 bg-white rounded-lg shadow-md">
            <h1 className="text-3xl mb-2 text-black font-bold">Quarks Finance</h1>
            <p className="mb-6 text-black">{action === 'login' ? 'Login to continue' : 'Create your account'}</p>
            
            <div className="flex mb-6 border-b text-gray-400">
              <button 
                onClick={() => setAction('login')}
                className={`flex-1 py-2 px-4 ${action === 'login' ? 'text-black border-b-2 border-cyan-700 font-semibold' : ''}`}
              >
                Login
              </button>
              <button 
                onClick={() => setAction('signup')}
                className={`flex-1 py-2 px-4 ${action === 'signup' ? 'text-black border-b-2 border-cyan-700 font-semibold' : ''}`}
              >
                Sign Up
              </button>
            </div>
            
            {/* Credential login */}
            <div className="mb-8">
              <div className="flex flex-col text-gray-400 space-y-4">
                <input
                  type="text"
                  placeholder="Username/Email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="p-2 text-black border border-gray-300 rounded"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="p-2 text-black border border-gray-300 rounded"
                />
                <button
                  onClick={() => handleCredentialAuth(action === 'login')}
                  className="py-2 px-4 bg-[#41748D] text-white rounded hover:bg-[#224455]"
                >
                  {action === 'login' ? 'Login' : 'Sign Up'}
                </button>
              </div>
            </div>
            
            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>
            
            {/* Social login buttons */}
            <div className="flex flex-col space-y-4">
              <button 
                onClick={() => handleSocialAuth('google')}
                className="flex text-black items-center justify-center gap-2 py-2 px-4 bg-white border border-gray-300 rounded hover:bg-gray-50"
              >
                <GoogleIcon />
                <span>{action === 'login' ? 'Login with Google' : 'Sign up with Google'}</span>
              </button>
              
              <button 
                onClick={() => handleSocialAuth('github')}
                className="flex items-center justify-center gap-2 py-2 px-4 bg-gray-800 text-white rounded hover:bg-gray-700"
              >
                <GithubIcon />
                <span>{action === 'login' ? 'Login with GitHub' : 'Sign up with GitHub'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Notifications */}
      {errorMessage && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white p-3 rounded shadow-md">
          {errorMessage}
        </div>
      )}
      
      {successMessage && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white p-3 rounded shadow-md">
          {successMessage}
        </div>
      )}
    </main>
  );
}

// Icons
const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 18 18">
    <path fill="#4285F4" d="M17.6 9.2l-.1-1.8H9v3.4h4.8C13.6 12 13 13 12 13.6v2.2h3a8.8 8.8 0 0 0 2.6-6.6z"/>
    <path fill="#34A853" d="M9 18c2.4 0 4.5-.8 6-2.2l-3-2.2a5.4 5.4 0 0 1-8-2.9H1V13a9 9 0 0 0 8 5z"/>
    <path fill="#FBBC05" d="M4 10.7a5.4 5.4 0 0 1 0-3.4V5H1a9 9 0 0 0 0 8l3-2.3z"/>
    <path fill="#EA4335" d="M9 3.6c1.3 0 2.5.4 3.4 1.3L15 2.3A9 9 0 0 0 1 5l3 2.4a5.4 5.4 0 0 1 5-3.7z"/>
  </svg>
);

const GithubIcon = () => (
  <svg width="20" height="20" viewBox="0 0 16 16">
    <path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
  </svg>
);