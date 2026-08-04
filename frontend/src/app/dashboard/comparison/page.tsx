'use client';

import { PageHeader } from '@/components/PageHeader';
import { ConfidenceScore } from '@/components/ConfidenceScore';
import { EvidenceBadge } from '@/components/EvidenceBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { GitCompareArrows, Plus, Brain, CheckCircle2 } from 'lucide-react';

// TODO: Replace with real API data (Epic 2/3)
const COMPARISON_DATA = {
  candidates: [
    { name: 'Arjun Mehta', role: 'Senior Backend Engineer' },
    { name: 'Vikram Singh', role: 'DevOps Engineer' },
  ],
  dimensions: [
    { dimension: 'Technical Depth', scores: [85, 82], reasoning: ['Strong Python/Django verified across 4 sources', 'Excellent infra/DevOps verified across 5 sources'] },
    { dimension: 'Evidence Strength', scores: [87, 94], reasoning: ['4 of 6 sources collected', 'All 5 sources fully verified'] },
    { dimension: 'Communication', scores: [78, 72], reasoning: ['Clear but occasionally verbose', 'Concise but lacks structured storytelling'] },
    { dimension: 'Problem Solving', scores: [82, 79], reasoning: ['Systematic approach to design problems', 'Good troubleshooting but weaker on design'] },
    { dimension: 'Learning Velocity', scores: [72, 85], reasoning: ['Moderate growth trajectory', 'Fast skill acquisition across multiple domains'] },
    { dimension: 'Authenticity', scores: [91, 96], reasoning: ['Consistent across sources, minor gaps', 'Fully consistent, no anomalies'] },
    { dimension: 'Risk Level', scores: [18, 8], reasoning: ['K8s/AWS claims need verification', 'No risk indicators found'] },
  ],
  recommendation: 'Vikram Singh has a stronger evidence profile with all sources verified and higher authenticity. However, Arjun Mehta shows stronger communication and problem-solving skills. For a backend-heavy role, Arjun is the better fit. For a DevOps role, Vikram is clearly stronger.',
};

export default function ComparisonPage() {
  const { candidates, dimensions, recommendation } = COMPARISON_DATA;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Candidate Comparison"
        description="Side-by-side intelligence comparison between candidates"
        icon={GitCompareArrows}
      >
        <Button variant="outline" size="sm" className="text-xs h-8 gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Add Candidate
        </Button>
      </PageHeader>

      {/* Comparison table */}
      <Card className="border-border">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left text-2xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 w-44">Dimension</th>
                  {candidates.map((c) => (
                    <th key={c.name} className="text-center px-4 py-3">
                      <div className="text-xs font-semibold text-foreground">{c.name}</div>
                      <div className="text-2xs text-muted-foreground">{c.role}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dimensions.map((dim) => {
                  const winner = dim.dimension === 'Risk Level'
                    ? (dim.scores[0] < dim.scores[1] ? 0 : dim.scores[0] > dim.scores[1] ? 1 : -1)
                    : (dim.scores[0] > dim.scores[1] ? 0 : dim.scores[0] < dim.scores[1] ? 1 : -1);

                  return (
                    <tr key={dim.dimension} className="border-b border-border/50">
                      <td className="px-4 py-3 text-xs font-semibold text-muted-foreground">{dim.dimension}</td>
                      {dim.scores.map((score, i) => (
                        <td key={i} className="px-4 py-3 text-center">
                          <div className="inline-flex flex-col items-center gap-1">
                            <div className="flex items-center gap-1.5">
                              <span className={cn(
                                "text-sm font-bold font-mono tabular-nums",
                                winner === i ? 'text-evidence-verified' : 'text-muted-foreground'
                              )}>
                                {score}{dim.dimension !== 'Risk Level' ? '%' : ''}
                              </span>
                              {winner === i && <CheckCircle2 className="h-3.5 w-3.5 text-evidence-verified" />}
                            </div>
                            <span className="text-2xs text-muted-foreground max-w-[200px] leading-relaxed">{dim.reasoning[i]}</span>
                          </div>
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* AI Recommendation */}
      <Card className="border-border bg-primary/[0.02]">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Brain className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-1">AI Recommendation</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{recommendation}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
