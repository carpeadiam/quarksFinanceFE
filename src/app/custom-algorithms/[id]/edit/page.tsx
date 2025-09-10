"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Navbar from '../../../../components/navigation/Navbar';
import Link from 'next/link';
import axios from 'axios';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import LoadingSpinner from '../../../../components/ui/LoadingSpinner';

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

const getAlgorithm = async (algorithmId: string) => {
  const response = await api.get(`/algorithms/${algorithmId}`);
  return response.data;
};

const updateAlgorithm = async (algorithmId: string, algorithmData: any) => {
  const response = await api.put(`/algorithms/${algorithmId}`, algorithmData);
  return response.data;
};

interface Algorithm {
  id: string;
  name: string;
  description: string;
  created_date: string;
  updated_date: string;
  config: any;
}

const EditAlgorithmPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const algorithmId = params.id as string;
  
  const [algorithm, setAlgorithm] = useState<Algorithm | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    const storedToken = localStorage.getItem('quarksFinanceToken');
    
    if (storedToken) {
      setIsLoggedIn(true);
      fetchAlgorithm();
    } else {
      router.push('/home');
    }
  }, [router, algorithmId]);

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

  const fetchAlgorithm = async (): Promise<void> => {
    try {
      setLoading(true);
      
      const response = await getAlgorithm(algorithmId);
      
      if (response.success) {
        setAlgorithm(response.algorithm);
        setFormData({
          name: response.algorithm.name || '',
          description: response.algorithm.description || ''
        });
      } else {
        setErrorMessage('Algorithm not found');
      }
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('quarksFinanceToken');
        setIsLoggedIn(false);
        router.push('/login');
        setErrorMessage('Session expired. Please log in again.');
        return;
      }
      const errorMessage = handleApiError(err);
      setErrorMessage(errorMessage);
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  const handleCancel = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(`/custom-algorithms/${algorithmId}`);
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    
    if (!formData.name.trim()) {
      setErrorMessage('Algorithm name is required');
      return;
    }

    setSaving(true);
    setIsSubmitting(true);
    setErrorMessage('');
    
    try {
      // Create the complete algorithm data with existing config
      const updateData = {
        ...algorithm, // Include all existing algorithm data
        name: formData.name.trim(),
        description: formData.description.trim(),
        // Ensure we preserve the config structure
        config: {
          ...(algorithm?.config || {}),
          name: formData.name.trim(),
          description: formData.description.trim()
        }
      };

      const response = await updateAlgorithm(algorithmId, updateData);
      
      if (response.success) {
        showMessage('Algorithm updated successfully!');
        // Refresh the algorithm data
        setTimeout(() => {
          fetchAlgorithm();
        }, 1000);
      } else {
        showMessage(response.message || 'Failed to update algorithm', true);
      }
    } catch (err: any) {
      const errorMessage = handleApiError(err);
      showMessage(errorMessage, true);
      console.error("Update error:", err);
    } finally {
      setSaving(false);
      setIsSubmitting(false);
    }
  };
  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setErrorMessage('Algorithm name is required');
      return false;
    }
    
    if (formData.name.length > 100) {
      setErrorMessage('Algorithm name must be less than 100 characters');
      return false;
    }
    
    if (formData.description.length > 500) {
      setErrorMessage('Description must be less than 500 characters');
      return false;
    }
    
    return true;
  };
  const handleApiError = (error: any): string => {
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('quarksFinanceToken');
      setIsLoggedIn(false);
      router.push('/login');
      return 'Session expired. Please log in again.';
    }
    return 'An unexpected error occurred. Please try again.';
  };
  if (!isLoggedIn) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (!algorithm) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="container mx-auto px-4 md:px-40 py-8">
          <Card className="p-8 text-center">
            <CardContent>
              <h3 className="text-xl font-semibold mb-4" style={{ fontFamily: 'JetBrains Mono, monospace', color: '#4C555A' }}>
                Algorithm Not Found
              </h3>
              <p className="text-gray-600 mb-6" style={{ fontFamily: 'Rubik, sans-serif' }}>
                The algorithm you're looking for doesn't exist or you don't have permission to edit it.
              </p>
              <Link href="/custom-algorithms">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  Back to Algorithms
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <nav className="px-6 mt-4 flex items-center gap-4 text-sm">
        <Link href="/home" className="text-black text-2xl" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>Home</Link>
        <span className="text-black text-2xl" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>&gt;</span>
        <Link href="/custom-algorithms" className="text-black text-2xl" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>Custom Algorithms</Link>
        <span className="text-black text-2xl" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>&gt;</span>
        <Link href={`/custom-algorithms/${algorithmId}`} className="text-black text-2xl" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>{algorithm.name}</Link>
        <span className="text-black text-2xl" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>&gt;</span>
        <span className="text-black text-2xl" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>Edit</span>
      </nav>
      
      <div className="container mx-auto px-4 md:px-40 py-8">
        <div className="w-full px-4 mt-4">
          {/* Header Section */}
          <div className="flex items-center justify-between mb-24 bg-white rounded-lg p-8 relative overflow-hidden border shadow-sm" style={{ minHeight: '100px' }}>
            <div>
              <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'JetBrains Mono, monospace', color: '#4C555A' }}>
                Edit~{algorithm.name}
              </h1>
              <p className="text-black" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '17px' }}>
                Update your algorithm settings and configuration
              </p>
            </div>
            <div className="absolute left-172 w-full h-full">
              <img 
                src="/images/edit.svg" 
                alt="Edit illustration" 
                className="scale-148"
              />
            </div>
          </div>

          {/* Messages */}
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

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Edit Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle style={{ fontFamily: 'JetBrains Mono, monospace', color: '#4C555A' }}>
                    Algorithm Details
                  </CardTitle>
                  <CardDescription style={{ fontFamily: 'Rubik, sans-serif' }}>
                    Update the basic information about your algorithm
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Algorithm Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full rounded-md border border-zinc-300 bg-blue-50 px-3 py-2 text-zinc-800 placeholder-zinc-500 ring-1 ring-transparent transition-shadow focus:outline-0 focus:ring-blue-700"
                        placeholder="Enter algorithm name"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={4}
                        className="w-full rounded-md border border-zinc-300 bg-blue-50 px-3 py-2 text-zinc-800 placeholder-zinc-500 ring-1 ring-transparent transition-shadow focus:outline-0 focus:ring-blue-700"
                        placeholder="Describe your algorithm..."
                      />
                    </div>

                    

                    <div className="flex gap-4 pt-6 border-t">
                      <Button 
                        type="submit" 
                        disabled={saving || isSubmitting}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {saving || isSubmitting ? (
                          <>
                            <LoadingSpinner />
                            Saving...
                          </>
                        ) : (
                          'Save Changes'
                        )}
                      </Button>
                      <Link href={`/custom-algorithms/${algorithmId}`}>
                        <Button variant="outline" onClick={handleCancel}>
                          Cancel
                        </Button>
                      </Link>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Current Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Current Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="text-sm font-medium text-gray-600">Current Name</div>
                    <div className="text-sm font-semibold">{algorithm.name}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-600">Current Description</div>
                    <div className="text-sm">{algorithm.description || 'No description'}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-600">Created</div>
                    <div className="text-sm">{new Date(algorithm.created_date).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-600">Last Updated</div>
                    <div className="text-sm">{new Date(algorithm.updated_date).toLocaleDateString()}</div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href={`/custom-algorithms/${algorithmId}`} className="block">
                    <Button variant="outline" className="w-full">
                      View Details
                    </Button>
                  </Link>
                  <Link href={`/custom-algorithms/${algorithmId}/backtest`} className="block">
                    <Button variant="outline" className="w-full">
                      Run Backtest
                    </Button>
                  </Link>
                  <Link href={`/custom-algorithms/${algorithmId}/strategy`} className="block">
                    <Button variant="outline" className="w-full">
                      strategy
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditAlgorithmPage;
