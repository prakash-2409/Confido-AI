'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { CareerCoachPanel } from '@/components/CareerCoachPanel';
import { cn } from '@/lib/utils';
import { 
  Search, 
  Bell, 
  HelpCircle, 
  Sparkles, 
  Plus, 
  FileText, 
  Zap,
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
        {/* Collapsible Sidebar */}
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

        {/* Right side page context layout */}
        <div className={cn(
          "flex-1 flex flex-col min-w-0 transition-all duration-300",
          isCollapsed ? "md:pl-16" : "md:pl-64"
        )}>
          {/* Top Navbar */}
          <header className="sticky top-0 z-20 h-14 border-b border-border/40 bg-background/80 backdrop-blur-md flex items-center justify-between px-6">
            {/* Search Bar / Cmd+K style wrapper */}
            <div className="flex items-center gap-3 w-72 md:w-96">
              <div className="relative w-full group">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <Input 
                  placeholder="Search modules, files..." 
                  className="pl-9 h-8.5 text-xs bg-muted/30 border-border/40 focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-primary/20 w-full"
                />
                <kbd className="pointer-events-none absolute right-3 top-2 hidden h-4.5 select-none items-center gap-0.5 rounded border border-border bg-muted px-1.5 font-mono text-[9px] font-medium text-muted-foreground shadow-sm group-focus-within:hidden md:flex">
                  <span>⌘</span>K
                </kbd>
              </div>
            </div>

            {/* Quick Actions & Profiles */}
            <div className="flex items-center gap-4">
              {/* Quick Action Trigger */}
              <div className="hidden sm:flex items-center gap-2">
                <Link href="/dashboard/resume">
                  <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                    <FileText className="h-3.5 w-3.5" />
                    ATS Scan
                  </Button>
                </Link>
                <Link href="/dashboard/interview">
                  <Button size="sm" className="h-8 gap-1.5 text-xs shadow-sm hover:shadow-md">
                    <Zap className="h-3.5 w-3.5" />
                    Mock Interview
                  </Button>
                </Link>
              </div>

              {/* Notification icon wrapper */}
              <button className="h-8 w-8 rounded-lg hover:bg-muted/70 flex items-center justify-center text-muted-foreground hover:text-foreground relative transition-colors">
                <Bell className="h-4.5 w-4.5" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
              </button>

              {/* Help widget */}
              <button className="h-8 w-8 rounded-lg hover:bg-muted/70 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                <HelpCircle className="h-4.5 w-4.5" />
              </button>

              {/* Avatar trigger */}
              <Avatar className="h-7 w-7 ring-1 ring-border shadow-sm">
                <AvatarFallback className="bg-primary/5 text-primary text-[10px] font-bold font-mono">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </div>
          </header>

          {/* Main Dashboard Workspace Content */}
          <main className="flex-1 overflow-y-auto">
            <div className="container mx-auto px-6 py-8 md:px-8 max-w-7xl">
              {children}
            </div>
          </main>
        </div>
        
        {/* Collapsible Floating Career Coach AI Panel */}
        <CareerCoachPanel />
      </div>
    </ProtectedRoute>
  );
}
