'use client';

/**
 * Interview Summary Page
 * 
 * Features:
 * - Overall score gauge
 * - Category-wise performance charts
 * - Strengths & weaknesses analysis
 * - Personalized recommendations
 */

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { interviewApi, Interview, CategoryScore, getErrorMessage } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScoreGauge } from '@/components/ScoreGauge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Award,
  TrendingUp,
  TrendingDown,
  Target,
  Lightbulb,
  ChevronRight,
  ArrowLeft,
  Download,
  Share2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  MessageSquare,
  RotateCcw,
  Home,
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

// Category colors
const CATEGORY_COLORS: Record<string, string> = {
  'Technical': '#3b82f6',
  'Behavioral': '#8b5cf6',
  'Problem Solving': '#f59e0b',
  'Communication': '#10b981',
  'Leadership': '#ef4444',
  'Teamwork': '#06b6d4',
  'default': '#6b7280',
};

export default function InterviewSummaryPage() {
  const params = useParams();
  const router = useRouter();
  const interviewId = params.id as string;

  const [interview, setInterview] = useState<Interview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch interview data
  useEffect(() => {
    const fetchInterview = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await interviewApi.getById(interviewId);
        const data = response.data.data.interview;
        
        if (data.status !== 'completed') {
          // Interview not completed yet - redirect to simulator
          router.push(`/interview/${interviewId}`);
          return;
        }
        
        setInterview(data);
      } catch (err) {
        const message = getErrorMessage(err);
        setError(message);
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    };

    if (interviewId) {
      fetchInterview();
    }
  }, [interviewId, router]);

  // Calculate category scores if not provided
  const categoryScores = useMemo(() => {
    if (interview?.categoryScores && interview.categoryScores.length > 0) {
      return interview.categoryScores;
    }

    if (!interview?.questions) return [];

    // Group questions by category and calculate average scores
    const categoryMap = new Map<string, { total: number; count: number }>();
    
    interview.questions.forEach(q => {
      const category = q.category || 'General';
      const current = categoryMap.get(category) || { total: 0, count: 0 };
      if (q.score !== undefined) {
        current.total += q.score;
        current.count += 1;
        categoryMap.set(category, current);
      }
    });

    return Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      score: Math.round(data.total / data.count),
      totalQuestions: data.count,
      answeredQuestions: data.count,
    }));
  }, [interview]);

  // Calculate strengths and weaknesses
  const { strengths, weaknesses } = useMemo(() => {
    const sorted = [...categoryScores].sort((a, b) => b.score - a.score);
    return {
      strengths: sorted.filter(c => c.score >= 70).slice(0, 3),
      weaknesses: sorted.filter(c => c.score < 70).slice(-3).reverse(),
    };
  }, [categoryScores]);

  // Generate recommendations
  const recommendations = useMemo(() => {
    if (interview?.recommendations && interview.recommendations.length > 0) {
      return interview.recommendations;
    }

    const recs: string[] = [];
    
    if (weaknesses.length > 0) {
      weaknesses.forEach(w => {
        recs.push(`Focus on improving your ${w.category} skills through practice and study.`);
      });
    }

    const overallScore = interview?.overallScore || 0;
    if (overallScore < 60) {
      recs.push('Consider practicing with more mock interviews to build confidence.');
      recs.push('Review common interview questions for your target role.');
    } else if (overallScore < 80) {
      recs.push('Your performance is good! Focus on providing more specific examples.');
      recs.push('Practice using the STAR method for behavioral questions.');
    } else {
      recs.push('Excellent performance! Keep practicing to maintain your skills.');
      recs.push('Consider mentoring others or tackling more advanced interview scenarios.');
    }

    return recs;
  }, [interview, weaknesses]);

  // Chart data
  const barChartData = categoryScores.map(c => ({
    name: c.category,
    score: c.score,
    color: CATEGORY_COLORS[c.category] || CATEGORY_COLORS.default,
  }));

  const radarChartData = categoryScores.map(c => ({
    subject: c.category,
    score: c.score,
    fullMark: 100,
  }));

  // Get score label
  const getScoreLabel = (score: number) => {
    if (score >= 90) return { label: 'Outstanding', color: 'text-emerald-600' };
    if (score >= 80) return { label: 'Excellent', color: 'text-emerald-600' };
    if (score >= 70) return { label: 'Good', color: 'text-blue-600' };
    if (score >= 60) return { label: 'Fair', color: 'text-yellow-600' };
    if (score >= 50) return { label: 'Needs Improvement', color: 'text-orange-600' };
    return { label: 'Needs Work', color: 'text-red-600' };
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading results...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !interview) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Results Not Found</h3>
                <p className="text-muted-foreground mt-1">
                  {error || 'Unable to load interview results.'}
                </p>
              </div>
              <Button onClick={() => router.push('/dashboard/interview')}>
                Back to Interviews
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const overallScore = interview.overallScore || 0;
  const scoreInfo = getScoreLabel(overallScore);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-6xl mx-auto py-8 px-4 space-y-8"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/interview')}
            className="gap-2 mb-2 -ml-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Interviews
          </Button>
          <h1 className="text-3xl font-bold">Interview Results</h1>
          <div className="flex items-center gap-3 mt-2">
            <Badge variant="secondary">{interview.targetRole}</Badge>
            <Badge 
              variant="outline"
              className={cn(
                interview.difficulty === 'easy' ? 'border-green-200 bg-green-50 text-green-700' :
                interview.difficulty === 'medium' ? 'border-yellow-200 bg-yellow-50 text-yellow-700' :
                'border-red-200 bg-red-50 text-red-700'
              )}
            >
              {interview.difficulty}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {new Date(interview.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/interview">
            <Button variant="outline" className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Practice Again
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Overall Score Card */}
      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
            <CardContent className="py-8">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <ScoreGauge score={overallScore} size="lg" showLabel />
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-2xl font-bold mb-2">
                    Overall Performance: <span className={scoreInfo.color}>{scoreInfo.label}</span>
                  </h2>
                  <p className="text-muted-foreground mb-4 max-w-xl">
                    You answered {interview.questions.length} questions with an average score of {overallScore}%.
                    {overallScore >= 70 
                      ? " Great job! You demonstrated solid interview skills."
                      : " Keep practicing to improve your interview performance."}
                  </p>
                  <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{interview.questions.length}</div>
                      <div className="text-xs text-muted-foreground">Questions</div>
                    </div>
                    <Separator orientation="vertical" className="h-12 hidden sm:block" />
                    <div className="text-center">
                      <div className="text-2xl font-bold text-emerald-600">
                        {interview.questions.filter(q => (q.score || 0) >= 70).length}
                      </div>
                      <div className="text-xs text-muted-foreground">Strong Answers</div>
                    </div>
                    <Separator orientation="vertical" className="h-12 hidden sm:block" />
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {interview.questions.filter(q => (q.score || 0) < 70).length}
                      </div>
                      <div className="text-xs text-muted-foreground">Needs Work</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </div>
        </Card>
      </motion.div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Bar Chart */}
        <motion.div variants={itemVariants}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg">Category Performance</CardTitle>
              <CardDescription>Your scores across different question categories</CardDescription>
            </CardHeader>
            <CardContent>
              {barChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={barChartData} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value) => [`${value}%`, 'Score']}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                      {barChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No category data available
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Radar Chart */}
        <motion.div variants={itemVariants}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg">Skills Overview</CardTitle>
              <CardDescription>Visual representation of your strengths</CardDescription>
            </CardHeader>
            <CardContent>
              {radarChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={radarChartData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Radar
                      name="Score"
                      dataKey="score"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.3}
                    />
                    <Tooltip
                      formatter={(value) => [`${value}%`, 'Score']}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No skills data available
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Strengths & Weaknesses */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Strengths */}
        <motion.div variants={itemVariants}>
          <Card className="h-full border-emerald-200/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
                Strengths
              </CardTitle>
              <CardDescription>Areas where you performed well</CardDescription>
            </CardHeader>
            <CardContent>
              {strengths.length > 0 ? (
                <div className="space-y-3">
                  {strengths.map((s) => (
                    <div
                      key={s.category}
                      className="flex items-center justify-between p-3 rounded-lg bg-emerald-50/50"
                    >
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        <span className="font-medium">{s.category}</span>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-700">
                        {s.score}%
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  Complete more interviews to identify your strengths
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Weaknesses */}
        <motion.div variants={itemVariants}>
          <Card className="h-full border-orange-200/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-orange-600" />
                Areas to Improve
              </CardTitle>
              <CardDescription>Focus on these for better results</CardDescription>
            </CardHeader>
            <CardContent>
              {weaknesses.length > 0 ? (
                <div className="space-y-3">
                  {weaknesses.map((w) => (
                    <div
                      key={w.category}
                      className="flex items-center justify-between p-3 rounded-lg bg-orange-50/50"
                    >
                      <div className="flex items-center gap-3">
                        <Target className="h-5 w-5 text-orange-600" />
                        <span className="font-medium">{w.category}</span>
                      </div>
                      <Badge className="bg-orange-100 text-orange-700">
                        {w.score}%
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  Great job! No significant weaknesses identified
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recommendations */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-600" />
              Personalized Recommendations
            </CardTitle>
            <CardDescription>
              Based on your performance, here&apos;s what we suggest
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {recommendations.map((rec, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-3 p-4 rounded-lg bg-muted/50"
                >
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">{index + 1}</span>
                  </div>
                  <p className="text-sm">{rec}</p>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Question Breakdown */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Question-by-Question Breakdown</CardTitle>
            <CardDescription>Review your answers and feedback</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {interview.questions.map((q, index) => (
                <motion.div
                  key={q._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="border rounded-lg p-4"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {q.category || 'General'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Question {index + 1}
                        </span>
                      </div>
                      <h4 className="font-medium">{q.questionText}</h4>
                    </div>
                    <Badge
                      className={cn(
                        (q.score || 0) >= 70 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : (q.score || 0) >= 50 
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                      )}
                    >
                      {q.score || 0}%
                    </Badge>
                  </div>
                  
                  {q.userAnswer && (
                    <div className="mb-3">
                      <h5 className="text-xs font-medium text-muted-foreground mb-1">Your Answer:</h5>
                      <p className="text-sm bg-muted/50 p-3 rounded-lg">{q.userAnswer}</p>
                    </div>
                  )}
                  
                  {q.feedback && (
                    <div>
                      <h5 className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        AI Feedback:
                      </h5>
                      <p className="text-sm text-muted-foreground">{q.feedback}</p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Action Buttons */}
      <motion.div variants={itemVariants} className="flex justify-center gap-4 pt-4">
        <Link href="/dashboard">
          <Button variant="outline" className="gap-2">
            <Home className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <Link href="/dashboard/interview">
          <Button className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Start New Interview
          </Button>
        </Link>
      </motion.div>
    </motion.div>
  );
}
