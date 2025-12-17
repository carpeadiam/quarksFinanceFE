'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, signInWithPopup, GoogleAuthProvider, GithubAuthProvider } from 'firebase/auth';
import { initializeApp, getApps } from 'firebase/app';
import Link from 'next/link';
import { ChevronLeft, Github, Mail } from 'lucide-react';
import { motion } from 'framer-motion';

// Initialize Firebase OUTSIDE component - check if already initialized
const firebaseConfig = {
  apiKey: "AIzaSyD7sDZFPhuVJcUYGd2vv7pkhM-iDCWPoD0",
  authDomain: "quarksfinance-90c76.firebaseapp.com",
  projectId: "quarksfinance-90c76",
  storageBucket: "quarksfinance-90c76.firebasestorage.app",
  messagingSenderId: "690490131436",
  appId: "1:690490131436:web:72fc5f579ba201971276c9"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);

// Move UI components OUTSIDE the main component to prevent recreation
const BackButton = React.memo(() => (
  <Link href="/home">
    <button 
      type="button"
      className="relative z-0 flex items-center justify-center gap-2 overflow-hidden rounded-md border border-zinc-300 bg-white px-4 py-2 font-semibold text-zinc-800 transition-all duration-500 before:absolute before:inset-0 before:-z-10 before:translate-x-[150%] before:translate-y-[150%] before:scale-[2.5] before:rounded-[100%] before:bg-zinc-100 before:transition-transform before:duration-1000 before:content-[''] hover:scale-105 hover:text-zinc-900 hover:before:translate-x-[0%] hover:before:translate-y-[0%] active:scale-95"
      aria-label="Go back to home"
    >
      <ChevronLeft size={16} aria-hidden="true" />
      <span>Go back</span>
    </button>
  </Link>
));

BackButton.displayName = 'BackButton';

const Button = React.memo(({ children, className = '', disabled, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { className?: string }) => (
  <button
    type="button"
    disabled={disabled}
    className={`rounded-md bg-gradient-to-br from-blue-400 to-blue-700 px-4 py-2 text-lg text-white ring-2 ring-blue-500/50 ring-offset-2 ring-offset-white transition-all hover:scale-[1.02] hover:ring-transparent active:scale-[0.98] active:ring-blue-500/70 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${className}`}
    {...props}
  >
    {children}
  </button>
));

Button.displayName = 'Button';

const Logo = React.memo(() => (
  <div className="mb-6 flex justify-center items-center">
    <img src="/images/logo.svg" alt="Quarks Finance Logo" className="h-8 w-8" />
    <span className="ml-2 text-xl font-bold">Quarks Finance</span>
  </div>
));

Logo.displayName = 'Logo';

const Divider = React.memo(() => (
  <div className="my-6 flex items-center gap-3">
    <div className="h-[1px] w-full bg-zinc-300" />
    <span className="text-zinc-500">OR</span>
    <div className="h-[1px] w-full bg-zinc-300" />
  </div>
));

Divider.displayName = 'Divider';

const TermsAndConditions = React.memo(() => (
  <p className="mt-9 text-xs text-zinc-500">
    By signing in, you agree to our{" "}
    <a href="#" className="text-blue-600 hover:underline">Terms & Conditions</a>{" "}
    and{" "}
    <a href="#" className="text-blue-600 hover:underline">Privacy Policy.</a>
  </p>
));

TermsAndConditions.displayName = 'TermsAndConditions';

export default function LoginPage() {
  const router = useRouter();
  const baseURL = 'https://thecodeworks.in/quarksfinance/api';
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check if user is already logged in - ONLY ONCE
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('quarksFinanceToken');
      const storedUserId = localStorage.getItem('quarksFinanceUserId');
      
      if (storedToken && storedUserId) {
        router.push('/home');
      }
    } catch (err) {
      console.error('Error checking auth:', err);
    } finally {
      setIsCheckingAuth(false);
    }
  }, [router]);

  // Memoize callback functions to prevent recreation
  const showMessage = useCallback((message: string, isError: boolean = false) => {
    if (isError) {
      setError(message);
      setSuccessMessage('');
    } else {
      setSuccessMessage(message);
      setError('');
    }
    
    const timer = setTimeout(() => {
      setError('');
      setSuccessMessage('');
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleCredentialAuth = useCallback(async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    if (!isLogin && password !== confirmPassword) {
      showMessage("Passwords do not match", true);
      setLoading(false);
      return;
    }

    if (!username.trim() || !password.trim()) {
      showMessage("Please fill in all fields", true);
      setLoading(false);
      return;
    }
    
    try {
      const endpoint = isLogin ? 'login' : 'register';
      
      // Get IP location data for country
      const ip = await fetch(`https://api.ipgeolocation.io/ipgeo?apiKey=e92838188a614cbd9b7d9aeb4b4a2a02`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!ip.ok) throw new Error('Failed to fetch location data');
      
      const ipdata = await ip.json();
      const countryName = ipdata.country_name || 'Unknown';

      const response = await fetch(`${baseURL}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: username.trim(), 
          password: password,
          countryname: countryName 
        })
      });
      
      const data = await response.json();
      
      if (isLogin && data.token) {
        localStorage.setItem('quarksFinanceToken', data.token);
        localStorage.setItem('quarksFinanceUserId', data.user_id.toString());
        localStorage.setItem('quarksFinanceUsername', username.trim());
        
        showMessage('Login successful!');
        setTimeout(() => router.push('/home'), 1000);
      } else if (!isLogin && data.message === "User created successfully") {
        showMessage('Registration successful! Please login.');
        setIsLogin(true);
        setPassword('');
        setConfirmPassword('');
      } else {
        showMessage(data.message || `${isLogin ? 'Login' : 'Registration'} failed`, true);
      }
    } catch (err) {
      showMessage(`Error during ${isLogin ? 'login' : 'registration'}. Please try again.`, true);
      console.error('Auth error:', err);
    } finally {
      setLoading(false);
    }
  }, [isLogin, password, confirmPassword, username, baseURL, router, showMessage]);
  
  const handleSocialAuth = useCallback(async (provider: 'google' | 'github') => {
    try {
      const authProvider = provider === 'google' 
        ? new GoogleAuthProvider() 
        : new GithubAuthProvider();

      if (provider === 'github') authProvider.addScope('user:email');

      const result = await signInWithPopup(auth, authProvider);
      const user = result.user;
      if (!user.email) throw new Error('Email not found');
      
      const endpoint = isLogin ? 'login' : 'register';
      
      // Get country information
      const ip = await fetch(`https://api.ipgeolocation.io/ipgeo?apiKey=e92838188a614cbd9b7d9aeb4b4a2a02`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!ip.ok) throw new Error('Failed to fetch location data');
      
      const ipdata = await ip.json();
      const countryName = ipdata.country_name || 'Unknown';

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
        localStorage.setItem('quarksFinanceToken', data.token);
        localStorage.setItem('quarksFinanceUserId', data.user_id.toString());
        localStorage.setItem('quarksFinanceUsername', user.email);
        
        showMessage('Authentication successful!');
        setTimeout(() => router.push('/home'), 1000);
      } else {
        if (!isLogin && data.message?.includes('exists')) {
          showMessage('Account exists. Switch to login...', true);
          setIsLogin(true);
        } else {
          throw new Error(data.message || 'Authentication failed');
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
      if (!errorMessage.includes('popup-closed-by-user')) {
        showMessage(errorMessage, true);
      }
      console.error('Social auth error:', err);
    }
  }, [isLogin, baseURL, router, showMessage]);

  const handleToggleMode = useCallback(() => {
    setIsLogin(prev => !prev);
    setError('');
    setPassword('');
    setConfirmPassword('');
  }, []);

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-zinc-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-10 text-zinc-800 selection:bg-zinc-300 relative overflow-hidden">
      <div 
        className="absolute inset-0 z-0" 
        style={{
          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='%23e5e7eb' stroke-opacity='0.8' stroke-dasharray='5 3' stroke-width='1' stroke-linecap='round' stroke-linejoin='round'%3e%3cpath d='M0 .5H31.5V32'/%3e%3c/svg%3e")`,
          backgroundSize: '32px 32px'
        }}
        aria-hidden="true"
      />
      
      <BackButton />
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.25, ease: "easeInOut" }}
        className="relative z-10 mx-auto w-full max-w-xl p-6 bg-white rounded-xl shadow-lg"
      >
        <Logo />
        
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold">
            {isLogin ? "Sign in to your account" : "Create a new account"}
          </h1>
          <p className="mt-2 text-zinc-500">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              type="button"
              onClick={handleToggleMode} 
              className="text-blue-600 hover:underline focus:outline-none focus:underline"
            >
              {isLogin ? "Create one." : "Sign in."}
            </button>
          </p>
        </div>

        <div className="mb-6 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleSocialAuth('google')}
              className="relative z-0 flex items-center justify-center gap-2 overflow-hidden rounded-md border border-zinc-300 bg-white px-4 py-2 font-semibold text-zinc-800 transition-all duration-500 before:absolute before:inset-0 before:-z-10 before:translate-x-[150%] before:translate-y-[150%] before:scale-[2.5] before:rounded-[100%] before:bg-zinc-100 before:transition-transform before:duration-1000 before:content-[''] hover:scale-105 hover:text-zinc-900 hover:before:translate-x-[0%] hover:before:translate-y-[0%] active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Sign in with Google"
            >
              <Mail size={20} aria-hidden="true" />
              <span>Sign in with Google</span>
            </button>
            <button
              type="button"
              onClick={() => handleSocialAuth('github')}
              className="relative z-0 flex items-center justify-center gap-2 overflow-hidden rounded-md border border-zinc-300 bg-white px-4 py-2 font-semibold text-zinc-800 transition-all duration-500 before:absolute before:inset-0 before:-z-10 before:translate-x-[150%] before:translate-y-[150%] before:scale-[2.5] before:rounded-[100%] before:bg-zinc-100 before:transition-transform before:duration-1000 before:content-[''] hover:scale-105 hover:text-zinc-900 hover:before:translate-x-[0%] hover:before:translate-y-[0%] active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Sign in with Github"
            >
              <Github size={20} aria-hidden="true" />
              <span>Sign in with Github</span>
            </button>
          </div>
        </div>

        <Divider />

        <div>
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md" role="alert">
              {error}
            </div>
          )}
          
          <div className="mb-3">
            <label htmlFor="email-input" className="mb-1.5 block text-zinc-500">
              {isLogin ? "Email" : "Username"}
            </label>
            <input
              id="email-input"
              type={isLogin ? "email" : "text"}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={isLogin ? "your.email@provider.com" : "johndoe"}
              className="w-full rounded-md border border-zinc-300 bg-blue-50 px-3 py-2 text-zinc-800 placeholder-zinc-500 ring-1 ring-transparent transition-shadow focus:outline-0 focus:ring-blue-700"
              required
              autoComplete={isLogin ? "email" : "username"}
              disabled={loading}
            />
          </div>
          
          <div className="mb-3">
            <div className="mb-1.5 flex items-end justify-between">
              <label htmlFor="password-input" className="block text-zinc-500">
                Password
              </label>
              {isLogin && (
                <a href="#" className="text-sm text-blue-600 hover:underline">
                  Forgot?
                </a>
              )}
            </div>
            <input
              id="password-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full rounded-md border border-zinc-300 bg-blue-50 px-3 py-2 text-zinc-800 placeholder-zinc-500 ring-1 ring-transparent transition-shadow focus:outline-0 focus:ring-blue-700"
              required
              autoComplete={isLogin ? "current-password" : "new-password"}
              disabled={loading}
            />
          </div>
          
          {!isLogin && (
            <div className="mb-6">
              <label htmlFor="confirm-password-input" className="mb-1.5 block text-zinc-500">
                Confirm Password
              </label>
              <input
                id="confirm-password-input"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-md border border-zinc-300 bg-blue-50 px-3 py-2 text-zinc-800 placeholder-zinc-500 ring-1 ring-transparent transition-shadow focus:outline-0 focus:ring-blue-700"
                required
                autoComplete="new-password"
                disabled={loading}
              />
            </div>
          )}
          
          <Button onClick={handleCredentialAuth} className="w-full" disabled={loading}>
            {loading ? (isLogin ? "Signing in..." : "Creating account...") : (isLogin ? "Sign in" : "Create account")}
          </Button>
        </div>

        <TermsAndConditions />
      </motion.div>
      
      {successMessage && (
        <div 
          className="fixed bottom-4 right-4 bg-green-500 text-white p-4 rounded-lg shadow-lg z-50"
          role="status"
          aria-live="polite"
        >
          {successMessage}
        </div>
      )}
    </div>
  );
}