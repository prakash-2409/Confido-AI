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

// TODO: Replace with real API data from backend (Epic 2/3)
const PIPELINE_STAGES = [
  { label: 'New', count: 12, color: 'bg-evidence-collected/10 text-evidence-collected' },
  { label: 'Screening', count: 8, color: 'bg-evidence-review/10 text-evidence-review' },
  { label: 'Interview', count: 5, color: 'bg-primary/10 text-primary' },
  { label: 'Offer', count: 2, color: 'bg-evidence-verified/10 text-evidence-verified' },
  { label: 'Hired', count: 1, color: 'bg-evidence-verified/15 text-evidence-verified' },
];

const RECENT_ACTIVITY = [
  { id: '1', action: 'Evidence collected', candidate: 'Arjun Mehta', detail: 'GitHub profile verified', time: '2m ago', icon: ShieldCheck },
  { id: '2', action: 'Interview completed', candidate: 'Priya Sharma', detail: 'Score: 82% — Strong communicator', time: '15m ago', icon: MessageSquare },
  { id: '3', action: 'Risk flagged', candidate: 'Rahul Verma', detail: 'Timeline inconsistency detected', time: '1h ago', icon: AlertTriangle },
  { id: '4', action: 'Candidate added', candidate: 'Ananya Rao', detail: 'Resume uploaded, evidence pending', time: '2h ago', icon: UserPlus },
  { id: '5', action: 'Decision recorded', candidate: 'Vikram Singh', detail: 'Shortlisted for final round', time: '3h ago', icon: CheckCircle2 },
];

const RISK_CANDIDATES = [
  { name: 'Rahul Verma', role: 'Backend Engineer', risk: 'Timeline inconsistency', confidence: 35 },
  { name: 'Kiran Patel', role: 'Data Analyst', risk: 'Weak evidence for SQL claims', confidence: 42 },
];

const TOP_SKILLS = [
  { skill: 'Python', candidates: 8, avgConfidence: 78 },
  { skill: 'React', candidates: 6, avgConfidence: 72 },
  { skill: 'Node.js', candidates: 5, avgConfidence: 68 },
  { skill: 'PostgreSQL', candidates: 4, avgConfidence: 81 },
  { skill: 'Docker', candidates: 3, avgConfidence: 65 },
];

export default function DashboardPage() {
  const { user } = useAuth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

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
        {PIPELINE_STAGES.map((stage) => (
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
              <Button variant="ghost" size="sm" className="text-xs h-7 text-muted-foreground">
                View all
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-0">
              {RECENT_ACTIVITY.map((activity) => (
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
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0">
                    <Eye className="h-3 w-3 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>
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
              {RISK_CANDIDATES.map((candidate) => (
                <div key={candidate.name} className="p-3 rounded-lg bg-evidence-risk/5 border border-evidence-risk/10">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold">{candidate.name}</span>
                    <EvidenceBadge level="risk" size="sm" />
                  </div>
                  <p className="text-2xs text-muted-foreground mb-2">{candidate.role} · {candidate.risk}</p>
                  <ConfidenceScore score={candidate.confidence} size="sm" reasoning="Evidence gaps detected across multiple sources" />
                </div>
              ))}
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
              <div className="space-y-2.5">
                {TOP_SKILLS.map((skill) => (
                  <div key={skill.skill} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold w-20">{skill.skill}</span>
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
