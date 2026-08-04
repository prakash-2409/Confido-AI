'use client';

import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { BarChart3, TrendingUp, Users, Clock, Target, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';

// TODO: Replace with real API data (Epic 2/3)
const FUNNEL_DATA = [
  { stage: 'Applied', count: 48, percentage: 100 },
  { stage: 'Screened', count: 32, percentage: 67 },
  { stage: 'Interviewed', count: 14, percentage: 29 },
  { stage: 'Offered', count: 5, percentage: 10 },
  { stage: 'Hired', count: 3, percentage: 6 },
];

const SKILL_TRENDS = [
  { skill: 'Python', demand: 85, supply: 72 },
  { skill: 'React', demand: 78, supply: 65 },
  { skill: 'AWS', demand: 72, supply: 45 },
  { skill: 'Docker', demand: 68, supply: 58 },
  { skill: 'TypeScript', demand: 65, supply: 52 },
  { skill: 'PostgreSQL', demand: 60, supply: 48 },
];

const METRICS = [
  { label: 'Avg. Time to Hire', value: '18 days', change: '-3d', positive: true },
  { label: 'Pipeline Velocity', value: '4.2 candidates/week', change: '+15%', positive: true },
  { label: 'Evidence Coverage', value: '68%', change: '+8%', positive: true },
  { label: 'Offer Acceptance', value: '60%', change: '-5%', positive: false },
];

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Hiring Analytics"
        description="Pipeline metrics, skill trends, and hiring velocity"
        icon={BarChart3}
      >
        <Button variant="outline" size="sm" className="text-xs h-8 gap-1.5">
          <Filter className="h-3.5 w-3.5" />
          Last 30 days
        </Button>
      </PageHeader>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {METRICS.map((metric) => (
          <Card key={metric.label} className="border-border">
            <CardContent className="p-4">
              <span className="text-2xs text-muted-foreground font-medium block mb-1">{metric.label}</span>
              <div className="flex items-end justify-between">
                <span className="text-lg font-bold tracking-tight">{metric.value}</span>
                <span className={cn("text-2xs font-semibold", metric.positive ? 'text-evidence-verified' : 'text-evidence-risk')}>
                  {metric.change}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Hiring funnel */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              Hiring Funnel
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {FUNNEL_DATA.map((stage, i) => (
              <div key={stage.stage}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium">{stage.stage}</span>
                  <span className="text-2xs text-muted-foreground">{stage.count} · {stage.percentage}%</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary/70 transition-all duration-500"
                    style={{ width: `${stage.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Skill supply vs demand */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              Skill Demand vs. Supply
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {SKILL_TRENDS.map((skill) => (
              <div key={skill.skill} className="flex items-center gap-3">
                <span className="text-xs font-semibold w-24">{skill.skill}</span>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-2xs text-muted-foreground w-14">Demand</span>
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-evidence-collected" style={{ width: `${skill.demand}%` }} />
                    </div>
                    <span className="text-2xs font-mono text-muted-foreground w-8 text-right">{skill.demand}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xs text-muted-foreground w-14">Supply</span>
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-evidence-verified" style={{ width: `${skill.supply}%` }} />
                    </div>
                    <span className="text-2xs font-mono text-muted-foreground w-8 text-right">{skill.supply}%</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
