'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Mic,
  GitCompareArrows,
  Kanban,
  Bot,
  BarChart3,
  GraduationCap,
  Settings,
  Shield,
  LogOut,
  Menu,
  ChevronLeft,
  ChevronRight,
  Diamond,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { ThemeToggle } from '@/components/ThemeToggle';

// Navigation structure — hiring intelligence platform
const menuGroups = [
  {
    label: 'Command Center',
    items: [
      { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Hiring Intelligence',
    items: [
      { title: 'Candidates', href: '/dashboard/candidates', icon: Users },
      { title: 'Evidence Engine', href: '/dashboard/evidence', icon: ShieldCheck },
      { title: 'Interview Intel', href: '/dashboard/interview-intelligence', icon: Mic },
      { title: 'Comparison', href: '/dashboard/comparison', icon: GitCompareArrows },
    ],
  },
  {
    label: 'Workspace',
    items: [
      { title: 'Recruiter Board', href: '/dashboard/workspace', icon: Kanban },
      { title: 'AI Copilot', href: '/dashboard/copilot', icon: Bot },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { title: 'Hiring Analytics', href: '/dashboard/analytics', icon: BarChart3 },
      { title: 'Placement Intel', href: '/dashboard/placement', icon: GraduationCap },
    ],
  },
  {
    label: 'Settings',
    items: [
      { title: 'Settings', href: '/dashboard/settings', icon: Settings },
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
  isCollapsed = false,
}: {
  onItemClick?: () => void;
  isCollapsed?: boolean;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const allGroups = [
    ...menuGroups,
    // Admin group only shown to admin users
    ...((user as any)?.role === 'admin'
      ? [
          {
            label: 'System',
            items: [{ title: 'Admin Panel', href: '/dashboard/admin', icon: Shield }],
          },
        ]
      : []),
  ];

  return (
    <div className="flex flex-col h-full bg-card select-none">
      {/* Brand */}
      <div className={cn("flex items-center gap-2.5 px-4 h-14 shrink-0", isCollapsed && "justify-center px-2")}>
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <Diamond className="h-4 w-4 text-primary-foreground" />
        </div>
        {!isCollapsed && (
          <span className="font-semibold text-sm tracking-tight">
            Confido AI
          </span>
        )}
      </div>

      <Separator className="opacity-40" />

      {/* Navigation groups */}
      <div className="flex-1 px-3 py-3 space-y-5 overflow-y-auto overflow-x-hidden scrollbar-thin">
        {allGroups.map((group) => (
          <div key={group.label} className="space-y-0.5">
            {!isCollapsed && (
              <span className="px-3 text-2xs font-semibold uppercase tracking-wider text-muted-foreground/50 block mb-1.5">
                {group.label}
              </span>
            )}
            <nav className="space-y-0.5">
              {group.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/dashboard' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onItemClick}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors group",
                      isActive
                        ? "bg-primary/[0.08] text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                      isCollapsed && "justify-center px-2 py-2"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "h-4 w-4 shrink-0",
                        isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                      )}
                    />
                    {!isCollapsed && <span>{item.title}</span>}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      <Separator className="opacity-40" />

      {/* User footer */}
      <div className={cn("p-3 space-y-2", isCollapsed && "p-2 space-y-3 flex flex-col items-center")}>
        <div className={cn("flex items-center gap-2.5", isCollapsed && "flex-col")}>
          <Avatar className="h-7 w-7 ring-1 ring-border shrink-0">
            <AvatarFallback className="bg-primary/5 text-primary text-2xs font-semibold">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate leading-none mb-0.5">{user?.name}</p>
              <p className="text-2xs text-muted-foreground truncate leading-none">{user?.email}</p>
            </div>
          )}
          <ThemeToggle />
        </div>

        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "w-full justify-start gap-2 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/5",
            isCollapsed && "justify-center p-2"
          )}
          onClick={logout}
        >
          <LogOut className="h-3.5 w-3.5 shrink-0" />
          {!isCollapsed && <span>Log out</span>}
        </Button>
      </div>
    </div>
  );
}

export function Sidebar({
  isCollapsed = false,
  setIsCollapsed,
}: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile drawer trigger */}
      <div className="md:hidden fixed top-3 left-3 z-40">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="h-9 w-9 bg-background/80 backdrop-blur-sm border-border shadow-sm">
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-60 p-0 border-r border-border">
            <NavContent onItemClick={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden md:flex md:flex-col md:fixed md:inset-y-0 border-r border-border bg-card transition-all duration-200 z-30",
          isCollapsed ? "md:w-14" : "md:w-56"
        )}
      >
        <NavContent isCollapsed={isCollapsed} />

        {/* Collapse toggle */}
        {setIsCollapsed && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-3 top-5 h-6 w-6 rounded-full border border-border bg-background flex items-center justify-center text-muted-foreground hover:text-foreground shadow-sm transition-colors z-40 hidden md:flex"
          >
            {isCollapsed ? (
              <ChevronRight className="h-3 w-3" />
            ) : (
              <ChevronLeft className="h-3 w-3" />
            )}
          </button>
        )}
      </aside>
    </>
  );
}
