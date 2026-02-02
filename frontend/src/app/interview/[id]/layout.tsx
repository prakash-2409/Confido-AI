'use client';

/**
 * Interview Layout
 * 
 * Wraps interview pages with authentication
 */

import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function InterviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-8 md:px-8">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
