import { useState, useEffect } from 'react';

interface HealthCheckResponse {
  status: string;
  version: string;
}

export const useHealthCheck = () => {
  const [health, setHealth] = useState<HealthCheckResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL;
        console.log('Checking health at:', `${API_URL}/health`);
        const response = await fetch(`${API_URL}/health`);
        if (!response.ok) {
          throw new Error(`Health check failed with status: ${response.status}`);
        }
        const data = await response.json();
        setHealth(data);
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'API unavailable';
        setError(errorMessage);
        console.error('Health check error:', err);
      }
    };

    // Initial check
    checkHealth();
    
    // Check health every 30 seconds
    const interval = setInterval(checkHealth, 30000);

    return () => clearInterval(interval);
  }, []);

  return { health, error };
}; 