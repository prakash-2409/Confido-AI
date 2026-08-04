'use client';

import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  badge?: string;
  children?: React.ReactNode; // Action buttons
  className?: string;
}

export function PageHeader({ title, description, icon: Icon, badge, children, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6", className)}>
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div className="h-8 w-8 rounded-lg bg-primary/5 border border-primary/10 flex items-center justify-center shrink-0">
              <Icon className="h-4 w-4 text-primary" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
              {badge && (
                <span className="inline-flex items-center rounded-md bg-primary/5 px-2 py-0.5 text-2xs font-medium text-primary ring-1 ring-inset ring-primary/10">
                  {badge}
                </span>
              )}
            </div>
            {description && (
              <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
            )}
          </div>
        </div>
      </div>
      {children && (
        <div className="flex items-center gap-2 shrink-0">
          {children}
        </div>
      )}
    </div>
  );
}
