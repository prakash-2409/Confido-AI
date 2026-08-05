'use client';

import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = 'Loading details...' }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 w-full">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
      <p className="text-xs text-muted-foreground">{message}</p>
    </div>
  );
}
