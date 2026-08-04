'use client';

import { cn } from '@/lib/utils';
import { CheckCircle2, CircleDot, AlertTriangle, AlertCircle, CircleDashed } from 'lucide-react';

export type EvidenceLevel = 'verified' | 'collected' | 'review' | 'risk' | 'none';

interface EvidenceBadgeProps {
  level: EvidenceLevel;
  label?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

const config: Record<EvidenceLevel, {
  label: string;
  icon: typeof CheckCircle2;
  classes: string;
}> = {
  verified: {
    label: 'Verified',
    icon: CheckCircle2,
    classes: 'bg-evidence-verified/10 text-evidence-verified border-evidence-verified/20',
  },
  collected: {
    label: 'Evidence',
    icon: CircleDot,
    classes: 'bg-evidence-collected/10 text-evidence-collected border-evidence-collected/20',
  },
  review: {
    label: 'Needs Review',
    icon: AlertTriangle,
    classes: 'bg-evidence-review/10 text-evidence-review border-evidence-review/20',
  },
  risk: {
    label: 'Risk',
    icon: AlertCircle,
    classes: 'bg-evidence-risk/10 text-evidence-risk border-evidence-risk/20',
  },
  none: {
    label: 'No Evidence',
    icon: CircleDashed,
    classes: 'bg-evidence-none/10 text-evidence-none border-evidence-none/20',
  },
};

export function EvidenceBadge({ level, label, showIcon = true, size = 'sm', className }: EvidenceBadgeProps) {
  const { label: defaultLabel, icon: Icon, classes } = config[level];
  const displayLabel = label || defaultLabel;

  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-md border font-medium",
      size === 'sm' ? 'px-1.5 py-0.5 text-2xs' : 'px-2 py-1 text-xs',
      classes,
      className
    )}>
      {showIcon && <Icon className={cn(size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5')} />}
      {displayLabel}
    </span>
  );
}
