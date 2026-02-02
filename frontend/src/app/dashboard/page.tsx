'use client';

/**
 * Main Dashboard Page
 * 
 * Features:
 * - Resume ATS score visualization
 * - Interview readiness indicator
 * - Recent activity timeline
 * - Quick action buttons
 */

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { resumeApi, interviewApi, Resume, Interview } from '@/lib/api';
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
  Calendar,
  CheckCircle2,
  AlertCircle,
  Loader2,
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

// Activity item type
interface ActivityItem {
  id: string;
  type: 'resume' | 'interview' | 'achievement';
  title: string;
  description: string;
  timestamp: Date;
  status?: 'success' | 'warning' | 'info';
  link?: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resumeRes, interviewRes] = await Promise.all([
          resumeApi.getAll().catch(() => ({ data: { data: { resumes: [] } } })),
          interviewApi.getAll().catch(() => ({ data: { data: { interviews: [] } } })),
        ]);
        
        setResumes(resumeRes.data.data.resumes || []);
        setInterviews(interviewRes.data.data.interviews || []);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate metrics
  const latestAnalyzedResume = useMemo(() => 
    resumes.find((r) => r.status === 'analyzed' && r.atsScore), 
    [resumes]
  );

  const completedInterviews = useMemo(() => 
    interviews.filter((i) => i.status === 'completed'),
    [interviews]
  );

  const averageInterviewScore = useMemo(() => {
    if (completedInterviews.length === 0) return null;
    const total = completedInterviews.reduce((acc, i) => acc + (i.overallScore || 0), 0);
    return Math.round(total / completedInterviews.length);
  }, [completedInterviews]);

  const interviewReadiness = useMemo(() => {
    let score = 0;
    if (latestAnalyzedResume && latestAnalyzedResume.atsScore && latestAnalyzedResume.atsScore >= 70) score += 40;
    else if (latestAnalyzedResume?.atsScore) score += 20;
    if (completedInterviews.length >= 3) score += 30;
    else if (completedInterviews.length >= 1) score += 15;
    if (averageInterviewScore && averageInterviewScore >= 70) score += 30;
    else if (averageInterviewScore && averageInterviewScore >= 50) score += 15;
    return Math.min(100, score);
  }, [latestAnalyzedResume, completedInterviews, averageInterviewScore]);

  // Generate activity timeline
  const recentActivity = useMemo<ActivityItem[]>(() => {
    const activities: ActivityItem[] = [];
    
    // Add resume activities
    resumes.slice(0, 3).forEach((resume) => {
      activities.push({
        id: `resume-${resume._id}`,
        type: 'resume',
        title: resume.status === 'analyzed' ? 'Resume Analyzed' : 'Resume Uploaded',
        description: resume.originalFilename,
        timestamp: new Date(resume.createdAt),
        status: resume.atsScore && resume.atsScore >= 70 ? 'success' : 'warning',
        link: `/dashboard/resume`,
      });
    });
    
    // Add interview activities
    interviews.slice(0, 3).forEach((interview) => {
      activities.push({
        id: `interview-${interview._id}`,
        type: 'interview',
        title: interview.status === 'completed' ? 'Interview Completed' : 'Interview Started',
        description: `${interview.targetRole} - ${interview.difficulty}`,
        timestamp: new Date(interview.createdAt),
        status: interview.overallScore && interview.overallScore >= 70 ? 'success' : 'info',
        link: interview.status === 'completed' 
          ? `/interview/${interview._id}/summary`
          : `/interview/${interview._id}`,
      });
    });
    
    // Sort by timestamp
    return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 5);
  }, [resumes, interviews]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getReadinessLabel = (score: number) => {
    if (score >= 80) return { label: 'Ready', color: 'text-emerald-600 bg-emerald-50' };
    if (score >= 60) return { label: 'Almost Ready', color: 'text-yellow-600 bg-yellow-50' };
    if (score >= 30) return { label: 'Preparing', color: 'text-orange-600 bg-orange-50' };
    return { label: 'Just Started', color: 'text-gray-600 bg-gray-50' };
  };

  const readinessInfo = getReadinessLabel(interviewReadiness);

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
            Here&apos;s your career preparation overview
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
              Start Interview
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div variants={itemVariants}>
          <Card className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Resumes Analyzed
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{resumes.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {resumes.filter(r => r.status === 'analyzed').length} with ATS scores
              </p>
            </CardContent>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/20 to-primary/5" />
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Latest ATS Score
              </CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">
                  {latestAnalyzedResume?.atsScore 
                    ? `${Math.round(latestAnalyzedResume.atsScore)}%`
                    : '--'}
                </span>
                {latestAnalyzedResume?.atsScore && (
                  <Badge 
                    variant="secondary"
                    className={cn(
                      'text-xs',
                      latestAnalyzedResume.atsScore >= 80 ? 'bg-emerald-50 text-emerald-700' :
                      latestAnalyzedResume.atsScore >= 60 ? 'bg-yellow-50 text-yellow-700' :
                      'bg-red-50 text-red-700'
                    )}
                  >
                    {latestAnalyzedResume.atsScore >= 80 ? 'Excellent' :
                     latestAnalyzedResume.atsScore >= 60 ? 'Good' : 'Needs Work'}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {latestAnalyzedResume ? 'Based on latest analysis' : 'No resume analyzed yet'}
              </p>
            </CardContent>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500/20 to-emerald-500/5" />
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Interviews Completed
              </CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{completedInterviews.length}</span>
                {averageInterviewScore !== null && (
                  <span className="text-sm text-muted-foreground">
                    Avg: {averageInterviewScore}%
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {interviews.filter(i => i.status === 'in_progress').length} in progress
              </p>
            </CardContent>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500/20 to-blue-500/5" />
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Interview Readiness
              </CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{interviewReadiness}%</span>
                <Badge className={cn('text-xs', readinessInfo.color)}>
                  {readinessInfo.label}
                </Badge>
              </div>
              <Progress value={interviewReadiness} className="h-1.5 mt-2" />
            </CardContent>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500/20 to-purple-500/5" />
          </Card>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* ATS Score Card */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Resume Performance</CardTitle>
                  <CardDescription>
                    Your latest resume ATS compatibility
                  </CardDescription>
                </div>
                <Link href="/dashboard/resume">
                  <Button variant="ghost" size="sm" className="gap-1">
                    View Details
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {latestAnalyzedResume?.atsScore ? (
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <ScoreGauge score={latestAnalyzedResume.atsScore} size="lg" />
                  <div className="flex-1 space-y-4">
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-2">
                        Skills Detected
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {latestAnalyzedResume.skills?.slice(0, 8).map((skill) => (
                          <Badge key={skill} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {(latestAnalyzedResume.skills?.length || 0) > 8 && (
                          <Badge variant="outline" className="text-xs">
                            +{latestAnalyzedResume.skills!.length - 8} more
                          </Badge>
                        )}
                      </div>
                    </div>
                    {latestAnalyzedResume.missingKeywords && latestAnalyzedResume.missingKeywords.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground mb-2">
                          Suggested Keywords
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {latestAnalyzedResume.missingKeywords.slice(0, 5).map((keyword) => (
                            <Badge 
                              key={keyword} 
                              variant="outline" 
                              className="text-xs border-orange-200 bg-orange-50 text-orange-700"
                            >
                              + {keyword}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold mb-2">No Resume Analyzed Yet</h3>
                  <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                    Upload your resume and analyze it against job descriptions to see your ATS compatibility score.
                  </p>
                  <Link href="/dashboard/resume">
                    <Button className="gap-2">
                      <Upload className="h-4 w-4" />
                      Upload Resume
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity */}
        <motion.div variants={itemVariants}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg">Recent Activity</CardTitle>
              <CardDescription>Your latest actions and progress</CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link 
                        href={activity.link || '#'}
                        className="flex items-start gap-3 p-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className={cn(
                          'h-8 w-8 rounded-full flex items-center justify-center shrink-0',
                          activity.status === 'success' ? 'bg-emerald-100 text-emerald-600' :
                          activity.status === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                          'bg-blue-100 text-blue-600'
                        )}>
                          {activity.type === 'resume' ? <FileText className="h-4 w-4" /> :
                           activity.type === 'interview' ? <MessageSquare className="h-4 w-4" /> :
                           <Award className="h-4 w-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{activity.title}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {activity.description}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatTimeAgo(activity.timestamp)}
                          </p>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Clock className="h-10 w-10 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No recent activity yet
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
            <CardDescription>
              Continue where you left off or start something new
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <QuickActionCard
                icon={Upload}
                title="Upload Resume"
                description="Add a new resume for analysis"
                href="/dashboard/resume"
                color="blue"
              />
              <QuickActionCard
                icon={BarChart3}
                title="Analyze Resume"
                description="Check ATS compatibility"
                href="/dashboard/resume"
                color="emerald"
              />
              <QuickActionCard
                icon={MessageSquare}
                title="Practice Interview"
                description="AI-powered mock interviews"
                href="/dashboard/interview"
                color="purple"
              />
              <QuickActionCard
                icon={TrendingUp}
                title="View Progress"
                description="Track your improvement"
                href="/dashboard/profile"
                color="orange"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>
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
      <div className="group flex items-center gap-4 p-4 rounded-xl border border-border/50 hover:border-border hover:shadow-sm transition-all cursor-pointer">
        <div className={cn(
          'h-12 w-12 rounded-lg flex items-center justify-center transition-colors',
          colorClasses[color]
        )}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm">{title}</h3>
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
