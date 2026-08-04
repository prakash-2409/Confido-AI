'use client';

import { PageHeader } from '@/components/PageHeader';
import { EvidenceBadge } from '@/components/EvidenceBadge';
import { ConfidenceScore } from '@/components/ConfidenceScore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
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

// TODO: Fetch candidate by ID from API (Epic 2/3)
const MOCK_CANDIDATE = {
  id: '1',
  name: 'Arjun Mehta',
  role: 'Senior Backend Engineer',
  email: 'arjun.mehta@example.com',
  phone: '+91 98765 43210',
  location: 'Bangalore, India',
  experience: '5 years',
  status: 'Interview',
  evidenceScore: 87,
  hiringReadiness: 82,
  authenticityScore: 91,
  summary: 'Strong backend engineer with verified experience in distributed systems. GitHub contributions confirm Python/Django expertise. Communication quality rated high from interview analysis. Minor gap in cloud-native infrastructure experience.',
  skills: [
    { name: 'Python', confidence: 94, sources: ['Resume', 'GitHub', 'Interview', 'Assessment'], level: 'verified' as const, reasoning: 'Confirmed through 47 GitHub repos, 3 production projects on resume, and correct interview responses on async patterns.' },
    { name: 'Django', confidence: 88, sources: ['Resume', 'GitHub', 'Interview'], level: 'verified' as const, reasoning: 'Active Django contributor on GitHub. Resume shows 3 years of Django in production. Interview answers demonstrate deep ORM knowledge.' },
    { name: 'PostgreSQL', confidence: 82, sources: ['Resume', 'Interview'], level: 'collected' as const, reasoning: 'Resume claims PostgreSQL experience. Interview confirmed indexing and query optimization knowledge. No GitHub evidence found.' },
    { name: 'Docker', confidence: 71, sources: ['Resume', 'GitHub'], level: 'collected' as const, reasoning: 'Dockerfiles found in 5 GitHub repos. Resume mentions containerization. No interview validation yet.' },
    { name: 'Kubernetes', confidence: 38, sources: ['Resume'], level: 'review' as const, reasoning: 'Only mentioned on resume. No GitHub evidence, no interview validation. Confidence low — needs verification.' },
    { name: 'AWS', confidence: 45, sources: ['Resume'], level: 'review' as const, reasoning: 'Listed on resume without specific services. No project evidence. Consider probing in next interview round.' },
  ],
  hiringDimensions: [
    { dimension: 'Technical Skills', score: 85, reasoning: 'Strong Python/Django foundation verified across multiple sources.' },
    { dimension: 'Communication', score: 78, reasoning: 'Clear and structured responses in interview. Minor verbosity in explanations.' },
    { dimension: 'Problem Solving', score: 82, reasoning: 'Systematic approach observed in system design questions.' },
    { dimension: 'Project Quality', score: 88, reasoning: 'GitHub repos show clean architecture, tests, and documentation.' },
    { dimension: 'Learning Velocity', score: 72, reasoning: 'Skill acquisition timeline shows moderate but consistent growth.' },
    { dimension: 'Authenticity', score: 91, reasoning: 'Evidence is consistent across all sources. No red flags detected.' },
  ],
  riskIndicators: [
    { risk: 'Kubernetes claim unverified', severity: 'medium', detail: 'Resume lists Kubernetes but no supporting evidence from other sources.' },
    { risk: 'AWS depth unclear', severity: 'low', detail: 'Generic AWS mention without specific services or certifications.' },
  ],
  timeline: [
    { date: '2d ago', action: 'Interview completed', detail: 'Technical round — scored 82%' },
    { date: '4d ago', action: 'GitHub verified', detail: '47 repos analyzed, 12 relevant to role' },
    { date: '5d ago', action: 'Resume uploaded', detail: 'PDF parsed, 6 skills extracted' },
    { date: '5d ago', action: 'Candidate added', detail: 'Added by recruiter' },
  ],
};

export default function CandidateProfilePage() {
  const candidate = MOCK_CANDIDATE;

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
                <EvidenceBadge level="verified" />
              </div>
              <p className="text-sm text-muted-foreground">{candidate.role} · {candidate.experience}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-2xs text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" /> {candidate.email}</span>
                <span className="text-2xs text-muted-foreground flex items-center gap-1"><Briefcase className="h-3 w-3" /> {candidate.location}</span>
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
