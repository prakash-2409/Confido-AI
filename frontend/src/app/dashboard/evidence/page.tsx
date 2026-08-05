'use client';

import { PageHeader } from '@/components/PageHeader';
import { EvidenceBadge } from '@/components/EvidenceBadge';
import { ConfidenceScore } from '@/components/ConfidenceScore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { recruiterApi } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { EmptyState } from '@/components/EmptyState';
import Link from 'next/link';
import {
  ShieldCheck,
  Upload,
  FileText,
  Github,
  Linkedin,
  Code,
  MessageSquare,
  Award,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

const ICON_MAP: Record<string, any> = {
  'Resume': FileText,
  'GitHub': Github,
  'Interview': MessageSquare,
  'Assessment': Code,
  'LinkedIn': Linkedin,
  'Certificates': Award
};

export default function EvidenceEnginePage() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['evidence-summary'],
    queryFn: () => recruiterApi.getEvidenceSummary()
  });

  if (isLoading) {
    return <LoadingState message="Loading evidence matrix..." />;
  }

  if (isError) {
    return (
      <ErrorState 
        message={error instanceof Error ? error.message : "Failed to load evidence engine matrix."} 
        onRetry={refetch}
      />
    );
  }

  const sources = data?.data?.data?.sources || [];
  const coverage = data?.data?.data?.coverage || [];

  if (sources.length === 0 && coverage.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Evidence Engine"
          description="Multi-source evidence collection and verification dashboard"
          icon={ShieldCheck}
        />
        <EmptyState
          icon={ShieldCheck}
          title="No evidence indexed"
          description="Upload resumes or assessments to start collecting evidence."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Evidence Engine"
        description="Multi-source evidence collection and verification dashboard"
        icon={ShieldCheck}
      >
        <Button variant="outline" size="sm" className="text-xs h-8 gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" />
          Re-scan All
        </Button>
      </PageHeader>

      {/* Source summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {sources.map((source) => {
          const Icon = ICON_MAP[source.source] || ShieldCheck;
          return (
            <Card key={source.source} className="border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-semibold">{source.source}</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-2xs text-muted-foreground">Collected</span>
                    <span className="text-xs font-mono font-semibold">{source.collected}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xs text-evidence-verified">Verified</span>
                    <span className="text-xs font-mono font-semibold text-evidence-verified">{source.verified}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xs text-evidence-review">Pending</span>
                    <span className="text-xs font-mono font-semibold text-evidence-review">{source.pending}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Evidence coverage matrix */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Evidence Coverage Matrix</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-2xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">Candidate</th>
                  <th className="text-center text-2xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">Resume</th>
                  <th className="text-center text-2xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">GitHub</th>
                  <th className="text-center text-2xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">Interview</th>
                  <th className="text-center text-2xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">Assessment</th>
                  <th className="text-center text-2xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">LinkedIn</th>
                  <th className="text-center text-2xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">Overall</th>
                </tr>
              </thead>
              <tbody>
                {coverage.map((row) => (
                  <tr key={row.candidateId} className="border-b border-border/50">
                    <td className="px-3 py-2.5 text-xs font-semibold">
                      <Link href={`/dashboard/candidates/${row.candidateId}`} className="hover:text-primary transition-colors">
                        {row.candidate}
                      </Link>
                    </td>
                    {[row.resume, row.github, row.interview, row.assessment, row.linkedin].map((has, i) => (
                      <td key={i} className="text-center px-3 py-2.5">
                        {has ? (
                          <CheckCircle2 className="h-4 w-4 text-evidence-verified mx-auto" />
                        ) : (
                          <XCircle className="h-4 w-4 text-muted-foreground/30 mx-auto" />
                        )}
                      </td>
                    ))}
                    <td className="text-center px-3 py-2.5">
                      <span className={cn(
                        "text-xs font-mono font-bold",
                        row.overall >= 70 ? 'text-evidence-verified' : row.overall >= 50 ? 'text-evidence-review' : 'text-evidence-risk'
                      )}>{row.overall}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
