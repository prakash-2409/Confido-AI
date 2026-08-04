'use client';

import { PageHeader } from '@/components/PageHeader';
import { EvidenceBadge } from '@/components/EvidenceBadge';
import { ConfidenceScore } from '@/components/ConfidenceScore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
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

// TODO: Replace with real API data (Epic 2/3)
const EVIDENCE_SOURCES = [
  { source: 'Resume', icon: FileText, collected: 12, verified: 8, pending: 4 },
  { source: 'GitHub', icon: Github, collected: 6, verified: 5, pending: 1 },
  { source: 'Interview', icon: MessageSquare, collected: 5, verified: 4, pending: 1 },
  { source: 'Assessment', icon: Code, collected: 3, verified: 2, pending: 1 },
  { source: 'LinkedIn', icon: Linkedin, collected: 2, verified: 1, pending: 1 },
  { source: 'Certificates', icon: Award, collected: 4, verified: 3, pending: 1 },
];

const EVIDENCE_COVERAGE = [
  { candidate: 'Arjun Mehta', resume: true, github: true, interview: true, assessment: false, linkedin: false, overall: 87 },
  { candidate: 'Priya Sharma', resume: true, github: true, interview: false, assessment: false, linkedin: true, overall: 68 },
  { candidate: 'Rahul Verma', resume: true, github: false, interview: false, assessment: false, linkedin: false, overall: 35 },
  { candidate: 'Vikram Singh', resume: true, github: true, interview: true, assessment: true, linkedin: true, overall: 94 },
  { candidate: 'Ananya Rao', resume: true, github: false, interview: false, assessment: true, linkedin: false, overall: 52 },
];

export default function EvidenceEnginePage() {
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
        <Button size="sm" className="text-xs h-8 gap-1.5">
          <Upload className="h-3.5 w-3.5" />
          Import Evidence
        </Button>
      </PageHeader>

      {/* Source summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {EVIDENCE_SOURCES.map((source) => (
          <Card key={source.source} className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <source.icon className="h-4 w-4 text-muted-foreground" />
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
        ))}
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
                {EVIDENCE_COVERAGE.map((row) => (
                  <tr key={row.candidate} className="border-b border-border/50">
                    <td className="px-3 py-2.5 text-xs font-semibold">{row.candidate}</td>
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
