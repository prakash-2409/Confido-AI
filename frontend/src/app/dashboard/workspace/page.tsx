'use client';

import { PageHeader } from '@/components/PageHeader';
import { EvidenceBadge } from '@/components/EvidenceBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Kanban,
  Plus,
  Star,
  StickyNote,
  Clock,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Download,
  MoreHorizontal,
} from 'lucide-react';

// TODO: Replace with real API data (Epic 2/3)
const PIPELINE_COLUMNS = [
  {
    title: 'New',
    color: 'border-evidence-collected',
    candidates: [
      { id: '4', name: 'Ananya Rao', role: 'Data Scientist', evidence: 52, notes: 1 },
      { id: '6', name: 'Sneha Gupta', role: 'ML Engineer', evidence: 48, notes: 0 },
    ],
  },
  {
    title: 'Screening',
    color: 'border-evidence-review',
    candidates: [
      { id: '2', name: 'Priya Sharma', role: 'Full Stack Dev', evidence: 68, notes: 2 },
      { id: '3', name: 'Rahul Verma', role: 'Backend Engineer', evidence: 35, notes: 1 },
    ],
  },
  {
    title: 'Interview',
    color: 'border-primary',
    candidates: [
      { id: '1', name: 'Arjun Mehta', role: 'Sr. Backend Eng.', evidence: 87, notes: 3 },
    ],
  },
  {
    title: 'Offer',
    color: 'border-evidence-verified',
    candidates: [
      { id: '5', name: 'Vikram Singh', role: 'DevOps Engineer', evidence: 94, notes: 4 },
    ],
  },
];

const RECENT_NOTES = [
  { candidate: 'Arjun Mehta', note: 'Strong system design skills. Schedule final round with CTO.', time: '2h ago', author: 'You' },
  { candidate: 'Priya Sharma', note: 'Good frontend but needs backend depth assessment.', time: '1d ago', author: 'You' },
  { candidate: 'Vikram Singh', note: 'Approved for offer. Salary: ₹28L. Start: Sep 1.', time: '3d ago', author: 'You' },
];

export default function WorkspacePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Recruiter Workspace"
        description="Pipeline management, shortlists, notes, and hiring decisions"
        icon={Kanban}
      >
        <Button variant="outline" size="sm" className="text-xs h-8 gap-1.5">
          <Download className="h-3.5 w-3.5" />
          Export Report
        </Button>
        <Button size="sm" className="text-xs h-8 gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Add Candidate
        </Button>
      </PageHeader>

      {/* Kanban pipeline */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {PIPELINE_COLUMNS.map((column) => (
          <div key={column.title} className="space-y-3">
            <div className={cn("flex items-center justify-between border-b-2 pb-2", column.color)}>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold">{column.title}</span>
                <span className="text-2xs text-muted-foreground bg-muted rounded-full px-1.5 py-0.5 font-mono">{column.candidates.length}</span>
              </div>
              <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
                <Plus className="h-3 w-3 text-muted-foreground" />
              </Button>
            </div>
            <div className="space-y-2">
              {column.candidates.map((candidate) => (
                <Card key={candidate.id} className="border-border hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="text-xs font-semibold block">{candidate.name}</span>
                        <span className="text-2xs text-muted-foreground">{candidate.role}</span>
                      </div>
                      <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="w-10 h-1 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn("h-full rounded-full", candidate.evidence >= 70 ? 'bg-evidence-verified' : candidate.evidence >= 50 ? 'bg-evidence-review' : 'bg-evidence-risk')}
                            style={{ width: `${candidate.evidence}%` }}
                          />
                        </div>
                        <span className="text-2xs font-mono text-muted-foreground">{candidate.evidence}%</span>
                      </div>
                      {candidate.notes > 0 && (
                        <span className="text-2xs text-muted-foreground flex items-center gap-0.5">
                          <StickyNote className="h-3 w-3" /> {candidate.notes}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Recent Notes */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <StickyNote className="h-4 w-4 text-muted-foreground" />
            Recent Notes
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          {RECENT_NOTES.map((note, i) => (
            <div key={i} className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0">
              <div className="h-6 w-6 rounded bg-muted/50 flex items-center justify-center shrink-0 mt-0.5">
                <MessageSquare className="h-3 w-3 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-semibold">{note.candidate}</span>
                  <span className="text-2xs text-muted-foreground">{note.time}</span>
                </div>
                <p className="text-xs text-muted-foreground">{note.note}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
