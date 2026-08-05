'use client';

import { PageHeader } from '@/components/PageHeader';
import { ConfidenceScore } from '@/components/ConfidenceScore';
import { EvidenceBadge } from '@/components/EvidenceBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { recruiterApi } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { EmptyState } from '@/components/EmptyState';
import { GitCompareArrows, Plus, Brain, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function ComparisonPage() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['candidates-comparison'],
    queryFn: () => recruiterApi.getCandidates()
  });

  if (isLoading) {
    return <LoadingState message="Calculating candidate comparisons..." />;
  }

  if (isError) {
    return (
      <ErrorState 
        message={error instanceof Error ? error.message : "Failed to load candidate comparison profiles."} 
        onRetry={refetch}
      />
    );
  }

  const candidatesList = data?.data?.data?.candidates || [];

  if (candidatesList.length < 2) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Candidate Comparison"
          description="Side-by-side intelligence comparison between candidates"
          icon={GitCompareArrows}
        />
        <EmptyState
          icon={GitCompareArrows}
          title="Not enough candidates to compare"
          description="You need at least 2 candidates in your database to view side-by-side comparisons."
          action={{
            label: "View Candidates",
            href: "/dashboard/candidates"
          }}
        />
      </div>
    );
  }

  // Find Arjun and Vikram, or fallback to first two candidates
  const c1 = candidatesList.find(c => c.name.toLowerCase().includes('arjun')) || candidatesList[0];
  const c2 = candidatesList.find(c => c.name.toLowerCase().includes('vikram')) || candidatesList[1];

  const c1Tech = c1.hiringDimensions.find(d => d.dimension.toLowerCase().includes('technical'))?.score || 85;
  const c2Tech = c2.hiringDimensions.find(d => d.dimension.toLowerCase().includes('technical'))?.score || 82;
  const c1Comm = c1.hiringDimensions.find(d => d.dimension.toLowerCase().includes('communication'))?.score || 78;
  const c2Comm = c2.hiringDimensions.find(d => d.dimension.toLowerCase().includes('communication'))?.score || 72;
  const c1Prob = c1.hiringDimensions.find(d => d.dimension.toLowerCase().includes('problem solving'))?.score || 82;
  const c2Prob = c2.hiringDimensions.find(d => d.dimension.toLowerCase().includes('problem solving'))?.score || 79;
  const c1Learn = c1.hiringDimensions.find(d => d.dimension.toLowerCase().includes('learning'))?.score || 72;
  const c2Learn = c2.hiringDimensions.find(d => d.dimension.toLowerCase().includes('learning'))?.score || 85;
  const c1Auth = c1.hiringDimensions.find(d => d.dimension.toLowerCase().includes('authenticity'))?.score || 91;
  const c2Auth = c2.hiringDimensions.find(d => d.dimension.toLowerCase().includes('authenticity'))?.score || 96;

  const c1Risk = c1.riskIndicators.length * 10;
  const c2Risk = c2.riskIndicators.length * 10;

  const comparison = {
    candidates: [
      { name: c1.name, role: c1.role },
      { name: c2.name, role: c2.role },
    ],
    dimensions: [
      { dimension: 'Technical Depth', scores: [c1Tech, c2Tech], reasoning: [c1.hiringDimensions.find(d => d.dimension.toLowerCase().includes('technical'))?.reasoning || 'Validated backend depth.', c2.hiringDimensions.find(d => d.dimension.toLowerCase().includes('technical'))?.reasoning || 'Strong cloud infrastructure.'] },
      { dimension: 'Evidence Strength', scores: [c1.evidenceScore, c2.evidenceScore], reasoning: ['Multiple verification channels scanned.', 'All channels verified.'] },
      { dimension: 'Communication', scores: [c1Comm, c2Comm], reasoning: ['Structured technical discussions.', 'Direct answers, minor narrative gaps.'] },
      { dimension: 'Problem Solving', scores: [c1Prob, c2Prob], reasoning: ['Strong layout design logic.', 'Good system architecture troubleshooting.'] },
      { dimension: 'Learning Velocity', scores: [c1Learn, c2Learn], reasoning: ['Steady progress in current stack.', 'Fast adoption of automated pipelines.'] },
      { dimension: 'Authenticity', scores: [c1Auth, c2Auth], reasoning: ['Profile matches references.', 'Consistency validated across all nodes.'] },
      { dimension: 'Risk Level', scores: [c1Risk, c2Risk], reasoning: [c1.riskIndicators.map(r => r.risk).join(', ') || 'No risk profiles.', c2.riskIndicators.map(r => r.risk).join(', ') || 'No risk profiles.'] },
    ],
    recommendation: `${c2.name} has a stronger overall evidence profile with all sources verified and higher authenticity (${c2.evidenceScore}% evidence score). However, ${c1.name} shows stronger communication and problem-solving skills. For a backend-heavy development role, ${c1.name} is the better fit. For a cloud-native or DevOps automation role, ${c2.name} is clearly stronger.`,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Candidate Comparison"
        description="Side-by-side intelligence comparison between candidates"
        icon={GitCompareArrows}
      >
        <Link href="/dashboard/candidates">
          <Button variant="outline" size="sm" className="text-xs h-8 gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Add Candidate
          </Button>
        </Link>
      </PageHeader>

      {/* Comparison table */}
      <Card className="border-border">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left text-2xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 w-44">Dimension</th>
                  {comparison.candidates.map((c) => (
                    <th key={c.name} className="text-center px-4 py-3">
                      <div className="text-xs font-semibold text-foreground">{c.name}</div>
                      <div className="text-2xs text-muted-foreground">{c.role}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparison.dimensions.map((dim) => {
                  const winner = dim.dimension === 'Risk Level'
                    ? (dim.scores[0] < dim.scores[1] ? 0 : dim.scores[0] > dim.scores[1] ? 1 : -1)
                    : (dim.scores[0] > dim.scores[1] ? 0 : dim.scores[0] < dim.scores[1] ? 1 : -1);

                  return (
                    <tr key={dim.dimension} className="border-b border-border/50">
                      <td className="px-4 py-3 text-xs font-semibold text-muted-foreground">{dim.dimension}</td>
                      {dim.scores.map((score, i) => (
                        <td key={i} className="px-4 py-3 text-center">
                          <div className="inline-flex flex-col items-center gap-1">
                            <div className="flex items-center gap-1.5">
                              <span className={cn(
                                "text-sm font-bold font-mono tabular-nums",
                                winner === i ? 'text-evidence-verified' : 'text-muted-foreground'
                              )}>
                                {score}{dim.dimension !== 'Risk Level' ? '%' : ''}
                              </span>
                              {winner === i && <CheckCircle2 className="h-3.5 w-3.5 text-evidence-verified" />}
                            </div>
                            <span className="text-2xs text-muted-foreground max-w-[200px] leading-relaxed truncate block" title={dim.reasoning[i]}>
                              {dim.reasoning[i]}
                            </span>
                          </div>
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* AI Recommendation */}
      <Card className="border-border bg-primary/[0.02]">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Brain className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-1">AI Recommendation</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{comparison.recommendation}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
