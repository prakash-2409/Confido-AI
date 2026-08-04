'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { cn } from '@/lib/utils';
import {
  Search,
  Bell,
  UserPlus,
  Bot,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background text-foreground flex">
        {/* Sidebar */}
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

        {/* Main content area */}
        <div
          className={cn(
            "flex-1 flex flex-col min-w-0 transition-all duration-200",
            isCollapsed ? "md:pl-14" : "md:pl-56"
          )}
        >
          {/* Top header bar */}
          <header className="sticky top-0 z-20 h-12 border-b border-border bg-background/80 backdrop-blur-md flex items-center justify-between px-6">
            {/* Search */}
            <div className="flex items-center gap-3 w-64 lg:w-80">
              <div className="relative w-full group">
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <Input
                  placeholder="Search candidates, skills..."
                  className="pl-8 h-8 text-xs bg-muted/30 border-border focus-visible:ring-1 focus-visible:ring-ring w-full"
                />
                <kbd className="pointer-events-none absolute right-2.5 top-1.5 hidden h-5 select-none items-center gap-0.5 rounded border border-border bg-muted px-1.5 font-mono text-2xs font-medium text-muted-foreground group-focus-within:hidden md:flex">
                  <span>⌘</span>K
                </kbd>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1.5">
                <Link href="/dashboard/candidates">
                  <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                    <UserPlus className="h-3.5 w-3.5" />
                    Add Candidate
                  </Button>
                </Link>
                <Link href="/dashboard/copilot">
                  <Button size="sm" className="h-7 gap-1.5 text-xs">
                    <Bot className="h-3.5 w-3.5" />
                    AI Copilot
                  </Button>
                </Link>
              </div>

              {/* Notifications */}
              <button className="h-7 w-7 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground relative transition-colors">
                <Bell className="h-4 w-4" />
                <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-evidence-risk" />
              </button>

              {/* User avatar */}
              <Avatar className="h-6 w-6 ring-1 ring-border">
                <AvatarFallback className="bg-primary/5 text-primary text-2xs font-semibold">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto px-6 py-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
