'use client';

import { PageHeader } from '@/components/PageHeader';
import { ConfidenceScore } from '@/components/ConfidenceScore';
import { EmptyState } from '@/components/EmptyState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { recruiterApi } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import {
  Mic,
  Play,
  Clock,
  User,
  MessageSquare,
  Brain,
  Lightbulb,
  Target,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

export default function InterviewIntelligencePage() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['candidates-interviews'],
    queryFn: () => recruiterApi.getCandidates()
  });

  if (isLoading) {
    return <LoadingState message="Loading interview intelligence reports..." />;
  }

  if (isError) {
    return (
      <ErrorState 
        message={error instanceof Error ? error.message : "Failed to load candidate interviews."} 
        onRetry={refetch}
      />
    );
  }

  const candidates = data?.data?.data?.candidates || [];
  
  // Filter candidates who have completed an interview in their timeline
  const interviews = candidates
    .filter(c => c.timeline.some(t => t.action.toLowerCase().includes('interview completed')))
    .map(c => {
      const comm = c.hiringDimensions.find(d => d.dimension.toLowerCase().includes('communication'))?.score || 75;
      const conf = c.hiringDimensions.find(d => d.dimension.toLowerCase().includes('authenticity'))?.score || 75;
      const prob = c.hiringDimensions.find(d => d.dimension.toLowerCase().includes('problem solving'))?.score || 75;
      const tech = c.hiringDimensions.find(d => d.dimension.toLowerCase().includes('technical'))?.score || 75;
      const think = c.hiringDimensions.find(d => d.dimension.toLowerCase().includes('project quality'))?.score || 75;
      const learn = c.hiringDimensions.find(d => d.dimension.toLowerCase().includes('learning velocity'))?.score || 75;

      const event = c.timeline.find(t => t.action.toLowerCase().includes('interview completed'));

      return {
        id: c._id || c.id,
        candidate: c.name,
        role: c.role,
        date: event?.date || '2 days ago',
        duration: '45 min',
        overallScore: c.hiringReadiness,
        dimensions: {
          communication: comm,
          confidence: conf,
          problemSolving: prob,
          technicalAccuracy: tech,
          thinkingProcess: think,
          learningAbility: learn,
        },
        summary: c.summary || 'No review notes populated.',
        actionItems: c.riskIndicators.map(r => r.detail || r.risk) || [],
        status: 'completed',
      };
    });

  if (interviews.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Interview Intelligence"
          description="AI-powered interview analysis with multi-dimensional scoring"
          icon={Mic}
        />
        <EmptyState
          icon={Mic}
          title="No interviews analyzed yet"
          description="No candidate has completed a technical or screening interview yet."
          action={{
            label: "View Candidates",
            href: "/dashboard/candidates"
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Interview Intelligence"
        description="AI-powered interview analysis with multi-dimensional scoring"
        icon={Mic}
      >
        <Link href="/dashboard/candidates">
          <Button size="sm" className="text-xs h-8 gap-1.5">
            <Play className="h-3.5 w-3.5" />
            Start Interview
          </Button>
        </Link>
      </PageHeader>

      {/* Interview cards */}
      <div className="space-y-4">
        {interviews.map((interview) => (
          <Card key={interview.id} className="border-border">
            <CardContent className="p-6">
              <div className="grid gap-6 lg:grid-cols-3">
                {/* Left: Candidate info + Summary */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Link href={`/dashboard/candidates/${interview.id}`} className="text-sm font-semibold hover:text-primary transition-colors">
                          {interview.candidate}
                        </Link>
                        <Badge variant="outline" className="text-2xs">{interview.role}</Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-2xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> {interview.date}</span>
                        <span className="text-2xs text-muted-foreground">{interview.duration}</span>
                      </div>
                    </div>
                    <ConfidenceScore score={interview.overallScore} size="md" />
                  </div>

                  {/* AI Summary */}
                  <div className="p-3 rounded-lg bg-muted/30 border border-border">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Brain className="h-3.5 w-3.5 text-primary" />
                      <span className="text-2xs font-semibold text-primary">AI Recruiter Summary</span>
                    </div>
                    <p className="text-xs text-foreground leading-relaxed">{interview.summary}</p>
                  </div>

                  {/* Action items */}
                  {interview.actionItems.length > 0 && (
                    <div>
                      <span className="text-2xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Action Items</span>
                      <div className="space-y-1.5">
                        {interview.actionItems.map((item, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Lightbulb className="h-3 w-3 text-evidence-review shrink-0" />
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: Dimensional scores */}
                <div className="space-y-3 border-l border-border pl-6 lg:pl-4">
                  <span className="text-2xs font-semibold text-muted-foreground uppercase tracking-wider block">Assessment Dimensions</span>
                  {Object.entries(interview.dimensions).map(([key, score]) => (
                    <ConfidenceScore
                      key={key}
                      score={score}
                      label={key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
                      size="sm"
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
