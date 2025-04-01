import { useState, useEffect } from 'react';

interface HealthStatus {
  status: string;
  version: string;
  timestamp: string;
}

export const useHealthCheck = () => {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkHealth = async () => {
    try {
      const response = await fetch('/health');
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }
      const data = await response.json();
      setHealth(data);
      setError(null);
    } catch (err) {
      console.error('Health check error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setHealth(null);
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return { health, error };
}; 