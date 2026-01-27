'use client';

/**
 * Main Dashboard Page
 * 
 * Shows overview with ATS score, recent activity, and quick actions
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { resumeApi, Resume } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScoreGauge } from '@/components/ScoreGauge';
import { KeywordList } from '@/components/KeywordList';
import {
  FileText,
  Upload,
  MessageSquare,
  ArrowRight,
  Clock,
  TrendingUp,
  Sparkles,
  Target,
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [latestAnalyzedResume, setLatestAnalyzedResume] = useState<Resume | null>(null);

  useEffect(() => {
    const fetchResumes = async () => {
      try {
        const response = await resumeApi.getAll();
        const fetchedResumes = response.data.data.resumes || [];
        setResumes(fetchedResumes);
        
        // Find the latest analyzed resume
        const analyzed = fetchedResumes.find((r: Resume) => r.status === 'analyzed' && r.atsScore);
        setLatestAnalyzedResume(analyzed || null);
      } catch (error) {
        console.error('Failed to fetch resumes:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResumes();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            {getGreeting()}, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Here&apos;s your career progress overview
          </p>
        </div>
        <Link href="/dashboard/resume">
          <Button className="gap-2">
            <Upload className="h-4 w-4" />
            Analyze New Resume
          </Button>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Resumes Uploaded
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resumes.length}</div>
            <p className="text-xs text-muted-foreground">
              {resumes.filter(r => r.status === 'analyzed').length} analyzed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Latest ATS Score
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {latestAnalyzedResume?.atsScore 
                ? `${Math.round(latestAnalyzedResume.atsScore)}%`
                : '--'}
            </div>
            <p className="text-xs text-muted-foreground">
              {latestAnalyzedResume ? 'Last analysis' : 'No analysis yet'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Profile Complete
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user?.profileCompleteness || 30}%</div>
            <Progress value={user?.profileCompleteness || 30} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Target Role
            </CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold truncate">
              {user?.targetRole || 'Not set'}
            </div>
            <Link href="/dashboard/profile" className="text-xs text-primary hover:underline">
              {user?.targetRole ? 'Update' : 'Set target role'}
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* ATS Score Display */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Your ATS Score
            </CardTitle>
            <CardDescription>
              How well your resume matches job requirements
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center py-6">
            {latestAnalyzedResume?.atsScore ? (
              <ScoreGauge score={latestAnalyzedResume.atsScore} size="lg" />
            ) : (
              <div className="text-center py-8">
                <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-10 w-10 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground mb-4">No resume analyzed yet</p>
                <Link href="/dashboard/resume">
                  <Button variant="outline" size="sm">
                    Upload & Analyze
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Keywords Analysis */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Keyword Analysis</CardTitle>
            <CardDescription>
              Keywords found in your resume vs. job requirements
            </CardDescription>
          </CardHeader>
          <CardContent>
            {latestAnalyzedResume?.skills?.length || latestAnalyzedResume?.missingKeywords?.length ? (
              <div className="grid gap-6 md:grid-cols-2">
                <KeywordList
                  keywords={latestAnalyzedResume?.skills || []}
                  type="matched"
                  maxDisplay={8}
                />
                <KeywordList
                  keywords={latestAnalyzedResume?.missingKeywords || []}
                  type="missing"
                  maxDisplay={8}
                />
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  Analyze a resume to see keyword insights
                </p>
                <Link href="/dashboard/resume">
                  <Button variant="outline">Get Started</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/dashboard/resume">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardHeader>
              <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-2">
                <Upload className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-lg">Upload Resume</CardTitle>
              <CardDescription>
                Upload your resume and analyze it against job descriptions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-primary">
                Get started <ArrowRight className="h-4 w-4 ml-1" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/interview">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardHeader>
              <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-2">
                <MessageSquare className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <CardTitle className="text-lg">Practice Interview</CardTitle>
              <CardDescription>
                Practice with AI-generated questions for your target role
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-primary">
                Start practice <ArrowRight className="h-4 w-4 ml-1" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/profile">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardHeader>
              <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-2">
                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-lg">Complete Profile</CardTitle>
              <CardDescription>
                Add your career goals to get personalized recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-primary">
                Update profile <ArrowRight className="h-4 w-4 ml-1" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Resumes */}
      {resumes.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Resumes</CardTitle>
              <CardDescription>Your uploaded resume history</CardDescription>
            </div>
            <Link href="/dashboard/resume">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {resumes.slice(0, 3).map((resume) => (
                <div
                  key={resume._id}
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{resume.originalFilename}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(resume.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {resume.atsScore && (
                      <Badge variant={resume.atsScore >= 70 ? 'default' : 'secondary'}>
                        {Math.round(resume.atsScore)}% ATS
                      </Badge>
                    )}
                    <Badge
                      variant={
                        resume.status === 'analyzed'
                          ? 'default'
                          : resume.status === 'error'
                          ? 'destructive'
                          : 'secondary'
                      }
                    >
                      {resume.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
