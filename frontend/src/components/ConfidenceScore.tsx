'use client';

import { cn } from '@/lib/utils';
import { Info } from 'lucide-react';

interface ConfidenceScoreProps {
  score: number;        // 0–100
  label?: string;
  reasoning?: string;   // Explainable AI — always show WHY
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-evidence-verified';
  if (score >= 60) return 'text-evidence-collected';
  if (score >= 40) return 'text-evidence-review';
  if (score >= 20) return 'text-evidence-risk';
  return 'text-evidence-none';
}

function getScoreBarColor(score: number): string {
  if (score >= 80) return 'bg-evidence-verified';
  if (score >= 60) return 'bg-evidence-collected';
  if (score >= 40) return 'bg-evidence-review';
  if (score >= 20) return 'bg-evidence-risk';
  return 'bg-evidence-none';
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Strong';
  if (score >= 60) return 'Moderate';
  if (score >= 40) return 'Developing';
  if (score >= 20) return 'Weak';
  return 'Insufficient';
}

export function ConfidenceScore({ score, label, reasoning, size = 'md', className }: ConfidenceScoreProps) {
  const sizeClasses = {
    sm: { score: 'text-sm', label: 'text-2xs', bar: 'h-1', gap: 'gap-1' },
    md: { score: 'text-lg', label: 'text-xs', bar: 'h-1.5', gap: 'gap-1.5' },
    lg: { score: 'text-2xl', label: 'text-sm', bar: 'h-2', gap: 'gap-2' },
  };

  const s = sizeClasses[size];

  return (
    <div className={cn("space-y-1", className)}>
      {label && (
        <span className={cn("text-muted-foreground font-medium block", s.label)}>{label}</span>
      )}
      <div className={cn("flex items-center", s.gap)}>
        <span className={cn("font-bold font-mono tabular-nums tracking-tight", s.score, getScoreColor(score))}>
          {score}%
        </span>
        <span className={cn("text-muted-foreground font-medium", s.label)}>
          {getScoreLabel(score)}
        </span>
      </div>
      <div className={cn("w-full bg-muted rounded-full overflow-hidden", s.bar)}>
        <div
          className={cn("rounded-full transition-all duration-500", s.bar, getScoreBarColor(score))}
          style={{ width: `${Math.min(score, 100)}%` }}
        />
      </div>
      {reasoning && (
        <div className="flex items-start gap-1.5 mt-1.5">
          <Info className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-2xs text-muted-foreground leading-relaxed">{reasoning}</p>
        </div>
      )}
    </div>
  );
}
