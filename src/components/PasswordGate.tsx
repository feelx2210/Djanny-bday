import React, { useState, useEffect } from 'react';
import { Gift } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const CORRECT_PASSWORD = 'djanny2024';
const AUTH_KEY = 'djanny-auth';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

interface AuthSession {
  authenticated: boolean;
  timestamp: number;
}

export const PasswordGate: React.FC<{
  children: React.ReactNode;
}> = ({
  children
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if user is already authenticated
    const stored = localStorage.getItem(AUTH_KEY);
    if (stored) {
      try {
        const session: AuthSession = JSON.parse(stored);
        const now = Date.now();

        // Check if session is still valid (within 24 hours)
        if (session.authenticated && now - session.timestamp < SESSION_DURATION) {
          setIsAuthenticated(true);
        } else {
          // Session expired, clear it
          localStorage.removeItem(AUTH_KEY);
        }
      } catch {
        // Invalid stored data, clear it
        localStorage.removeItem(AUTH_KEY);
      }
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate a small delay for better UX
    setTimeout(() => {
      if (password === CORRECT_PASSWORD) {
        const session: AuthSession = {
          authenticated: true,
          timestamp: Date.now()
        };
        localStorage.setItem(AUTH_KEY, JSON.stringify(session));
        setIsAuthenticated(true);
      } else {
        setError('Incorrect password. Please try again.');
        setPassword('');
      }
      setIsLoading(false);
    }, 500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e as any);
    }
  };

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-background via-card to-background" />
      
      <Card className="w-full max-w-md relative z-10 bg-card/95 border-border shadow-video">
        <CardHeader className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <Gift className="w-8 h-8 text-birthday-gold animate-pulse-glow" />
            <CardTitle className="text-2xl font-bold text-foreground">
              DjannyTok
            </CardTitle>
            <Gift className="w-8 h-8 text-birthday-gold animate-pulse-glow" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">
              Welcome to Djanny's Birthday Videos! 🎂
            </h2>
            <p className="text-sm text-muted-foreground">
              Enter the password to access the celebration
            </p>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col items-center space-y-4">
          <form onSubmit={handleSubmit} className="w-full space-y-4 flex flex-col items-center">
            <div className="w-full">
              <Input type="password" placeholder="Enter password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={handleKeyDown} className="bg-input border-border focus:ring-tiktok-pink focus:border-tiktok-pink text-center" disabled={isLoading} autoFocus />
            </div>

            {error && <div className="text-sm text-destructive text-center animate-fade-in">
                {error}
              </div>}

            <Button type="submit" className="w-full bg-gradient-birthday hover:opacity-90 text-black font-semibold transition-all duration-200 hover:scale-105" disabled={isLoading || !password.trim()}>
              {isLoading ? <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  <span>Checking...</span>
                </div> : 'Enter Birthday Zone 🎉'}
            </Button>
          </form>

          <div className="text-xs text-muted-foreground text-center">
          </div>
        </CardContent>
      </Card>
    </div>;
};
