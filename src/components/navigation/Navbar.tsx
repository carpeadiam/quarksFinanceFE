'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import AuthButtons from './AuthButtons';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="flex flex-col">
      <nav className="py-4 px-6">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/home" className="flex items-center gap-2">
            <Image 
              src="/images/logo.svg" 
              alt="QuarksLab" 
              width={32} 
              height={32} 
              //className="rotating-logo" 
            />
            <span className="text-2xl font-semibold" style={{ fontFamily: 'JetBrains Mono, monospace', color: '#4C555A' }}>QuarksLab</span>
          </Link>
          
          <div className="flex items-center gap-4">
            <AuthButtons />
            
            {/* Three Dots Menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={toggleMenu}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                aria-label="More options"
              >
                <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                  className="text-gray-600"
                >
                  <circle cx="12" cy="12" r="1"/>
                  <circle cx="12" cy="5" r="1"/>
                  <circle cx="12" cy="19" r="1"/>
                </svg>
              </button>

              {/* Dropdown Menu */}
              {isMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg border border-gray-200 shadow-lg py-2 z-50">
                  <Link 
                    href="/nsedocs" 
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    NSE Symbols Guide
                  </Link>
                  <Link 
                    href="/terminaldocs" 
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    QuarkScript Docs
                  </Link>

                    <Link 
                    href="/integrations/discord" 
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Discord Bot 
                  </Link>


                  <Link 
                    href="/about" 
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    About us
                  </Link>

                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}