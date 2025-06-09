'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, signInWithPopup, GoogleAuthProvider, GithubAuthProvider } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import Link from 'next/link';
import { ChevronLeft, Github, Mail } from 'lucide-react';
import { motion } from 'framer-motion';

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

export default function LoginPage() {
  const router = useRouter();
  const baseURL = 'https://thecodeworks.in/quarksfinance/api';
  const [isLogin, setIsLogin] = useState(true);
  
  // Login credentials for username/password auth
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

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
      setError(message);
      setSuccessMessage('');
    } else {
      setSuccessMessage(message);
      setError('');
    }
    
    // Clear messages after 3 seconds
    setTimeout(() => {
      setError('');
      setSuccessMessage('');
    }, 3000);
  };

  const handleCredentialAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    // For signup, check if passwords match
    if (!isLogin && password !== confirmPassword) {
      setError("Passwords do not match");
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
        setIsLogin(true);
      } else {
        showMessage(data.message || `${isLogin ? 'Login' : 'Registration'} failed`, true);
      }
    } catch (err) {
      showMessage(`Error during ${isLogin ? 'login' : 'registration'}. Please try again.`, true);
      console.error(err);
    } finally {
      setLoading(false);
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
      
      const endpoint = isLogin ? 'login' : 'register';
      
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
        if (!isLogin && data.message?.includes('exists')) {
          showMessage('Account exists. Switch to login...', true);
          setIsLogin(true);
        } else {
          throw new Error(data.message || 'Authentication failed');
        }
      }

    } catch (err) {
      showMessage(err instanceof Error ? err.message : 'Authentication failed', true);
      console.error(err);
    }
  };

  // UI Components from Auth.tsx
  const BackButton = () => (
    <Link href="/home">
      <SocialButton icon={<ChevronLeft size={16} />}>Go back</SocialButton>
    </Link>
  );

  const Button = ({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { className?: string }) => (
    <button
      className={`rounded-md bg-gradient-to-br from-blue-400 to-blue-700 px-4 py-2 text-lg text-white 
      ring-2 ring-blue-500/50 ring-offset-2 ring-offset-white 
      transition-all hover:scale-[1.02] hover:ring-transparent active:scale-[0.98] active:ring-blue-500/70 ${className}`}
      {...props}
    >
      {children}
    </button>
  );

  const Logo = () => (
    <div className="mb-6 flex justify-center">
      <img
        src="/images/logo.svg"
        alt="Quarks Finance"
        className="h-8 w-8"
      />
      <span className="ml-2 text-xl font-bold">Quarks Finance</span>
    </div>
  );

  const Header = () => (
    <div className="mb-6 text-center">
      <h1 className="text-2xl font-semibold">{isLogin ? "Sign in to your account" : "Create a new account"}</h1>
      <p className="mt-2 text-zinc-500">
        {isLogin ? "Don't have an account? " : "Already have an account? "}
        <button 
          onClick={() => setIsLogin(!isLogin)} 
          className="text-blue-600 hover:underline"
        >
          {isLogin ? "Create one." : "Sign in."}
        </button>
      </p>
    </div>
  );

  const SocialButtons = () => (
    <div className="mb-6 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <SocialButton 
          icon={<Mail size={20} />}
          onClick={() => handleSocialAuth('google')}
        >
          Sign in with Google
        </SocialButton>
        <SocialButton 
          icon={<Github size={20} />}
          onClick={() => handleSocialAuth('github')}
        >
          Sign in with Github
        </SocialButton>
      </div>
    </div>
  );

  const SocialButton = ({ 
    icon, 
    fullWidth, 
    children,
    onClick
  }: {
    icon?: React.ReactNode;
    fullWidth?: boolean;
    children?: React.ReactNode;
    onClick?: () => void;
  }) => (
    <button
      onClick={onClick}
      className={`relative z-0 flex items-center justify-center gap-2 overflow-hidden rounded-md 
      border border-zinc-300 bg-white 
      px-4 py-2 font-semibold text-zinc-800 transition-all duration-500
      before:absolute before:inset-0 before:-z-10 before:translate-x-[150%] before:translate-y-[150%] before:scale-[2.5]
      before:rounded-[100%] before:bg-zinc-100 before:transition-transform before:duration-1000 before:content-[""]
      hover:scale-105 hover:text-zinc-900 hover:before:translate-x-[0%] hover:before:translate-y-[0%] active:scale-95
      ${fullWidth ? "col-span-2" : ""}`}
    >
      {icon}
      <span>{children}</span>
    </button>
  );

  const Divider = () => (
    <div className="my-6 flex items-center gap-3">
      <div className="h-[1px] w-full bg-zinc-300" />
      <span className="text-zinc-500">OR</span>
      <div className="h-[1px] w-full bg-zinc-300" />
    </div>
  );

  const LoginForm = () => (
    <form onSubmit={handleCredentialAuth}>
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
          {error}
        </div>
      )}
      <div className="mb-3">
        <label
          htmlFor="email-input"
          className="mb-1.5 block text-zinc-500"
        >
          Email
        </label>
        <input
          id="email-input"
          type="email"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="your.email@provider.com"
          className="w-full rounded-md border border-zinc-300 
          bg-blue-50 px-3 py-2 text-zinc-800
          placeholder-zinc-500 
          ring-1 ring-transparent transition-shadow focus:outline-0 focus:ring-blue-700"
          required
        />
      </div>
      <div className="mb-6">
        <div className="mb-1.5 flex items-end justify-between">
          <label
            htmlFor="password-input"
            className="block text-zinc-500"
          >
            Password
          </label>
          <a href="#" className="text-sm text-blue-600">
            Forgot?
          </a>
        </div>
        <input
          id="password-input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••••••"
          className="w-full rounded-md border border-zinc-300 
          bg-blue-50 px-3 py-2 text-zinc-800
          placeholder-zinc-500 
          ring-1 ring-transparent transition-shadow focus:outline-0 focus:ring-blue-700"
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );

  const SignupForm = () => (
    <form onSubmit={handleCredentialAuth}>
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
          {error}
        </div>
      )}
      <div className="mb-3">
        <label
          htmlFor="username-input"
          className="mb-1.5 block text-zinc-500"
        >
          Username
        </label>
        <input
          id="username-input"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="johndoe"
          className="w-full rounded-md border border-zinc-300 
          bg-blue-50 px-3 py-2 text-zinc-800
          placeholder-zinc-500 
          ring-1 ring-transparent transition-shadow focus:outline-0 focus:ring-blue-700"
          required
        />
      </div>
      <div className="mb-3">
        <label
          htmlFor="signup-password-input"
          className="mb-1.5 block text-zinc-500"
        >
          Password
        </label>
        <input
          id="signup-password-input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••••••"
          className="w-full rounded-md border border-zinc-300 
          bg-blue-50 px-3 py-2 text-zinc-800
          placeholder-zinc-500 
          ring-1 ring-transparent transition-shadow focus:outline-0 focus:ring-blue-700"
          required
        />
      </div>
      <div className="mb-6">
        <label
          htmlFor="confirm-password-input"
          className="mb-1.5 block text-zinc-500"
        >
          Confirm Password
        </label>
        <input
          id="confirm-password-input"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="••••••••••••"
          className="w-full rounded-md border border-zinc-300 
          bg-blue-50 px-3 py-2 text-zinc-800
          placeholder-zinc-500 
          ring-1 ring-transparent transition-shadow focus:outline-0 focus:ring-blue-700"
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Creating account..." : "Create account"}
      </Button>
    </form>
  );

  const TermsAndConditions = () => (
    <p className="mt-9 text-xs text-zinc-500">
      By signing in, you agree to our{" "}
      <a href="#" className="text-blue-600">
        Terms & Conditions
      </a>{" "}
      and{" "}
      <a href="#" className="text-blue-600">
        Privacy Policy.
      </a>
    </p>
  );

  return (
    <div className="bg-white py-10 text-zinc-800 selection:bg-zinc-300 relative overflow-hidden">
      {/* Grid Background */}
      <div className="absolute inset-0 z-0" 
           style={{
             backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='%23e5e7eb' stroke-opacity='0.8' stroke-dasharray='5 3' stroke-width='1' stroke-linecap='round' stroke-linejoin='round'%3e%3cpath d='M0 .5H31.5V32'/%3e%3c/svg%3e")`,
             backgroundSize: '32px 32px'
           }}>
      </div>
      
      <BackButton />
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.25, ease: "easeInOut" }}
        className="relative z-10 mx-auto w-full max-w-xl p-4 bg-white rounded-xl shadow-lg"
      >
        <Logo />
        <Header />
        <SocialButtons />
        <Divider />
        {isLogin ? <LoginForm /> : <SignupForm />}
        <TermsAndConditions />
      </motion.div>
      
      {/* Notifications */}
      {successMessage && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white p-3 rounded shadow-md">
          {successMessage}
        </div>
      )}
    </div>
  );
}