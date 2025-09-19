"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from '../../components/navigation/Navbar';
import Link from 'next/link';
import TerminalManager from '../../components/ui/TerminalManager';
import axios from 'axios';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import AlgorithmCard from './AlgorithmCard';
import CreateAlgorithmModal from './CreateAlgorithmModal';
import { TerminalInterface } from '../../components/ui';

interface Algorithm {
  id: string;
  name: string;
  description: string;
  created_date: string;
  updated_date: string;
}

interface Template {
  name: string;
  description: string;
  config: any;
}

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

const getAlgorithms = async () => {
  const response = await api.get('/algorithms');
  return response.data;
};

const deleteAlgorithm = async (algorithmId: string) => {
  const response = await api.delete(`/algorithms/${algorithmId}`);
  return response.data;
};

const getAlgorithmTemplates = async () => {
  const response = await api.get('/algorithms');
  return response.data;
};

const CustomAlgorithmsPage: React.FC = () => {
  const router = useRouter();
  const [algorithms, setAlgorithms] = useState<Algorithm[]>([]);
  const [templates, setTemplates] = useState<Record<string, Template>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
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
      fetchData();
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

  const fetchData = async (): Promise<void> => {
    try {
      setLoading(true);
      
      const [algorithmsResponse, templatesResponse] = await Promise.all([
        getAlgorithms(),
        getAlgorithmTemplates()
      ]);
      
      if (algorithmsResponse.success) {
        setAlgorithms(algorithmsResponse.algorithms || []);
      }
      
      if (templatesResponse.success) {
        setTemplates(templatesResponse.templates || {});
      }
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('quarksFinanceToken');
        setIsLoggedIn(false);
        router.push('/login');
        showMessage('Session expired. Please log in again.', true);
        return;
      }
      showMessage('Error fetching data. Please try again.', true);
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAlgorithm = async (algorithmId: string): Promise<void> => {
    try {
      const response = await deleteAlgorithm(algorithmId);
      
      if (response.success) {
        showMessage('Algorithm deleted successfully');
        setAlgorithms(prev => prev.filter(algo => algo.id !== algorithmId));
      } else {
        showMessage(response.message || 'Failed to delete algorithm', true);
      }
    } catch (err: any) {
      showMessage('Error deleting algorithm. Please try again.', true);
      console.error("Delete error:", err);
    }
  };

  const handleCreateSuccess = (): void => {
    setShowCreateModal(false);
    fetchData();
    showMessage('Algorithm created successfully');
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
      </nav>
      
      <div className="container mx-auto px-4 md:px-40 py-8">
        <div className="w-full px-4 mt-4">
          {/* Header Section */}
          <div className="flex items-center justify-between mb-24 bg-white rounded-lg p-8 relative overflow-hidden border shadow-sm" style={{ minHeight: '100px' }}>
            <div>
              <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'JetBrains Mono, monospace', color: '#4C555A' }}>
                Custom~Algorithms
              </h1>
              <p className="text-black" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '17px' }}>
                Build, test, and optimize your own algorithmic trading strategies
              </p>
            </div>
            <div className="relative ml-8">
              <img 
                src="/images/custominside.png" 
                alt="Custom algorithms illustration" 
                className="w-48 h-auto object-contain scale-450"
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

          {/* Quick Actions */}
          <div className="mb-8">
            <div className="flex flex-wrap gap-4">
              <Button 
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Create New Algorithm
              </Button>
              <Link href="/custom-algorithms/templates">
                <Button variant="outline">
                  Browse Templates
                </Button>
              </Link>
              <Link href="/custom-algorithms/indicators">
                <Button variant="outline">
                  View Indicators
                </Button>
              </Link>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner />
            </div>
          )}

          {/* Algorithms List */}
          {!loading && (
            <div className="space-y-6">
              {algorithms.length === 0 ? (
                <Card className="p-8 text-center">
                  <CardContent>
                    <h3 className="text-xl font-semibold mb-4" style={{ fontFamily: 'JetBrains Mono, monospace', color: '#4C555A' }}>
                      No Custom Algorithms Yet
                    </h3>
                    <p className="text-gray-600 mb-6" style={{ fontFamily: 'Rubik, sans-serif' }}>
                      Get started by creating your first algorithm or choosing from our templates.
                    </p>
                    <div className="flex justify-center gap-4">
                      <Button 
                        onClick={() => setShowCreateModal(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Create Algorithm
                      </Button>
                      <Link href="/custom-algorithms/templates">
                        <Button variant="outline">
                          Browse Templates
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {algorithms.map((algorithm) => (
                    <AlgorithmCard
                      key={algorithm.id}
                      algorithm={algorithm}
                      onDelete={handleDeleteAlgorithm}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Algorithm Modal */}
      {showCreateModal && (
        <CreateAlgorithmModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
          templates={templates}
        />
      )}
      
      <TerminalManager 
        isVisible={showTerminal}
        onClose={() => setShowTerminal(false)}
      />
    </div>
  );
};

export default CustomAlgorithmsPage;