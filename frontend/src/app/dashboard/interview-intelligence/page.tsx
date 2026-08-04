'use client';

import { PageHeader } from '@/components/PageHeader';
import { ConfidenceScore } from '@/components/ConfidenceScore';
import { EmptyState } from '@/components/EmptyState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
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

// TODO: Replace with real API data (Epic 2/3)
const MOCK_INTERVIEWS = [
  {
    id: '1',
    candidate: 'Arjun Mehta',
    role: 'Senior Backend Engineer',
    date: '2 days ago',
    duration: '45 min',
    overallScore: 82,
    dimensions: {
      communication: 78,
      confidence: 85,
      problemSolving: 82,
      technicalAccuracy: 88,
      thinkingProcess: 75,
      learningAbility: 80,
    },
    summary: 'Strong technical depth with systematic problem-solving approach. Communication is clear but occasionally verbose. Showed excellent knowledge of distributed systems patterns.',
    actionItems: ['Probe deeper on cloud-native experience', 'Assess team collaboration in next round'],
    status: 'completed',
  },
  {
    id: '2',
    candidate: 'Priya Sharma',
    role: 'Full Stack Developer',
    date: '5 days ago',
    duration: '35 min',
    overallScore: 71,
    dimensions: {
      communication: 82,
      confidence: 68,
      problemSolving: 72,
      technicalAccuracy: 70,
      thinkingProcess: 65,
      learningAbility: 75,
    },
    summary: 'Good communication skills and enthusiasm. Technical knowledge is solid but lacks depth in backend architecture. Shows strong learning potential.',
    actionItems: ['Schedule system design assessment', 'Evaluate React performance optimization knowledge'],
    status: 'completed',
  },
];

export default function InterviewIntelligencePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Interview Intelligence"
        description="AI-powered interview analysis with multi-dimensional scoring"
        icon={Mic}
      >
        <Button size="sm" className="text-xs h-8 gap-1.5">
          <Play className="h-3.5 w-3.5" />
          Start Interview
        </Button>
      </PageHeader>

      {/* Interview cards */}
      <div className="space-y-4">
        {MOCK_INTERVIEWS.map((interview) => (
          <Card key={interview.id} className="border-border">
            <CardContent className="p-6">
              <div className="grid gap-6 lg:grid-cols-3">
                {/* Left: Candidate info + Summary */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold">{interview.candidate}</h3>
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
