'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  User,
  LogOut,
  Menu,
  Sparkles,
  CreditCard,
  Shield,
  Map,
  Building2,
  Target,
  ChevronLeft,
  ChevronRight,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { ThemeToggle } from '@/components/ThemeToggle';

// Grouped navigation items
const menuGroups = [
  {
    label: 'Overview',
    items: [
      { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { title: 'Profile', href: '/dashboard/profile', icon: User },
    ],
  },
  {
    label: 'Core Modules',
    items: [
      { title: 'Resume Analysis', href: '/dashboard/resume', icon: FileText },
      { title: 'Interview Prep', href: '/dashboard/interview', icon: MessageSquare },
      { title: 'Job Match', href: '/dashboard/job-match', icon: Target },
      { title: 'Learning Roadmap', href: '/dashboard/roadmap', icon: Map },
      { title: 'Company Prep', href: '/dashboard/companies', icon: Building2 },
    ],
  },
  {
    label: 'Settings & Billing',
    items: [
      { title: 'Subscription', href: '/dashboard/subscription', icon: CreditCard },
    ],
  },
];

interface SidebarProps {
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
  onItemClick?: () => void;
}

export function NavContent({ 
  onItemClick, 
  isCollapsed = false 
}: { 
  onItemClick?: () => void; 
  isCollapsed?: boolean;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const allGroups = [
    ...menuGroups,
    // Admin group only shown to admin users
    ...((user as any)?.role === 'admin' ? [{
      label: 'System Admin',
      items: [{ title: 'Admin Panel', href: '/dashboard/admin', icon: Shield }]
    }] : []),
  ];

  return (
    <div className="flex flex-col h-full bg-card select-none">
      {/* Brand logo header */}
      <div className={cn("flex items-center gap-2.5 px-4 py-5", isCollapsed && "justify-center px-2")}>
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shadow-premium shrink-0">
          <Sparkles className="h-4.5 w-4.5 text-primary-foreground animate-pulse" />
        </div>
        {!isCollapsed && (
          <span className="font-bold text-base tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
            CareerAI
          </span>
        )}
      </div>

      <Separator className="opacity-50" />

      {/* Navigation Group list */}
      <div className="flex-1 px-3 py-4 space-y-6 overflow-y-auto overflow-x-hidden scrollbar-thin">
        {allGroups.map((group) => (
          <div key={group.label} className="space-y-1.5">
            {!isCollapsed && (
              <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 block">
                {group.label}
              </span>
            )}
            <nav className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onItemClick}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group duration-200',
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/60',
                      isCollapsed && "justify-center px-2 py-2.5"
                    )}
                  >
                    <item.icon className={cn("h-4.5 w-4.5 shrink-0 transition-transform group-hover:scale-105", isActive && "text-primary-foreground")} />
                    {!isCollapsed && <span>{item.title}</span>}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      <Separator className="opacity-50" />

      {/* Profile & Controls footer */}
      <div className={cn("p-4 space-y-3", isCollapsed && "p-2 space-y-4 flex flex-col items-center")}>
        <div className={cn("flex items-center gap-3", isCollapsed && "flex-col")}>
          <Avatar className="h-8 w-8 ring-1 ring-border shadow-sm shrink-0">
            <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold font-mono">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate leading-none mb-1">{user?.name}</p>
              <p className="text-[10px] text-muted-foreground truncate leading-none">{user?.email}</p>
            </div>
          )}
          <ThemeToggle />
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "w-full justify-start gap-2 hover:bg-danger/10 hover:text-danger text-xs text-muted-foreground transition-all",
            isCollapsed && "justify-center p-2"
          )}
          onClick={logout}
        >
          <LogOut className="h-3.5 w-3.5 shrink-0" />
          {!isCollapsed && <span>Logout</span>}
        </Button>
      </div>
    </div>
  );
}

export function Sidebar({ 
  isCollapsed = false, 
  setIsCollapsed 
}: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile Drawer Trigger & Sheet */}
      <div className="md:hidden fixed top-3 left-4 z-40">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="h-9 w-9 bg-background/80 backdrop-blur-sm border-border/80 shadow-sm">
              <Menu className="h-4.5 w-4.5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 border-r border-border/50">
            <NavContent onItemClick={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar Layout */}
      <aside 
        className={cn(
          "hidden md:flex md:flex-col md:fixed md:inset-y-0 border-r border-border/40 bg-card transition-all duration-300 z-30",
          isCollapsed ? "md:w-16" : "md:w-64"
        )}
      >
        <NavContent isCollapsed={isCollapsed} />
        
        {/* Toggle Collapse Trigger Button */}
        {setIsCollapsed && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-3 top-6 h-6 w-6 rounded-full border border-border bg-background flex items-center justify-center text-muted-foreground hover:text-foreground shadow-sm hover:scale-105 active:scale-95 transition-all z-40 hidden md:flex"
          >
            {isCollapsed ? (
              <ChevronRight className="h-3.5 w-3.5" />
            ) : (
              <ChevronLeft className="h-3.5 w-3.5" />
            )}
          </button>
        )}
      </aside>
    </>
  );
}
