'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { dashboardApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScoreGauge } from '@/components/ScoreGauge';
import {
  FileText,
  Upload,
  MessageSquare,
  ArrowRight,
  Clock,
  TrendingUp,
  Sparkles,
  Target,
  Zap,
  Award,
  Loader2,
  Map,
  UserCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 15 }
  },
} as const;

export default function DashboardPage() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const res = await dashboardApi.getMetrics();
      setMetrics(res.data.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getReadinessLabel = (score: number) => {
    if (score >= 80) return { label: 'Job Ready', color: 'text-success bg-success/10 border-success/20 dark:bg-success/20 dark:text-success' };
    if (score >= 60) return { label: 'Almost Ready', color: 'text-warning bg-warning/10 border-warning/20 dark:bg-warning/20 dark:text-warning' };
    if (score >= 30) return { label: 'Preparing', color: 'text-orange-500 bg-orange-500/10 border-orange-500/20 dark:bg-orange-500/20 dark:text-orange-400' };
    return { label: 'Getting Started', color: 'text-blue-500 bg-blue-500/10 border-blue-500/20 dark:bg-blue-500/20 dark:text-blue-400' };
  };

  const readinessInfo = getReadinessLabel(metrics?.careerReadiness || 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-4 select-none">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Analyzing profiles...</p>
        </div>
      </div>
    );
  }

  const breakdown = metrics?.breakdown || {
    atsScore: 0,
    interviewScore: 0,
    roadmapProgress: 0,
    profileCompleteness: 30
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 max-w-6xl mx-auto"
    >
      {/* Header Banner Greeting */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/40 pb-6"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-b from-foreground to-foreground/80 bg-clip-text text-transparent">
            {getGreeting()}, {user?.name?.split(' ')[0]}! 
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5 font-medium">
            Review your dynamic readiness metrics, skill gaps, and custom roadmaps.
          </p>
        </div>
        <div className="flex gap-2.5">
          <Link href="/dashboard/resume">
            <Button variant="outline" className="gap-2 text-xs font-semibold h-9 border-border/80 bg-background/50 hover:bg-muted/80">
              <Upload className="h-3.5 w-3.5" />
              Upload Resume
            </Button>
          </Link>
          <Link href="/dashboard/interview">
            <Button className="gap-2 text-xs font-semibold h-9 shadow-premium hover:shadow-premium-hover">
              <Zap className="h-3.5 w-3.5" />
              Practice Mock Interview
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Career Readiness Main Summary Card */}
      <motion.div variants={itemVariants}>
        <Card variant="glass" className="relative overflow-hidden border-border/60 shadow-glass">
          <CardContent className="pt-8 pb-8 px-6 sm:px-8">
            <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
              <div className="relative shrink-0 flex items-center justify-center p-2 rounded-full bg-background/40 backdrop-blur-sm border border-border/20 shadow-sm">
                <ScoreGauge score={metrics?.careerReadiness || 0} size="lg" />
              </div>
              <div className="flex-1 space-y-5">
                <div>
                  <div className="flex flex-wrap items-center gap-2.5 mb-2">
                    <h2 className="text-xl font-extrabold tracking-tight">Career Readiness Index</h2>
                    <Badge variant="outline" className={cn('text-[10px] font-bold uppercase tracking-wider py-0.5 px-2.5 border', readinessInfo.color)}>
                      {readinessInfo.label}
                    </Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-medium max-w-2xl">
                    This score is dynamically computed from your ATS compatibility, interview performance, learning roadmap milestones, and profile completion.
                  </p>
                </div>

                {/* Metrics Breakdown Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 pt-2 border-t border-border/30">
                  <div className="space-y-2">
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">ATS Score</span>
                    <span className="text-lg font-extrabold font-mono tracking-tight">{breakdown.atsScore > 0 ? `${breakdown.atsScore}%` : '--'}</span>
                    <Progress value={breakdown.atsScore} className="h-1 bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Mock Score</span>
                    <span className="text-lg font-extrabold font-mono tracking-tight">{breakdown.interviewScore > 0 ? `${breakdown.interviewScore}%` : '--'}</span>
                    <Progress value={breakdown.interviewScore} className="h-1 bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Roadmap</span>
                    <span className="text-lg font-extrabold font-mono tracking-tight">{breakdown.roadmapProgress}%</span>
                    <Progress value={breakdown.roadmapProgress} className="h-1 bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Completeness</span>
                    <span className="text-lg font-extrabold font-mono tracking-tight">{breakdown.profileCompleteness}%</span>
                    <Progress value={breakdown.profileCompleteness} className="h-1 bg-muted" />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <div className="absolute top-0 right-0 p-4 text-primary/5 pointer-events-none">
            <Award className="h-28 w-28 stroke-[1]" />
          </div>
        </Card>
      </motion.div>

      {/* Top Actionable Recommendations Center */}
      {metrics?.recommendations && metrics.recommendations.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card variant="standard" className="border-border/60 shadow-sm bg-primary/5 dark:bg-card/30">
            <CardHeader className="pb-3 px-6 pt-6">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4.5 w-4.5 text-primary animate-pulse" />
                <CardTitle className="text-base font-bold tracking-tight">AI Recommended Actions</CardTitle>
              </div>
              <CardDescription className="text-xs font-semibold text-muted-foreground">
                Complete these prioritised milestones to boost your career readiness:
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="grid gap-4 md:grid-cols-3">
                {metrics.recommendations.map((rec: any) => {
                  const iconMap: Record<string, any> = {
                    resume: FileText,
                    interview: MessageSquare,
                    roadmap: Map,
                    profile: UserCheck
                  };
                  const Icon = iconMap[rec.type] || Target;

                  return (
                    <Link href={rec.actionLink} key={rec.id} className="block group">
                      <div className="h-full flex flex-col justify-between p-4.5 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-premium-hover transition-all cursor-pointer">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="outline" className={cn(
                              'text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 border',
                              rec.priority === 'high' ? 'bg-danger/10 text-danger border-danger/20' :
                              rec.priority === 'medium' ? 'bg-warning/10 text-warning border-warning/20' :
                              'bg-blue-500/10 text-blue-500 border-blue-500/20'
                            )}>
                              {rec.priority}
                            </Badge>
                            <Icon className="h-3.5 w-3.5 text-muted-foreground/80" />
                          </div>
                          <h4 className="font-bold text-sm group-hover:text-primary transition-colors tracking-tight">{rec.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed font-medium">
                            {rec.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-primary font-bold mt-5 group-hover:translate-x-1 transition-transform">
                          Take Action
                          <ArrowRight className="h-3 w-3" />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Main Grid Layout: Activities + Quick Access */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column: Activity history */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="h-full border-border/60 shadow-sm">
            <CardHeader className="px-6 pt-6">
              <CardTitle className="text-base font-bold tracking-tight">Career Growth Timeline</CardTitle>
              <CardDescription className="text-xs font-medium text-muted-foreground">Historical records of your metrics, mock evaluations, and profile updates.</CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-2">
              {metrics?.timeline && metrics.timeline.length > 0 ? (
                <div className="relative border-l border-border pl-6 space-y-6">
                  {metrics.timeline.map((event: any) => {
                    const iconMap: Record<string, any> = {
                      resume: FileText,
                      interview: MessageSquare,
                      roadmap: Map,
                      achievement: Award
                    };
                    const Icon = iconMap[event.type] || Clock;

                    return (
                      <div key={event.id} className="relative group">
                        {/* Timeline dot */}
                        <div className={cn(
                          "absolute -left-[37px] top-0 h-6 w-6 rounded-full flex items-center justify-center border bg-background text-xs transition-colors shadow-sm",
                          event.type === 'achievement' ? 'border-success/30 text-success bg-success/5' : 'border-border text-muted-foreground/80'
                        )}>
                          <Icon className="h-3 w-3" />
                        </div>
                        <div>
                          <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider block font-mono">
                            {formatTimeAgo(new Date(event.timestamp))}
                          </span>
                          <h4 className="font-bold text-sm tracking-tight">{event.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed font-medium">{event.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground select-none">
                  <Clock className="h-8 w-8 mb-2 text-muted-foreground/60 stroke-[1.5]" />
                  <p className="text-xs font-semibold uppercase tracking-wider">No activities logged</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Right column: Quick Actions */}
        <motion.div variants={itemVariants}>
          <Card className="h-full border-border/60 shadow-sm">
            <CardHeader className="px-6 pt-6">
              <CardTitle className="text-base font-bold tracking-tight">Quick Access</CardTitle>
              <CardDescription className="text-xs font-medium text-muted-foreground">Directly launch system tools</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-6 pb-6">
              <QuickActionCard
                icon={FileText}
                title="ATS Analyzer"
                description="Check resume keyword compatibility"
                href="/dashboard/resume"
                color="blue"
              />
              <QuickActionCard
                icon={MessageSquare}
                title="AI Mock Coach"
                description="Voice & text mock sessions"
                href="/dashboard/interview"
                color="purple"
              />
              <QuickActionCard
                icon={Map}
                title="Personal Roadmap"
                description="Track custom skill roadmaps"
                href="/dashboard/roadmap"
                color="emerald"
              />
              <QuickActionCard
                icon={TrendingUp}
                title="Career Profile"
                description="Manage target salaries & roles"
                href="/dashboard/profile"
                color="orange"
              />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}

// Quick Action Card Component
function QuickActionCard({
  icon: Icon,
  title,
  description,
  href,
  color
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  href: string;
  color: 'blue' | 'emerald' | 'purple' | 'orange';
}) {
  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-500 border-blue-500/20 group-hover:bg-blue-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 group-hover:bg-emerald-500/20',
    purple: 'bg-purple-500/10 text-purple-500 border-purple-500/20 group-hover:bg-purple-500/20',
    orange: 'bg-orange-500/10 text-orange-500 border-orange-500/20 group-hover:bg-orange-500/20',
  };

  return (
    <Link href={href}>
      <div className="group flex items-center gap-4 p-4 rounded-xl border border-border/50 hover:border-primary/20 hover:shadow-premium-hover transition-all cursor-pointer bg-card/65">
        <div className={cn(
          'h-11 w-11 rounded-lg flex items-center justify-center border transition-colors shrink-0',
          colorClasses[color]
        )}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm tracking-tight">{title}</h3>
          <p className="text-xs text-muted-foreground truncate font-medium">{description}</p>
        </div>
        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
      </div>
    </Link>
  );
}

// Helper function to format time ago
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
