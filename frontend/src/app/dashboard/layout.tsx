'use client';

/**
 * Dashboard Layout
 * 
 * Wraps all dashboard pages with sidebar and authentication
 */

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Sidebar } from '@/components/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Sidebar />
        <main className="md:pl-64">
          <div className="container mx-auto px-4 py-8 md:px-8">
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
