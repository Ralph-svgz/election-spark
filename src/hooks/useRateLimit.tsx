import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  message?: string;
}

interface RateLimitState {
  attempts: number;
  lastReset: number;
}

export const useRateLimit = (config: RateLimitConfig) => {
  const { maxAttempts, windowMs, message = 'Too many attempts. Please try again later.' } = config;
  const [state, setState] = useState<RateLimitState>({
    attempts: 0,
    lastReset: Date.now()
  });
  const { toast } = useToast();

  const checkRateLimit = useCallback(() => {
    const now = Date.now();
    
    // Reset if window has passed
    if (now - state.lastReset > windowMs) {
      setState({ attempts: 0, lastReset: now });
      return true;
    }

    // Check if under limit
    if (state.attempts < maxAttempts) {
      setState(prev => ({ ...prev, attempts: prev.attempts + 1 }));
      return true;
    }

    // Rate limited
    toast({
      title: "Rate Limited",
      description: message,
      variant: "destructive"
    });
    return false;
  }, [state, maxAttempts, windowMs, message, toast]);

  const reset = useCallback(() => {
    setState({ attempts: 0, lastReset: Date.now() });
  }, []);

  return {
    checkRateLimit,
    reset,
    isLimited: state.attempts >= maxAttempts,
    remainingAttempts: Math.max(0, maxAttempts - state.attempts)
  };
};