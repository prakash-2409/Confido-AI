'use client';

import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GraduationCap, TrendingUp, Users, Building, Filter, Download } from 'lucide-react';

// TODO: Replace with real API data (Epic 2/3)
const BATCH_STATS = [
  { batch: 'Class of 2026', total: 450, placed: 315, rate: 70 },
  { batch: 'Class of 2025', total: 420, placed: 386, rate: 92 },
  { batch: 'Class of 2024', total: 400, placed: 375, rate: 94 },
];

const TOP_EMPLOYERS = [
  { name: 'TechCorp', hires: 45, roles: 'Software Engineer, Data Analyst' },
  { name: 'InnovateAI', hires: 32, roles: 'ML Engineer, Backend Developer' },
  { name: 'GlobalFin', hires: 28, roles: 'Quantitative Analyst, SDE' },
  { name: 'CloudSystems', hires: 25, roles: 'Cloud Architect, DevOps' },
];

export default function PlacementPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Placement Intelligence"
        description="University and batch-level placement analytics"
        icon={GraduationCap}
      >
        <Button variant="outline" size="sm" className="text-xs h-8 gap-1.5">
          <Download className="h-3.5 w-3.5" />
          Export Report
        </Button>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Batch Placement Rates */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              Batch Placement Rates
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            {BATCH_STATS.map((stat) => (
              <div key={stat.batch}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium">{stat.batch}</span>
                  <span className="text-2xs text-muted-foreground">{stat.placed} / {stat.total} Placed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-evidence-verified transition-all duration-500"
                      style={{ width: `${stat.rate}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono font-bold text-evidence-verified w-8 text-right">{stat.rate}%</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Top Employers */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              Top Employers
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-0">
              {TOP_EMPLOYERS.map((employer, i) => (
                <div key={employer.name} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded bg-primary/5 flex items-center justify-center text-xs font-bold text-primary">
                      {i + 1}
                    </div>
                    <div>
                      <span className="text-xs font-semibold block">{employer.name}</span>
                      <span className="text-2xs text-muted-foreground">{employer.roles}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold font-mono">{employer.hires}</span>
                    <span className="text-2xs text-muted-foreground block">hires</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
