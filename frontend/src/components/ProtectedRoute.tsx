'use client';

/**
 * Protected Route Component
 * 
 * Wraps pages that require authentication
 * Security: Redirects unauthenticated users to login
 */

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Store the attempted URL for redirect after login
      const searchParams = new URLSearchParams();
      searchParams.set('from', pathname);
      router.push(`/login?${searchParams.toString()}`);
    }
  }, [isAuthenticated, isLoading, router, pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-6"
        >
          <div className="relative">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <div className="absolute -bottom-1 -right-1">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          </div>
          <div className="text-center">
            <p className="font-medium">Loading your dashboard</p>
            <p className="text-sm text-muted-foreground">Please wait a moment...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
