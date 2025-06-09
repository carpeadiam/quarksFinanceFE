'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Mail, Github, Twitter, Linkedin } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function AboutPage() {
  const [scrollY, setScrollY] = useState(0);
  
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Sticky Header with glass effect - Same as main page */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrollY > 10 ? 'bg-white/80 backdrop-blur-md shadow-sm' : 'bg-transparent'}`}>
        <nav className="flex justify-between items-center p-4 md:p-6 max-w-7xl mx-auto">
          <div className="flex items-center">
            <Link href="/">
              <div className="relative group cursor-pointer">
                <div className="absolute -inset-1 bg-gradient-to-r from-green-400 to-blue-500 rounded-full opacity-70 group-hover:opacity-100 blur-md transition duration-300 group-hover:blur-lg"></div>
                <div className="relative bg-white rounded-full p-2 shadow-md">
                  <Image 
                    src="/images/logo.svg" 
                    alt="QuarksFinance Logo" 
                    width={40} 
                    height={34} 
                    className="relative"
                  />
                </div>
              </div>
            </Link>
            <div className="ml-3">
              <span className="font-bold text-xl bg-gradient-to-r from-blue-700 to-blue-900 bg-clip-text text-transparent">
                Quarks
              </span>
              <span className="font-bold text-xl bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent">
                Finance
              </span>
            </div>
          </div>
          
          <div className="hidden md:flex space-x-10">
            {['HOME', 'FEATURES', 'ABOUT', 'CONTACT'].map((item) => (
              <Link 
                key={item} 
                href={item === 'HOME' ? '/' : `/${item.toLowerCase()}`}
                className="text-gray-700 hover:text-blue-600 relative group font-medium tracking-wide"
              >
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-blue-400 group-hover:w-full transition-all duration-300"></span>
              </Link>
            ))}
          </div>
          
          <div className="flex space-x-3">
            <Link href="/login">
              <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50 rounded-full px-6 transition-all duration-300 hover:shadow-md">
                LOGIN
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white rounded-full px-6 transition-all duration-300 hover:shadow-lg">
                REGISTER
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-700 to-blue-900 bg-clip-text text-transparent mb-6">
            About QuarksFinance
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-12">
            We're on a mission to democratize algorithmic trading and empower individual investors with institutional-grade tools.
          </p>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-700 to-blue-900 bg-clip-text text-transparent mb-6">
                Our Story
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Founded in 2023, QuarksFinance was born from a simple idea: trading should be accessible, data-driven, and intelligent. Our team of financial experts and software engineers has created a platform that combines cutting-edge technology with proven trading strategies.
              </p>
              <p className="text-lg text-gray-600 mb-6">
                We believe that everyone deserves access to sophisticated trading tools that were once only available to institutional investors. Our mission is to democratize algorithmic trading and empower individual investors to achieve their financial goals.
              </p>
              <p className="text-lg text-gray-600">
                The name "Quarks" represents our approach to finance - breaking down complex market dynamics into fundamental, actionable components, just as quarks are the fundamental particles in physics.
              </p>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-100 to-blue-50 rounded-3xl transform rotate-3"></div>
              <div className="relative bg-white rounded-2xl overflow-hidden shadow-xl p-8">
                <div className="flex justify-center mb-8">
                  <div className="relative w-32 h-32 overflow-hidden rounded-full border-4 border-blue-100">
                    <Image 
                      src="/images/logo.svg" 
                      alt="QuarksFinance Logo" 
                      width={128} 
                      height={128} 
                      className="object-cover"
                    />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">Our Vision</h3>
                <p className="text-gray-600 mb-6 text-center">
                  To create a world where every investor has access to powerful algorithmic trading tools that adapt to changing market conditions.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
                    <span className="text-gray-700">Democratizing financial technology</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
                    <span className="text-gray-700">Empowering individual investors</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
                    <span className="text-gray-700">Creating accessible trading solutions</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-blue-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-700 to-blue-900 bg-clip-text text-transparent mb-4">
              Meet Our Team
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The brilliant minds behind QuarksFinance working to revolutionize algorithmic trading
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Team Member 1 */}
            <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 text-center">
              <div className="relative w-32 h-32 mx-auto mb-6 overflow-hidden rounded-full border-4 border-blue-100">
                {/* Replace with actual team member image */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-600"></div>
                <div className="absolute inset-0 flex items-center justify-center text-white text-3xl font-bold">AJ</div>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-1">Alex Johnson</h3>
              <p className="text-blue-600 font-medium mb-3">Founder & CEO</p>
              <p className="text-gray-600 mb-4">Former quantitative analyst with 15+ years of experience at top investment banks. Alex founded QuarksFinance to democratize algorithmic trading.</p>
              <div className="flex justify-center space-x-3">
                <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors">
                  <Twitter size={18} />
                </a>
                <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors">
                  <Linkedin size={18} />
                </a>
              </div>
            </div>
            
            {/* Team Member 2 */}
            <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 text-center">
              <div className="relative w-32 h-32 mx-auto mb-6 overflow-hidden rounded-full border-4 border-blue-100">
                {/* Replace with actual team member image */}
                <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-green-600"></div>
                <div className="absolute inset-0 flex items-center justify-center text-white text-3xl font-bold">ML</div>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-1">Maya Lin</h3>
              <p className="text-blue-600 font-medium mb-3">CTO & Lead Developer</p>
              <p className="text-gray-600 mb-4">AI specialist with a PhD in Machine Learning. Maya leads our engineering team and oversees the development of our adaptive trading algorithms.</p>
              <div className="flex justify-center space-x-3">
                <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors">
                  <Twitter size={18} />
                </a>
                <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors">
                  <Github size={18} />
                </a>
                <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors">
                  <Linkedin size={18} />
                </a>
              </div>
            </div>
            
            {/* Team Member 3 */}
            <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 text-center">
              <div className="relative w-32 h-32 mx-auto mb-6 overflow-hidden rounded-full border-4 border-blue-100">
                {/* Replace with actual team member image */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-purple-600"></div>
                <div className="absolute inset-0 flex items-center justify-center text-white text-3xl font-bold">DR</div>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-1">David Rodriguez</h3>
              <p className="text-blue-600 font-medium mb-3">Chief Strategy Officer</p>
              <p className="text-gray-600 mb-4">Former hedge fund manager with expertise in momentum strategies and risk management. David designs our trading strategies and backtesting frameworks.</p>
              <div className="flex justify-center space-x-3">
                <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors">
                  <Twitter size={18} />
                </a>
                <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors">
                  <Linkedin size={18} />
                </a>
              </div>
            </div>
            
            {/* Team Member 4 */}
            <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 text-center">
              <div className="relative w-32 h-32 mx-auto mb-6 overflow-hidden rounded-full border-4 border-blue-100">
                {/* Replace with actual team member image */}
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-yellow-600"></div>
                <div className="absolute inset-0 flex items-center justify-center text-white text-3xl font-bold">SP</div>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-1">Sarah Patel</h3>
              <p className="text-blue-600 font-medium mb-3">Head of Customer Success</p>
              <p className="text-gray-600 mb-4">Financial advisor with a passion for client education. Sarah ensures our users get the most out of our platform through personalized support and training.</p>
              <div className="flex justify-center space-x-3">
                <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors">
                  <Twitter size={18} />
                </a>
                <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors">
                  <Linkedin size={18} />
                </a>
                <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors">
                  <Mail size={18} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-700 to-blue-900 bg-clip-text text-transparent mb-4">
              Our Core Values
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The principles that guide everything we do at QuarksFinance
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Value 1 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <div className="w-8 h-8 bg-blue-600 rounded-full"></div>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">Innovation</h3>
              <p className="text-gray-600">
                We constantly push the boundaries of what's possible in financial technology, developing cutting-edge solutions that give our users an edge.
              </p>
            </div>
            
            {/* Value 2 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <div className="w-8 h-8 bg-green-600 rounded-full"></div>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">Transparency</h3>
              <p className="text-gray-600">
                We believe in complete transparency in all our operations, from how our algorithms work to our fee structure and performance metrics.
              </p>
            </div>
            
            {/* Value 3 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-6">
                <div className="w-8 h-8 bg-purple-600 rounded-full"></div>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">Education</h3>
              <p className="text-gray-600">
                We're committed to empowering our users through education, providing resources and support to help them make informed trading decisions.
              </p>
            </div>
            
            {/* Value 4 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-6">
                <div className="w-8 h-8 bg-yellow-600 rounded-full"></div>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">Security</h3>
              <p className="text-gray-600">
                We prioritize the security and reliability of our platform, implementing robust measures to protect our users' data and investments.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Transform Your Trading?</h2>
          <p className="text-xl max-w-3xl mx-auto mb-10">
            Join thousands of traders who are already using QuarksFinance to optimize their investment strategies.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="bg-white text-blue-700 hover:bg-blue-50 text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              Start Your Free Trial
            </Button>
            <Link href="/contact">
              <Button variant="outline" className="border-white text-white hover:bg-blue-700 text-lg px-8 py-6 rounded-full transition-all duration-300 hover:shadow-md">
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}