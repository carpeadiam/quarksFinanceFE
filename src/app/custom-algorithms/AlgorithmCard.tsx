import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

interface Algorithm {
  id: string;
  name: string;
  description: string;
  created_date: string;
  updated_date: string;
}

interface AlgorithmCardProps {
  algorithm: Algorithm;
  onDelete: (algorithmId: string) => Promise<void>;
}

const AlgorithmCard: React.FC<AlgorithmCardProps> = ({ algorithm, onDelete }) => {
  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${algorithm.name}"? This action cannot be undone.`)) {
      onDelete(algorithm.id);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader>
        <CardTitle style={{ fontFamily: 'JetBrains Mono, monospace', color: '#4C555A' }}>
          {algorithm.name}
        </CardTitle>
        <CardDescription style={{ fontFamily: 'Rubik, sans-serif' }}>
          {algorithm.description || 'No description provided'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="text-sm text-gray-600" style={{ fontFamily: 'Rubik, sans-serif' }}>
            <p>Created: {formatDate(algorithm.created_date)}</p>
            {algorithm.updated_date && algorithm.updated_date !== algorithm.created_date && (
              <p>Updated: {formatDate(algorithm.updated_date)}</p>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2 pt-4">
            <Link href={`/custom-algorithms/${algorithm.id}`}>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                View Details
              </Button>
            </Link>
            <Link href={`/custom-algorithms/${algorithm.id}/edit`}>
              <Button size="sm" variant="outline">
                Edit
              </Button>
            </Link>
            <Link href={`/custom-algorithms/${algorithm.id}/backtest`}>
              <Button size="sm" variant="outline">
                Backtest
              </Button>
            </Link>
            <Button 
              size="sm" 
              variant="outline"
              onClick={handleDelete}
              className="text-red-600 hover:text-red-700 hover:border-red-300"
            >
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AlgorithmCard;