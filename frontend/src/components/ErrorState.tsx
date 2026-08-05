'use client';

import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ title = 'Something went wrong', message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center select-none w-full">
      <div className="h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center mb-4">
        <AlertCircle className="h-6 w-6 text-destructive" />
      </div>
      <h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground max-w-sm leading-relaxed mb-4">{message}</p>
      {onRetry && (
        <Button size="sm" variant="outline" className="text-xs h-8" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
}
