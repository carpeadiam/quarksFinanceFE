'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import FeatureShowcase from '../components/landing/FeatureShowcase';
import { Mail, MapPin, Phone, Github, Twitter, Linkedin, Instagram } from 'lucide-react';

export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0);
  
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen relative font-['Rubik']">
      {/* Background SVG */}
      <div className="fixed inset-0 -z-10">
        <Image 
          src="/images/gradient.svg" 
          alt="Background" 
          fill
          className="object-cover"
        />
      </div>

      {/* Sticky Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrollY > 10 ? 'bg-white/90 backdrop-blur-md shadow-sm' : 'bg-transparent'}`}>
        <nav className="flex justify-between items-center p-4 md:p-6 max-w-7xl mx-auto">
          <div className="flex items-center">
            <div className="mr-3">
              <Image 
                src="/images/logo.svg" 
                alt="QuarksFinance Logo" 
                width={40} 
                height={34} 
              />
            </div>
            <span className="font-bold text-xl text-gray-800 font-['JetBrains_Mono']">
              QuarksFinance
            </span>
          </div>
          
          <div className="hidden md:flex space-x-10">
            {['HOME', 'FEATURES', 'CONTACT'].map((item) => (
              <Link 
                key={item} 
                href={item === 'HOME' ? '/' : 
                item === 'FEATURES' ? '#features' : 
                item === 'CONTACT' ? '#contact' : 
                `/${item.toLowerCase()}`}
                className="text-gray-700 hover:text-blue-600 relative group font-medium tracking-wide"
              >
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-blue-400 group-hover:w-full transition-all duration-300"></span>
              </Link>
            ))}
          </div>
          
          <div className="flex space-x-3">
            <Link href="/login">
              <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50 rounded-full px-6 py-3 transition-all duration-300 hover:shadow-md">
                LOGIN
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white rounded-full px-6 py-3 transition-all duration-300 hover:shadow-lg">
                REGISTER
              </Button>
            </Link>
          </div>
        </nav>
      </header>
      
      {/* Hero Section */}
      <section className="pt-20 pb-20 md:pt-30 md:pb-32 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center">
          {/* Left Column - Text */}
          <div className="space-y-8 max-w-xl">
            <h1 className="text-5xl md:text-6xl lg:text-7xl leading-tight text-blue-600 font-['JetBrains_Mono']">
              <span className="font-normal font-['Rubik']">Trade with</span>
              <br />
              <span className="text-black font-normal">&lt;automated</span>
              <br />
              <span className="text-black font-normal">strategies&gt;</span>
            </h1>
            
            <h2 className="text-2xl text-gray-700 font-bold">
              Optimize your portfolio with adaptive algorithms
            </h2>
            
            <p className="text-gray-600 text-xl">
              QuarksFinance combines powerful backtesting and strategies to help you make smarter investment decisions in any market condition.
            </p>
            
            <div className="pt-4">
              <Link href="/login">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-5 rounded-full shadow-lg hover:shadow-xl transition-all duration-300">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
          
          {/* Right Column - Icons Group */}
          <div className="relative">
            {/* Main Icons Group */}
            <div className="flex items-center justify-center">
              <div className="w-64 h-48 relative bottom-40">
                <Image 
                  src="/images/icons.svg" 
                  alt="Trading Icons" 
                  fill
                  className="object-contain scale-150"
                />
              </div>
            </div>
            
            {/* Bull and Bear Icons */}
            <div className="absolute">
                <div className="w-16 h-16 relative bottom-00 left-20">
                  <Image 
                    src="/images/bear.svg" 
                    alt="Bear Icon" 
                    fill
                    className="object-contain scale-600"
                  />
                </div>
            </div>
            
            <div className="absolute -top-5 -right-5">
              
                <div className="w-14 h-14 relative top-60 right-50">
                  <Image 
                    src="/images/bull.svg" 
                    alt="Bull Icon" 
                    fill
                    className="object-contain scale-600"
                  />
                </div>
              
            </div>
            
          </div>
        </div>
      </section>
      
      {/* Our Features Section */}
      <section id="features" className="py-20 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <FeatureShowcase />
        </div>
      </section>
      
      {/* Get in Touch Section */}
      <section id="contact" className="py-20 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
              Get in Touch
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Have questions or need assistance? Our team is here to help you succeed.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-2xl p-8 shadow-lg">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Send Us a Message</h3>
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input type="text" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input type="text" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input type="email" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                  <textarea rows={4} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"></textarea>
                </div>
                <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white py-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-300">
                  Send Message
                </Button>
              </div>
            </div>
            
            <div>
              <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl p-8 shadow-lg mb-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-6">Contact Information</h3>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <Mail className="w-6 h-6 text-blue-600 mr-4 mt-1" />
                    <div>
                      <h4 className="text-lg font-medium text-gray-800">Email</h4>
                      <p className="text-gray-600">support@quarksfinance.com</p>
                      <p className="text-gray-600">info@quarksfinance.com</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Phone className="w-6 h-6 text-blue-600 mr-4 mt-1" />
                    <div>
                      <h4 className="text-lg font-medium text-gray-800">Phone</h4>
                      <p className="text-gray-600">+1 (555) 123-4567</p>
                      <p className="text-gray-600">+1 (555) 987-6543</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <MapPin className="w-6 h-6 text-blue-600 mr-4 mt-1" />
                    <div>
                      <h4 className="text-lg font-medium text-gray-800">Phone</h4>
                      <p className="text-gray-600">123 Trading Street</p>
                      <p className="text-gray-600">Financial District, NY 10004</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-yellow-50 to-green-50 rounded-2xl p-8 shadow-lg">
                <h3 className="text-2xl font-bold text-gray-800 mb-6">Business Hours</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monday - Friday:</span>
                    <span className="text-gray-800 font-medium">9:00 AM - 6:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Saturday:</span>
                    <span className="text-gray-800 font-medium">10:00 AM - 4:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sunday:</span>
                    <span className="text-gray-800 font-medium">Closed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div>
              <div className="flex items-center mb-6">
                <div className="mr-3">
                  <Image 
                    src="/images/logo.svg" 
                    alt="QuarksFinance Logo" 
                    width={30} 
                    height={26} 
                  />
                </div>
                <span className="font-bold text-xl text-white font-['JetBrains_Mono']">QuarksFinance</span>
              </div>
              <p className="text-gray-400 mb-6">
                Advanced trading strategies powered by cutting-edge technology for the modern investor.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">
                  <Twitter size={20} />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">
                  <Linkedin size={20} />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">
                  <Github size={20} />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">
                  <Instagram size={20} />
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-bold mb-6">Quick Links</h3>
              <ul className="space-y-4">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">Home</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">Features</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">Contact</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">Blog</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-bold mb-6">Resources</h3>
              <ul className="space-y-4">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">Documentation</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">API Reference</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">Tutorials</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">Knowledge Base</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">Community</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-bold mb-6">Subscribe</h3>
              <p className="text-gray-400 mb-4">Stay updated with our latest features and releases</p>
              <div className="flex">
                <input type="email" placeholder="Your email address" className="px-4 py-2 rounded-l-lg w-full focus:outline-none text-gray-900" />
                <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-r-lg transition-colors duration-300">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">© 2023 QuarksFinance. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors duration-300">Privacy Policy</a>
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors duration-300">Terms of Service</a>
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors duration-300">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}