import { useEffect, useState } from 'react';

export const useTimeBasedGradient = () => {
  const [gradientStyle, setGradientStyle] = useState('');

  const calculateGradient = () => {
    const hour = new Date().getHours();
    let startColor, endColor, opacity;

    // Night (0-6)
    if (hour >= 0 && hour < 6) {
      startColor = 'var(--gradient-night-start)';
      endColor = 'var(--gradient-night-end)';
      opacity = 0.8;
    }
    // Morning (6-12)
    else if (hour >= 6 && hour < 12) {
      startColor = 'var(--gradient-morning-start)';
      endColor = 'var(--gradient-morning-end)';
      opacity = 0.6;
    }
    // Afternoon (12-18)
    else if (hour >= 12 && hour < 18) {
      startColor = 'var(--gradient-afternoon-start)';
      endColor = 'var(--gradient-afternoon-end)';
      opacity = 0.7;
    }
    // Evening (18-24)
    else {
      startColor = 'var(--gradient-evening-start)';
      endColor = 'var(--gradient-evening-end)';
      opacity = 0.75;
    }

    return `linear-gradient(
      135deg,
      color-mix(in srgb, ${startColor} ${opacity * 100}%, transparent) 0%,
      color-mix(in srgb, ${endColor} ${opacity * 100}%, transparent) 70%
    )`;
  };

  useEffect(() => {
    // Initial gradient
    setGradientStyle(calculateGradient());

    // Update gradient every minute
    const interval = setInterval(() => {
      setGradientStyle(calculateGradient());
    }, 60000); // 60000ms = 1 minute

    return () => clearInterval(interval);
  }, []);

  return gradientStyle;
}; 