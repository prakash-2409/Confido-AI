'use client';

import { PageHeader } from '@/components/PageHeader';
import { EvidenceBadge } from '@/components/EvidenceBadge';
import { ConfidenceScore } from '@/components/ConfidenceScore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { recruiterApi } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { EmptyState } from '@/components/EmptyState';
import {
  ArrowLeft,
  User,
  Mail,
  Briefcase,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Github,
  Linkedin,
  Code,
  MessageSquare,
  BookOpen,
  Clock,
  CheckCircle2,
  XCircle,
  Star,
  Download,
  MoreHorizontal,
} from 'lucide-react';
import Link from 'next/link';

export default function CandidateProfilePage() {
  const params = useParams();
  const id = params.id as string;

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['candidate-detail', id],
    queryFn: () => recruiterApi.getCandidateById(id),
    enabled: !!id
  });

  if (isLoading) {
    return <LoadingState message="Loading candidate intelligence profile..." />;
  }

  if (isError) {
    return (
      <ErrorState 
        message={error instanceof Error ? error.message : "Failed to load candidate profile."} 
        onRetry={refetch}
      />
    );
  }

  const candidate = data?.data?.data?.candidate;

  if (!candidate) {
    return (
      <div className="space-y-6">
        <Link href="/dashboard/candidates" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="h-3 w-3" />
          Back to candidates
        </Link>
        <EmptyState
          icon={User}
          title="Candidate not found"
          description="The requested candidate profile does not exist or has been deleted."
        />
      </div>
    );
  }

  const evLevel = candidate.skills.some(s => s.level === 'verified') ? 'verified' :
                  candidate.skills.some(s => s.level === 'collected') ? 'collected' :
                  candidate.skills.some(s => s.level === 'review') ? 'review' : 'risk';

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div>
        <Link href="/dashboard/candidates" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="h-3 w-3" />
          Back to candidates
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center text-lg font-bold text-primary">
              {candidate.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold tracking-tight">{candidate.name}</h1>
                <EvidenceBadge level={evLevel} />
              </div>
              <p className="text-sm text-muted-foreground">{candidate.role} · {candidate.experience}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-2xs text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" /> {candidate.email}</span>
                {candidate.location && <span className="text-2xs text-muted-foreground flex items-center gap-1"><Briefcase className="h-3 w-3" /> {candidate.location}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" className="text-xs h-8 gap-1.5">
              <Download className="h-3.5 w-3.5" />
              Export Report
            </Button>
            <Button size="sm" className="text-xs h-8">
              Shortlist Candidate
            </Button>
          </div>
        </div>
      </div>

      {/* Summary */}
      <Card className="border-border bg-muted/20">
        <CardContent className="p-4">
          <p className="text-sm text-foreground leading-relaxed">{candidate.summary}</p>
        </CardContent>
      </Card>

      {/* Main grid: Intelligence + Sidebar */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Intelligence panels — 2 cols */}
        <div className="lg:col-span-2 space-y-6">
          {/* Skill Evidence */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Skill Evidence Matrix
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              {candidate.skills.map((skill) => (
                <div key={skill.name} className="p-3 rounded-lg border border-border bg-card">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold">{skill.name}</span>
                      <EvidenceBadge level={skill.level} size="sm" />
                    </div>
                    <div className="flex items-center gap-1">
                      {skill.sources.map(s => (
                        <span key={s} className="px-1.5 py-0.5 rounded bg-muted text-2xs font-medium text-muted-foreground">{s}</span>
                      ))}
                    </div>
                  </div>
                  <ConfidenceScore
                    score={skill.confidence}
                    reasoning={skill.reasoning}
                    size="sm"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Hiring Readiness Dimensions */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Star className="h-4 w-4 text-evidence-review" />
                Hiring Readiness Index
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {candidate.hiringDimensions.map((dim) => (
                <div key={dim.dimension}>
                  <ConfidenceScore
                    score={dim.score}
                    label={dim.dimension}
                    reasoning={dim.reasoning}
                    size="sm"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Quick scores */}
          <Card className="border-border">
            <CardContent className="p-4 space-y-4">
              <ConfidenceScore score={candidate.evidenceScore} label="Overall Evidence Score" reasoning="Weighted average across all verified skill evidence." size="md" />
              <Separator />
              <ConfidenceScore score={candidate.hiringReadiness} label="Hiring Readiness" reasoning="Composite of 6 assessment dimensions." size="md" />
              <Separator />
              <ConfidenceScore score={candidate.authenticityScore} label="Authenticity Score" reasoning="Cross-source consistency analysis. No anomalies detected." size="md" />
            </CardContent>
          </Card>

          {/* Risk indicators */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-evidence-risk" />
                Risk Indicators
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              {candidate.riskIndicators.length > 0 ? candidate.riskIndicators.map((risk, i) => (
                <div key={i} className="p-2.5 rounded-md bg-evidence-risk/5 border border-evidence-risk/10">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-evidence-risk">{risk.risk}</span>
                    <Badge variant="outline" className="text-2xs border-evidence-risk/20 text-evidence-risk">{risk.severity}</Badge>
                  </div>
                  <p className="text-2xs text-muted-foreground">{risk.detail}</p>
                </div>
              )) : (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-evidence-verified" /> No risk indicators found
                </p>
              )}
            </CardContent>
          </Card>

          {/* Activity timeline */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Activity Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="relative border-l border-border pl-4 space-y-4">
                {candidate.timeline.map((event, i) => (
                  <div key={i} className="relative">
                    <div className="absolute -left-[21px] top-0.5 h-2.5 w-2.5 rounded-full bg-border border-2 border-background" />
                    <span className="text-2xs text-muted-foreground font-medium block">{event.date}</span>
                    <span className="text-xs font-semibold block">{event.action}</span>
                    <span className="text-2xs text-muted-foreground">{event.detail}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
