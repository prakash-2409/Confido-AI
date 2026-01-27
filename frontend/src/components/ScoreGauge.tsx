'use client';

/**
 * ATS Score Gauge Component
 * 
 * Visual representation of ATS compatibility score
 */

import { cn } from '@/lib/utils';

interface ScoreGaugeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function ScoreGauge({ score, size = 'md', showLabel = true }: ScoreGaugeProps) {
  const normalizedScore = Math.min(100, Math.max(0, score));
  
  // Determine color based on score
  const getColor = () => {
    if (normalizedScore >= 80) return 'text-green-500';
    if (normalizedScore >= 60) return 'text-yellow-500';
    if (normalizedScore >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  const getGradient = () => {
    if (normalizedScore >= 80) return 'from-green-500 to-emerald-500';
    if (normalizedScore >= 60) return 'from-yellow-500 to-amber-500';
    if (normalizedScore >= 40) return 'from-orange-500 to-amber-500';
    return 'from-red-500 to-rose-500';
  };

  const getLabel = () => {
    if (normalizedScore >= 80) return 'Excellent';
    if (normalizedScore >= 60) return 'Good';
    if (normalizedScore >= 40) return 'Fair';
    return 'Needs Work';
  };

  const sizeClasses = {
    sm: 'h-24 w-24 text-2xl',
    md: 'h-36 w-36 text-4xl',
    lg: 'h-48 w-48 text-5xl',
  };

  // SVG circle calculations
  const radius = size === 'sm' ? 40 : size === 'md' ? 60 : 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={cn('relative', sizeClasses[size])}>
        {/* Background circle */}
        <svg className="absolute inset-0 transform -rotate-90" viewBox="0 0 200 200">
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            className="text-muted/30"
          />
          {/* Progress circle */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="url(#gradient)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" className={cn('stop-color-current', getColor())} stopColor="currentColor" />
              <stop offset="100%" className={cn('stop-color-current', getColor())} stopColor="currentColor" />
            </linearGradient>
          </defs>
        </svg>
        
        {/* Score text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('font-bold', getColor())}>{Math.round(normalizedScore)}</span>
          {size !== 'sm' && <span className="text-xs text-muted-foreground">/ 100</span>}
        </div>
      </div>
      
      {showLabel && (
        <span className={cn('text-sm font-medium', getColor())}>{getLabel()}</span>
      )}
    </div>
  );
}
