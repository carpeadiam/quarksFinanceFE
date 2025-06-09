"use client"
import * as React from "react"
import { useState } from "react"
import { ChevronLeft, Github, Mail } from "lucide-react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { login, register } from "../services/api"

const AuthForm: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true)
  
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
        <Header isLogin={isLogin} toggleForm={() => setIsLogin(!isLogin)} />
        <SocialButtons />
        <Divider />
        {isLogin ? <LoginForm /> : <SignupForm />}
        <TermsAndConditions />
      </motion.div>
    </div>
  )
}

const BackButton: React.FC = () => (
  <Link href="/home">
    <SocialButton icon={<ChevronLeft size={16} />}>Go back</SocialButton>
  </Link>
)

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string
}

const Button: React.FC<ButtonProps> = ({ children, className, ...props }) => (
  <button
    className={`rounded-md bg-gradient-to-br from-blue-400 to-blue-700 px-4 py-2 text-lg text-white 
    ring-2 ring-blue-500/50 ring-offset-2 ring-offset-white 
    transition-all hover:scale-[1.02] hover:ring-transparent active:scale-[0.98] active:ring-blue-500/70 ${className}`}
    {...props}
  >
    {children}
  </button>
)

const Logo: React.FC = () => (
  <div className="mb-6 flex justify-center">
    <img
      src="/images/logo.svg"
      alt="Quarks Finance"
      className="h-8 w-8"
    />
    <span className="ml-2 text-xl font-bold">Quarks Finance</span>
  </div>
)

const Header: React.FC<{ isLogin: boolean; toggleForm: () => void }> = ({ isLogin, toggleForm }) => (
  <div className="mb-6 text-center">
    <h1 className="text-2xl font-semibold">{isLogin ? "Sign in to your account" : "Create a new account"}</h1>
    <p className="mt-2 text-zinc-500">
      {isLogin ? "Don't have an account? " : "Already have an account? "}
      <button 
        onClick={toggleForm} 
        className="text-blue-600 hover:underline"
      >
        {isLogin ? "Create one." : "Sign in."}
      </button>
    </p>
  </div>
)

const SocialButtons: React.FC = () => (
  <div className="mb-6 space-y-3">
    <div className="grid grid-cols-2 gap-3">
      <SocialButton icon={<Mail size={20} />}>Sign in with Google</SocialButton>
      <SocialButton icon={<Github size={20} />}>Sign in with Github</SocialButton>
    </div>
  </div>
)

const SocialButton: React.FC<{
  icon?: React.ReactNode
  fullWidth?: boolean
  children?: React.ReactNode
}> = ({ icon, fullWidth, children }) => (
  <button
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
)

const Divider: React.FC = () => (
  <div className="my-6 flex items-center gap-3">
    <div className="h-[1px] w-full bg-zinc-300" />
    <span className="text-zinc-500">OR</span>
    <div className="h-[1px] w-full bg-zinc-300" />
  </div>
)

// Update the input fields in LoginForm
const LoginForm: React.FC = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    
    try {
      const response = await login(email, password)
      
      // Store auth data
      localStorage.setItem('quarksFinanceToken', response.token)
      localStorage.setItem('quarksFinanceUserId', response.userId)
      localStorage.setItem('quarksFinanceUsername', response.username)
      
      // Redirect to home
      router.push('/home')
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to login. Please check your credentials.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
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
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
  )
}

// Update the input fields in SignupForm
const SignupForm: React.FC = () => {
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }
    
    setLoading(true)
    
    try {
      const response = await register(email, password)
      
      // Store auth data
      localStorage.setItem('quarksFinanceToken', response.token)
      localStorage.setItem('quarksFinanceUserId', response.userId)
      localStorage.setItem('quarksFinanceUsername', response.username)
      
      // Redirect to home
      router.push('/home')
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create account. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
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
          htmlFor="signup-email-input"
          className="mb-1.5 block text-zinc-500"
        >
          Email
        </label>
        <input
          id="signup-email-input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your.email@provider.com"
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
  )
}

const TermsAndConditions: React.FC = () => (
  <p className="mt-9 text-xs text-zinc-500 dark:text-zinc-400">
    By signing in, you agree to our{" "}
    <a href="#" className="text-blue-600 dark:text-blue-400">
      Terms & Conditions
    </a>{" "}
    and{" "}
    <a href="#" className="text-blue-600 dark:text-blue-400">
      Privacy Policy.
    </a>
  </p>
)

// Remove the BackgroundDecoration component as we've added the grid directly to the main container

export default AuthForm