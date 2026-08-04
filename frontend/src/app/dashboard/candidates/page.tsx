'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/PageHeader';
import { EvidenceBadge, EvidenceLevel } from '@/components/EvidenceBadge';
import { ConfidenceScore } from '@/components/ConfidenceScore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  ArrowUpDown,
  Eye,
  MoreHorizontal,
  GitCompareArrows,
  Download,
  ChevronRight,
} from 'lucide-react';

// TODO: Replace with real API data from backend (Epic 2/3)
const MOCK_CANDIDATES = [
  {
    id: '1',
    name: 'Arjun Mehta',
    role: 'Senior Backend Engineer',
    email: 'arjun@example.com',
    evidenceScore: 87,
    hiringReadiness: 82,
    evidenceLevel: 'verified' as EvidenceLevel,
    riskLevel: 'low',
    status: 'Interview',
    skills: ['Python', 'Django', 'PostgreSQL', 'Docker'],
    sources: { resume: true, github: true, interview: true, assessment: false },
    updatedAt: '2h ago',
  },
  {
    id: '2',
    name: 'Priya Sharma',
    role: 'Full Stack Developer',
    email: 'priya@example.com',
    evidenceScore: 74,
    hiringReadiness: 71,
    evidenceLevel: 'collected' as EvidenceLevel,
    riskLevel: 'low',
    status: 'Screening',
    skills: ['React', 'Node.js', 'TypeScript', 'MongoDB'],
    sources: { resume: true, github: true, interview: false, assessment: false },
    updatedAt: '5h ago',
  },
  {
    id: '3',
    name: 'Rahul Verma',
    role: 'Backend Engineer',
    email: 'rahul@example.com',
    evidenceScore: 42,
    hiringReadiness: 35,
    evidenceLevel: 'risk' as EvidenceLevel,
    riskLevel: 'high',
    status: 'Screening',
    skills: ['Java', 'Spring Boot', 'MySQL'],
    sources: { resume: true, github: false, interview: false, assessment: false },
    updatedAt: '1d ago',
  },
  {
    id: '4',
    name: 'Ananya Rao',
    role: 'Data Scientist',
    email: 'ananya@example.com',
    evidenceScore: 68,
    hiringReadiness: 63,
    evidenceLevel: 'review' as EvidenceLevel,
    riskLevel: 'medium',
    status: 'New',
    skills: ['Python', 'TensorFlow', 'SQL', 'Pandas'],
    sources: { resume: true, github: false, interview: false, assessment: true },
    updatedAt: '3d ago',
  },
  {
    id: '5',
    name: 'Vikram Singh',
    role: 'DevOps Engineer',
    email: 'vikram@example.com',
    evidenceScore: 91,
    hiringReadiness: 88,
    evidenceLevel: 'verified' as EvidenceLevel,
    riskLevel: 'low',
    status: 'Offer',
    skills: ['AWS', 'Kubernetes', 'Terraform', 'Docker', 'CI/CD'],
    sources: { resume: true, github: true, interview: true, assessment: true },
    updatedAt: '6h ago',
  },
];

const STATUS_COLORS: Record<string, string> = {
  'New': 'bg-evidence-collected/10 text-evidence-collected border-evidence-collected/20',
  'Screening': 'bg-evidence-review/10 text-evidence-review border-evidence-review/20',
  'Interview': 'bg-primary/10 text-primary border-primary/20',
  'Offer': 'bg-evidence-verified/10 text-evidence-verified border-evidence-verified/20',
  'Hired': 'bg-evidence-verified/15 text-evidence-verified border-evidence-verified/25',
  'Rejected': 'bg-evidence-risk/10 text-evidence-risk border-evidence-risk/20',
};

export default function CandidatesPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = MOCK_CANDIDATES.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Candidates"
        description="Candidate intelligence profiles with evidence-based assessments"
        icon={Users}
      >
        <Button variant="outline" size="sm" className="text-xs h-8 gap-1.5">
          <Download className="h-3.5 w-3.5" />
          Export
        </Button>
        <Button size="sm" className="text-xs h-8 gap-1.5">
          <UserPlus className="h-3.5 w-3.5" />
          Add Candidate
        </Button>
      </PageHeader>

      {/* Search + Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by name, role, or skill..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>
        <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
          <Filter className="h-3 w-3" />
          Filters
        </Button>
        <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
          <ArrowUpDown className="h-3 w-3" />
          Sort
        </Button>
      </div>

      {/* Candidates table */}
      <Card className="border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left text-2xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Candidate</th>
                <th className="text-left text-2xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Evidence</th>
                <th className="text-left text-2xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Readiness</th>
                <th className="text-left text-2xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Sources</th>
                <th className="text-left text-2xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Status</th>
                <th className="text-left text-2xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Updated</th>
                <th className="text-right text-2xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((candidate) => (
                <tr key={candidate.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors group">
                  {/* Candidate info */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/5 flex items-center justify-center shrink-0 text-xs font-semibold text-primary">
                        {candidate.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <Link href={`/dashboard/candidates/${candidate.id}`} className="text-xs font-semibold hover:text-primary transition-colors">
                          {candidate.name}
                        </Link>
                        <p className="text-2xs text-muted-foreground">{candidate.role}</p>
                      </div>
                    </div>
                  </td>

                  {/* Evidence score */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-mono tabular-nums">{candidate.evidenceScore}%</span>
                      <EvidenceBadge level={candidate.evidenceLevel} size="sm" showIcon={false} />
                    </div>
                  </td>

                  {/* Hiring readiness */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-14 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full", candidate.hiringReadiness >= 70 ? 'bg-evidence-verified' : candidate.hiringReadiness >= 50 ? 'bg-evidence-review' : 'bg-evidence-risk')}
                          style={{ width: `${candidate.hiringReadiness}%` }}
                        />
                      </div>
                      <span className="text-2xs font-mono text-muted-foreground">{candidate.hiringReadiness}%</span>
                    </div>
                  </td>

                  {/* Evidence sources */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {Object.entries(candidate.sources).map(([source, has]) => (
                        <div
                          key={source}
                          className={cn(
                            "h-5 w-5 rounded text-2xs font-semibold flex items-center justify-center border",
                            has ? "bg-evidence-verified/10 text-evidence-verified border-evidence-verified/20" : "bg-muted/30 text-muted-foreground/30 border-border"
                          )}
                          title={source.charAt(0).toUpperCase() + source.slice(1)}
                        >
                          {source.charAt(0).toUpperCase()}
                        </div>
                      ))}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-2xs font-medium border", STATUS_COLORS[candidate.status] || '')}>
                      {candidate.status}
                    </span>
                  </td>

                  {/* Updated */}
                  <td className="px-4 py-3">
                    <span className="text-2xs text-muted-foreground">{candidate.updatedAt}</span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/dashboard/candidates/${candidate.id}`}>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <Eye className="h-3 w-3" />
                        </Button>
                      </Link>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <GitCompareArrows className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-border bg-muted/10 flex items-center justify-between">
          <span className="text-2xs text-muted-foreground">{filtered.length} candidates</span>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-6 text-2xs">Previous</Button>
            <Button variant="ghost" size="sm" className="h-6 text-2xs">Next</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
