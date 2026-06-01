'use client';

/**
 * Dashboard Layout
 *
 * Wraps all dashboard pages with sidebar and protects the routes with authentication check
 */

import { Sidebar } from '@/components/Sidebar';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { CareerCoachPanel } from '@/components/CareerCoachPanel';

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
        <CareerCoachPanel />
      </div>
    </ProtectedRoute>
  );
}
