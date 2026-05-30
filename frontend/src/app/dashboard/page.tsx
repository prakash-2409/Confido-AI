'use client';

/**
 * Main Dashboard Page
 * 
 * Features:
 * - Unified Career Readiness Score
 * - ATS Resume & Mock Interview detailed stats
 * - Actionable AI Recommendations Center
 * - Interactive Career Growth Timeline
 */

import { useEffect, useState, useMemo } from 'react';
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
  ChevronRight,
  Zap,
  Award,
  BarChart3,
  CheckCircle2,
  AlertCircle,
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
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

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
    if (score >= 80) return { label: 'Job Ready', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    if (score >= 60) return { label: 'Almost Ready', color: 'text-yellow-700 bg-yellow-50 border-yellow-200' };
    if (score >= 30) return { label: 'Preparing', color: 'text-orange-700 bg-orange-50 border-orange-200' };
    return { label: 'Getting Started', color: 'text-blue-700 bg-blue-50 border-blue-200' };
  };

  const readinessInfo = getReadinessLabel(metrics?.careerReadiness || 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
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
      className="space-y-8"
    >
      {/* Header */}
      <motion.div 
        variants={itemVariants}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {getGreeting()}, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Track your career preparation metrics and readiness checklist.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/resume">
            <Button variant="outline" className="gap-2">
              <Upload className="h-4 w-4" />
              Upload Resume
            </Button>
          </Link>
          <Link href="/dashboard/interview">
            <Button className="gap-2">
              <Zap className="h-4 w-4" />
              Start Mock Session
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Career Readiness Main Summary Card */}
      <motion.div variants={itemVariants}>
        <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-card via-card to-primary/5">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="relative shrink-0">
                <ScoreGauge score={metrics?.careerReadiness || 0} size="lg" />
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-xl font-bold">Career Readiness Score</h2>
                    <Badge variant="outline" className={cn('text-xs py-0.5', readinessInfo.color)}>
                      {readinessInfo.label}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    This score is dynamically computed from your ATS compatibility, interview performance, learning roadmap milestones, and profile completion.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground block">ATS Resume Score</span>
                    <span className="text-lg font-bold">{breakdown.atsScore > 0 ? `${breakdown.atsScore}%` : '--'}</span>
                    <Progress value={breakdown.atsScore} className="h-1 bg-muted" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground block">Interview Score</span>
                    <span className="text-lg font-bold">{breakdown.interviewScore > 0 ? `${breakdown.interviewScore}%` : '--'}</span>
                    <Progress value={breakdown.interviewScore} className="h-1 bg-muted" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground block">Roadmap Progress</span>
                    <span className="text-lg font-bold">{breakdown.roadmapProgress}%</span>
                    <Progress value={breakdown.roadmapProgress} className="h-1 bg-muted" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground block">Profile Completion</span>
                    <span className="text-lg font-bold">{breakdown.profileCompleteness}%</span>
                    <Progress value={breakdown.profileCompleteness} className="h-1 bg-muted" />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <div className="absolute top-0 right-0 p-4 text-primary/10">
            <Award className="h-24 w-24" />
          </div>
        </Card>
      </motion.div>

      {/* Top Actionable Recommendations Center */}
      {metrics?.recommendations && metrics.recommendations.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                <CardTitle className="text-lg">AI Actionable Suggestions</CardTitle>
              </div>
              <CardDescription>
                Complete these top actions to quickly boost your Career Readiness score:
              </CardDescription>
            </CardHeader>
            <CardContent>
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
                      <div className="h-full flex flex-col justify-between p-4 rounded-xl border border-border bg-card hover:border-primary hover:shadow-md transition-all cursor-pointer">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <Badge className={cn(
                              'text-[10px] uppercase font-bold tracking-wider',
                              rec.priority === 'high' ? 'bg-red-100 text-red-700 hover:bg-red-100' :
                              rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100' :
                              'bg-blue-100 text-blue-700 hover:bg-blue-100'
                            )}>
                              {rec.priority}
                            </Badge>
                            <Icon className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <h4 className="font-semibold text-sm group-hover:text-primary transition-colors">{rec.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                            {rec.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-primary font-medium mt-4 group-hover:translate-x-1 transition-transform">
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

      {/* Main Grid: Timeline + Actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Span: Career Growth Timeline */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg">Career Growth Timeline</CardTitle>
              <CardDescription>Visual history of your milestones, uploads, and session scores</CardDescription>
            </CardHeader>
            <CardContent>
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
                          "absolute -left-[35px] top-0 h-6 w-6 rounded-full flex items-center justify-center border bg-card text-xs transition-colors",
                          event.type === 'achievement' ? 'border-emerald-200 text-emerald-600 bg-emerald-50' : 'border-border text-muted-foreground'
                        )}>
                          <Icon className="h-3 w-3" />
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground font-medium block">
                            {formatTimeAgo(new Date(event.timestamp))}
                          </span>
                          <h4 className="font-semibold text-sm">{event.title}</h4>
                          <p className="text-xs text-muted-foreground mt-0.5">{event.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                  <Clock className="h-10 w-10 mb-2 stroke-[1.5]" />
                  <p className="text-sm">No activity recorded yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Right Span: Quick Actions & Links */}
        <motion.div variants={itemVariants}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg">Quick Access</CardTitle>
              <CardDescription>Navigate to specialized modules</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <QuickActionCard
                icon={FileText}
                title="Resume Analysis"
                description="Upload and check ATS match"
                href="/dashboard/resume"
                color="blue"
              />
              <QuickActionCard
                icon={MessageSquare}
                title="Interview Prep"
                description="AI mock interview round"
                href="/dashboard/interview"
                color="purple"
              />
              <QuickActionCard
                icon={Map}
                title="Personal Roadmap"
                description="Custom milestones and guides"
                href="/dashboard/roadmap"
                color="emerald"
              />
              <QuickActionCard
                icon={TrendingUp}
                title="Career Profile"
                description="Target roles and details"
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
    blue: 'bg-blue-50 text-blue-600 group-hover:bg-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100',
    purple: 'bg-purple-50 text-purple-600 group-hover:bg-purple-100',
    orange: 'bg-orange-50 text-orange-600 group-hover:bg-orange-100',
  };

  return (
    <Link href={href}>
      <div className="group flex items-center gap-4 p-4 rounded-xl border border-border/50 hover:border-border hover:shadow-sm transition-all cursor-pointer bg-card">
        <div className={cn(
          'h-12 w-12 rounded-lg flex items-center justify-center transition-colors',
          colorClasses[color]
        )}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm">{title}</h3>
          <p className="text-xs text-muted-foreground truncate">{description}</p>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
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
