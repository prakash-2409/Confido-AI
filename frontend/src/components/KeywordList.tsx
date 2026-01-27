'use client';

/**
 * Keyword Display Components
 * 
 * Shows matched and missing keywords from ATS analysis
 */

import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle } from 'lucide-react';

interface KeywordListProps {
  keywords: string[];
  type: 'matched' | 'missing';
  maxDisplay?: number;
}

export function KeywordList({ keywords, type, maxDisplay = 10 }: KeywordListProps) {
  const displayKeywords = keywords.slice(0, maxDisplay);
  const remaining = keywords.length - maxDisplay;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {type === 'matched' ? (
          <>
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <h4 className="font-medium text-green-700 dark:text-green-400">
              Matched Keywords ({keywords.length})
            </h4>
          </>
        ) : (
          <>
            <XCircle className="h-5 w-5 text-red-500" />
            <h4 className="font-medium text-red-700 dark:text-red-400">
              Missing Keywords ({keywords.length})
            </h4>
          </>
        )}
      </div>
      
      <div className="flex flex-wrap gap-2">
        {displayKeywords.map((keyword, index) => (
          <Badge
            key={index}
            variant={type === 'matched' ? 'default' : 'destructive'}
            className={
              type === 'matched'
                ? 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400'
            }
          >
            {keyword}
          </Badge>
        ))}
        {remaining > 0 && (
          <Badge variant="outline">+{remaining} more</Badge>
        )}
      </div>
      
      {keywords.length === 0 && (
        <p className="text-sm text-muted-foreground">
          {type === 'matched' ? 'No keywords matched yet' : 'No missing keywords - great job!'}
        </p>
      )}
    </div>
  );
}
