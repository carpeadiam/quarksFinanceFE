"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from '../../../components/navigation/Navbar';
import Link from 'next/link';
import axios from 'axios';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { TerminalInterface } from '../../../components/ui';

// API functions inlined
const API_URL = 'https://thecodeworks.in/quarksfinance/api';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('quarksFinanceToken');
    if (token) {
      config.headers['x-access-token'] = token;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const getAlgorithmTemplates = async () => {
  const response = await api.get('/algorithms/templates');
  return response.data;
};

const createFromTemplate = async (templateData: {
  template_name: string;
  name: string;
  description: string;
}) => {
  const response = await api.post('/algorithms/from-template', templateData);
  return response.data;
};

interface Template {
  name: string;
  description: string;
  config: any;
}

const TemplatesPage: React.FC = () => {
  const router = useRouter();
  const [templates, setTemplates] = useState<Record<string, Template>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [creating, setCreating] = useState<string>('');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [showTerminal, setShowTerminal] = useState<boolean>(false);

  // Add keyboard event listener for terminal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Shift+T (terminal)
      if (e.shiftKey && e.key === 'T') {
        e.preventDefault();
        setShowTerminal(true);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const storedToken = localStorage.getItem('quarksFinanceToken');
    
    if (storedToken) {
      setIsLoggedIn(true);
      fetchTemplates();
    } else {
      router.push('/home');
    }
  }, [router]);

  const showMessage = (message: string, isError: boolean = false): void => {
    if (isError) {
      setErrorMessage(message);
      setSuccessMessage('');
    } else {
      setSuccessMessage(message);
      setErrorMessage('');
    }
    
    setTimeout(() => {
      setErrorMessage('');
      setSuccessMessage('');
    }, 3000);
  };

  const fetchTemplates = async (): Promise<void> => {
    try {
      setLoading(true);
      
      const response = await getAlgorithmTemplates();
      
      if (response.success) {
        setTemplates(response.templates || {});
      }
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('quarksFinanceToken');
        setIsLoggedIn(false);
        router.push('/login');
        showMessage('Session expired. Please log in again.', true);
        return;
      }
      showMessage('Error fetching templates. Please try again.', true);
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFromTemplate = async (templateKey: string, templateName: string): Promise<void> => {
    const algorithmName = prompt(`Enter a name for your new algorithm based on "${templateName}":`);
    
    if (!algorithmName) return;
    
    try {
      setCreating(templateKey);
      
      const response = await createFromTemplate({
        template_name: templateKey,
        name: algorithmName,
        description: `Algorithm created from ${templateName} template`
      });
      
      if (response.success) {
        showMessage(`Algorithm "${algorithmName}" created successfully from template`);
        // Redirect to the new algorithm after a short delay
        setTimeout(() => {
          router.push('/custom-algorithms');
        }, 2000);
      } else {
        showMessage(response.message || 'Failed to create algorithm from template', true);
      }
    } catch (err: any) {
      showMessage('Error creating algorithm. Please try again.', true);
      console.error("Create error:", err);
    } finally {
      setCreating('');
    }
  };

  if (!isLoggedIn) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <nav className="px-6 mt-4 flex items-center gap-4 text-sm">
        <Link href="/home" className="text-black text-2xl" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>Home</Link>
        <span className="text-black text-2xl" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>&gt;</span>
        <Link href="/custom-algorithms" className="text-black text-2xl" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>Custom Algorithms</Link>
        <span className="text-black text-2xl" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>&gt;</span>
        <Link href="/custom-algorithms/templates" className="text-black text-2xl" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>Templates</Link>
      </nav>
      
      <div className="container mx-auto px-4 md:px-40 py-8">
        <div className="w-full px-4 mt-4">
          {/* Header Section */}
          <div className="flex items-center justify-between mb-24 bg-white rounded-lg p-8 relative overflow-hidden border shadow-sm" style={{ minHeight: '100px' }}>
            <div>
              <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'JetBrains Mono, monospace', color: '#4C555A' }}>
                Algorithm~Templates
              </h1>
              <p className="text-black" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '17px' }}>
                Choose from pre-built algorithm templates to get started quickly
              </p>
            </div>
            <div className="absolute left-172 w-full h-full">
              <img 
                src="/images/templates.svg" 
                alt="Templates illustration" 
                className="scale-148"
              />
            </div>
          </div>

          {/* Success/Error Messages */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg">
              {successMessage}
            </div>
          )}
          {errorMessage && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg">
              {errorMessage}
            </div>
          )}

          {/* Back Button */}
          <div className="mb-8">
            <Link href="/custom-algorithms">
              <Button variant="outline">
                ← Back to Algorithms
              </Button>
            </Link>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner />
            </div>
          )}

          {/* Templates Grid */}
          {!loading && (
            <div className="space-y-6">
              {Object.keys(templates).length === 0 ? (
                <Card className="p-8 text-center">
                  <CardContent>
                    <h3 className="text-xl font-semibold mb-4" style={{ fontFamily: 'JetBrains Mono, monospace', color: '#4C555A' }}>
                      No Templates Available
                    </h3>
                    <p className="text-gray-600 mb-6" style={{ fontFamily: 'Rubik, sans-serif' }}>
                      Templates are not currently available. Try creating an algorithm from scratch.
                    </p>
                    <Link href="/custom-algorithms">
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                        Create Custom Algorithm
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(templates).map(([key, template]) => (
                    <Card key={key} className="hover:shadow-lg transition-shadow duration-200">
                      <CardHeader>
                        <CardTitle style={{ fontFamily: 'JetBrains Mono, monospace', color: '#4C555A' }}>
                          {template.name}
                        </CardTitle>
                        <CardDescription style={{ fontFamily: 'Rubik, sans-serif' }}>
                          {template.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {/* Template Features */}
                          {template.config && (
                            <div className="text-sm text-gray-600">
                              <h4 className="font-medium mb-2">Features:</h4>
                              <ul className="list-disc list-inside space-y-1">
                                {template.config.buy_rules?.length && (
                                  <li>{template.config.buy_rules.length} buy rule(s)</li>
                                )}
                                {template.config.sell_rules?.length && (
                                  <li>{template.config.sell_rules.length} sell rule(s)</li>
                                )}
                                {template.config.risk_management && (
                                  <li>Risk management included</li>
                                )}
                              </ul>
                            </div>
                          )}
                          
                          {/* Action Button */}
                          <Button 
                            onClick={() => handleCreateFromTemplate(key, template.name)}
                            disabled={creating === key}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            {creating === key ? 'Creating...' : 'Use This Template'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <TerminalInterface 
        isVisible={showTerminal}
        onClose={() => setShowTerminal(false)}
      />
    </div>
  );
};

export default TemplatesPage;