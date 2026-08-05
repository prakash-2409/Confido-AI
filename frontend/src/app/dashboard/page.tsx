'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/PageHeader';
import { EvidenceBadge } from '@/components/EvidenceBadge';
import { ConfidenceScore } from '@/components/ConfidenceScore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { recruiterApi } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { EmptyState } from '@/components/EmptyState';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  AlertTriangle,
  Activity,
  ArrowRight,
  UserPlus,
  Bot,
  TrendingUp,
  Clock,
  Eye,
  FileText,
  MessageSquare,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
} from 'lucide-react';

const PIPELINE_META = [
  { label: 'New', color: 'bg-evidence-collected/10 text-evidence-collected border-evidence-collected/20' },
  { label: 'Screening', color: 'bg-evidence-review/10 text-evidence-review border-evidence-review/20' },
  { label: 'Interview', color: 'bg-primary/10 text-primary border-primary/20' },
  { label: 'Offer', color: 'bg-evidence-verified/10 text-evidence-verified border-evidence-verified/20' },
  { label: 'Hired', color: 'bg-evidence-verified/15 text-evidence-verified border-evidence-verified/25' },
];

export default function DashboardPage() {
  const { user } = useAuth();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['recruiter-candidates'],
    queryFn: () => recruiterApi.getCandidates()
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (isLoading) {
    return <LoadingState message="Loading command center..." />;
  }

  if (isError) {
    return (
      <ErrorState 
        message={error instanceof Error ? error.message : "Failed to load dashboard pipeline data."} 
        onRetry={refetch}
      />
    );
  }

  const candidates = data?.data?.data?.candidates || [];

  if (candidates.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={`${getGreeting()}, ${user?.name?.split(' ')[0] || 'there'}`}
          description="Your hiring intelligence command center"
          icon={LayoutDashboard}
        />
        <EmptyState
          icon={Users}
          title="No candidates in pipeline"
          description="Add your first candidate to start tracking verification intelligence."
          action={{
            label: "Add Candidate",
            href: "/dashboard/candidates"
          }}
        />
      </div>
    );
  }

  // Calculate stage counts dynamically
  const pipelineStages = PIPELINE_META.map(meta => {
    const count = candidates.filter(c => c.status.toLowerCase() === meta.label.toLowerCase()).length;
    return {
      label: meta.label,
      count,
      color: meta.color
    };
  });

  // Calculate recent activity dynamically from candidate timelines
  const recentActivities = candidates
    .flatMap(c => 
      c.timeline.map((t, idx) => ({
        id: `${c._id}-${idx}`,
        candidate: c.name,
        action: t.action,
        detail: t.detail,
        time: t.date,
        timestamp: t.timestamp ? new Date(t.timestamp).getTime() : 0,
        icon: t.action.toLowerCase().includes('risk') || t.action.toLowerCase().includes('flag') ? AlertTriangle :
              t.action.toLowerCase().includes('interview') ? MessageSquare :
              t.action.toLowerCase().includes('github') || t.action.toLowerCase().includes('verify') ? ShieldCheck :
              t.action.toLowerCase().includes('add') ? UserPlus : CheckCircle2
      }))
    )
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 5);

  // Filter risk indicators dynamically
  const riskCandidates = candidates
    .filter(c => c.riskIndicators && c.riskIndicators.length > 0)
    .map(c => ({
      id: c._id || c.id,
      name: c.name,
      role: c.role,
      risk: c.riskIndicators[0].risk,
      confidence: c.evidenceScore
    }))
    .slice(0, 3);

  // Compute top skills dynamically
  const skillMap: Record<string, { count: number; totalConf: number }> = {};
  candidates.forEach(c => {
    c.skills.forEach(s => {
      if (!skillMap[s.name]) {
        skillMap[s.name] = { count: 0, totalConf: 0 };
      }
      skillMap[s.name].count++;
      skillMap[s.name].totalConf += s.confidence;
    });
  });

  const topSkills = Object.entries(skillMap)
    .map(([skill, stats]) => ({
      skill,
      candidates: stats.count,
      avgConfidence: Math.round(stats.totalConf / stats.count)
    }))
    .sort((a, b) => b.candidates - a.candidates)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <PageHeader
        title={`${getGreeting()}, ${user?.name?.split(' ')[0] || 'there'}`}
        description="Your hiring intelligence command center"
        icon={LayoutDashboard}
      >
        <Link href="/dashboard/candidates">
          <Button variant="outline" size="sm" className="text-xs h-8 gap-1.5">
            <UserPlus className="h-3.5 w-3.5" />
            Add Candidate
          </Button>
        </Link>
        <Link href="/dashboard/copilot">
          <Button size="sm" className="text-xs h-8 gap-1.5">
            <Bot className="h-3.5 w-3.5" />
            Ask AI Copilot
          </Button>
        </Link>
      </PageHeader>

      {/* Pipeline overview */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {pipelineStages.map((stage) => (
          <Card key={stage.label} className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">{stage.label}</span>
                <ArrowUpRight className="h-3 w-3 text-muted-foreground/40" />
              </div>
              <span className="text-2xl font-bold font-mono tabular-nums tracking-tight">{stage.count}</span>
              <div className={cn("mt-2 h-1 rounded-full w-full", stage.color.split(' ')[0])} />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main grid: Activity + Evidence + Risk */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activity — 2 cols */}
        <Card className="lg:col-span-2 border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                Recent Activity
              </CardTitle>
              <Link href="/dashboard/workspace">
                <Button variant="ghost" size="sm" className="text-xs h-7 text-muted-foreground">
                  View all
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {recentActivities.length > 0 ? (
              <div className="space-y-0">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 py-3 border-b border-border/50 last:border-0">
                    <div className="h-7 w-7 rounded-md bg-muted/50 flex items-center justify-center shrink-0 mt-0.5">
                      <activity.icon className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold">{activity.candidate}</span>
                        <span className="text-2xs text-muted-foreground">·</span>
                        <span className="text-2xs text-muted-foreground">{activity.time}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{activity.action} — {activity.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No recent timeline activity.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right column */}
        <div className="space-y-6">
          {/* Risk Summary */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-evidence-risk" />
                Risk Indicators
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {riskCandidates.length > 0 ? (
                riskCandidates.map((candidate) => (
                  <div key={candidate.id} className="p-3 rounded-lg bg-evidence-risk/5 border border-evidence-risk/10">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold">{candidate.name}</span>
                      <EvidenceBadge level="risk" size="sm" />
                    </div>
                    <p className="text-2xs text-muted-foreground mb-2">{candidate.role} · {candidate.risk}</p>
                    <ConfidenceScore score={candidate.confidence} size="sm" reasoning="Evidence gaps detected across multiple sources" />
                  </div>
                ))
              ) : (
                <div className="py-4 text-center text-xs text-muted-foreground">
                  No candidate risk indicators flagged.
                </div>
              )}
              <Link href="/dashboard/candidates" className="block">
                <Button variant="ghost" size="sm" className="w-full text-xs h-7 text-muted-foreground">
                  View all candidates
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Top Skills in Pipeline */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                Top Skills in Pipeline
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {topSkills.length > 0 ? (
                <div className="space-y-2.5">
                  {topSkills.map((skill) => (
                    <div key={skill.skill} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold w-20 truncate">{skill.skill}</span>
                        <span className="text-2xs text-muted-foreground">{skill.candidates} candidates</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary/60"
                            style={{ width: `${skill.avgConfidence}%` }}
                          />
                        </div>
                        <span className="text-2xs font-mono text-muted-foreground w-8 text-right">{skill.avgConfidence}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-4 text-center text-xs text-muted-foreground">
                  No skill metrics cataloged yet.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
