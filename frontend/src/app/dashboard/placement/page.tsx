'use client';

import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GraduationCap, TrendingUp, Users, Building, Filter, Download } from 'lucide-react';
import { recruiterApi } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { EmptyState } from '@/components/EmptyState';

export default function PlacementPage() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['placement-stats'],
    queryFn: () => recruiterApi.getPlacementStats()
  });

  if (isLoading) {
    return <LoadingState message="Loading placement intelligence..." />;
  }

  if (isError) {
    return (
      <ErrorState 
        message={error instanceof Error ? error.message : "Failed to load placement stats."} 
        onRetry={refetch}
      />
    );
  }

  const batchStats = data?.data?.data?.batchStats || [];
  const topEmployers = data?.data?.data?.topEmployers || [];

  if (batchStats.length === 0 && topEmployers.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Placement Intelligence"
          description="University and batch-level placement analytics"
          icon={GraduationCap}
        />
        <EmptyState
          icon={GraduationCap}
          title="No placement data available"
          description="No batch placement records or employer data found."
        />
      </div>
    );
  }

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
            {batchStats.map((stat) => (
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
              {topEmployers.map((employer, i) => (
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
