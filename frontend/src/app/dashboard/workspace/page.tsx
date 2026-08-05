'use client';

import { PageHeader } from '@/components/PageHeader';
import { EvidenceBadge } from '@/components/EvidenceBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { recruiterApi } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { EmptyState } from '@/components/EmptyState';
import Link from 'next/link';
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

export default function WorkspacePage() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['workspace-pipeline'],
    queryFn: () => recruiterApi.getWorkspacePipeline()
  });

  if (isLoading) {
    return <LoadingState message="Loading recruiter workspace..." />;
  }

  if (isError) {
    return (
      <ErrorState 
        message={error instanceof Error ? error.message : "Failed to load workspace pipeline."} 
        onRetry={refetch}
      />
    );
  }

  const pipeline = data?.data?.data?.pipeline || [];
  const recentNotes = data?.data?.data?.recentNotes || [];

  const isEmpty = pipeline.every(col => col.candidates.length === 0);

  if (isEmpty) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Recruiter Workspace"
          description="Pipeline management, shortlists, notes, and hiring decisions"
          icon={Kanban}
        />
        <EmptyState
          icon={Kanban}
          title="Pipeline is empty"
          description="No candidates are currently active. Add candidates to see them in the Kanban columns."
          action={{
            label: "Add Candidate",
            href: "/dashboard/candidates"
          }}
        />
      </div>
    );
  }

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
        <Link href="/dashboard/candidates">
          <Button size="sm" className="text-xs h-8 gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Add Candidate
          </Button>
        </Link>
      </PageHeader>

      {/* Kanban pipeline */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {pipeline.map((column) => (
          <div key={column.title} className="space-y-3">
            <div className={cn("flex items-center justify-between border-b-2 pb-2", column.color)}>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold">{column.title}</span>
                <span className="text-2xs text-muted-foreground bg-muted rounded-full px-1.5 py-0.5 font-mono">{column.candidates.length}</span>
              </div>
              <Link href="/dashboard/candidates">
                <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
                  <Plus className="h-3 w-3 text-muted-foreground" />
                </Button>
              </Link>
            </div>
            <div className="space-y-2">
              {column.candidates.map((candidate) => (
                <Link href={`/dashboard/candidates/${candidate.id}`} key={candidate.id} className="block">
                  <Card className="border-border hover:shadow-md transition-shadow cursor-pointer">
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
                </Link>
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
          {recentNotes.length > 0 ? (
            recentNotes.map((note, i) => (
              <div key={i} className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0">
                <div className="h-6 w-6 rounded bg-muted/50 flex items-center justify-center shrink-0 mt-0.5">
                  <MessageSquare className="h-3 w-3 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Link href={`/dashboard/candidates/${note.candidateId}`} className="text-xs font-semibold hover:text-primary transition-colors">
                      {note.candidate}
                    </Link>
                    <span className="text-2xs text-muted-foreground">{note.time} · by {note.author}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{note.note}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="py-4 text-center text-xs text-muted-foreground">
              No notes recorded yet. Add notes to a candidate profile to view them here.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
