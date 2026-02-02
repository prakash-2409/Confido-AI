'use client';

/**
 * Interview Hub Page
 * 
 * Features:
 * - Start new interview sessions
 * - View interview history
 * - Quick access to in-progress interviews
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { interviewApi, Interview, getErrorMessage } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  MessageSquare,
  Play,
  Loader2,
  Clock,
  Target,
  Sparkles,
  Award,
  ChevronRight,
  TrendingUp,
  BarChart3,
  CheckCircle2,
  AlertCircle,
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

type Difficulty = 'easy' | 'medium' | 'hard';

const difficultyConfig = {
  easy: { label: 'Easy', color: 'border-green-200 bg-green-50 text-green-700', description: 'Great for beginners' },
  medium: { label: 'Medium', color: 'border-yellow-200 bg-yellow-50 text-yellow-700', description: 'Standard interview level' },
  hard: { label: 'Hard', color: 'border-red-200 bg-red-50 text-red-700', description: 'Senior/leadership positions' },
};

export default function InterviewHubPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  
  // New interview form
  const [targetRole, setTargetRole] = useState(user?.targetRole || '');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    try {
      const response = await interviewApi.getAll();
      setInterviews(response.data.data.interviews || []);
    } catch (error) {
      console.error('Failed to fetch interviews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateInterview = async () => {
    if (!targetRole || targetRole.trim().length < 3) {
      toast.error('Please enter a valid target role (at least 3 characters)');
      return;
    }

    setIsCreating(true);
    try {
      const response = await interviewApi.create({ targetRole: targetRole.trim(), difficulty });
      const newInterview = response.data.data.interview;
      toast.success('Interview session created! Redirecting...');
      router.push(`/interview/${newInterview._id}`);
    } catch (error) {
      const message = getErrorMessage(error);
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  };

  // Calculate stats
  const completedInterviews = interviews.filter(i => i.status === 'completed');
  const inProgressInterviews = interviews.filter(i => i.status === 'in_progress');
  const averageScore = completedInterviews.length > 0
    ? Math.round(completedInterviews.reduce((acc, i) => acc + (i.overallScore || 0), 0) / completedInterviews.length)
    : null;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold">Interview Practice</h1>
        <p className="text-muted-foreground mt-1">
          Practice with AI-generated questions tailored to your target role
        </p>
      </motion.div>

      {/* Stats Overview */}
      <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Sessions
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{interviews.length}</div>
            <p className="text-xs text-muted-foreground">
              {inProgressInterviews.length} in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedInterviews.length}</div>
            <p className="text-xs text-muted-foreground">
              Interview sessions finished
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Score
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {averageScore !== null ? `${averageScore}%` : '--'}
            </div>
            <p className="text-xs text-muted-foreground">
              {averageScore !== null 
                ? averageScore >= 70 ? 'Great performance!' : 'Keep practicing!'
                : 'Complete an interview to see'}
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Create New Interview */}
        <motion.div variants={itemVariants}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Start New Interview
              </CardTitle>
              <CardDescription>
                Get personalized questions based on your target role
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="targetRole">Target Role</Label>
                <Input
                  id="targetRole"
                  placeholder="e.g., Senior Frontend Developer"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  disabled={isCreating}
                />
                <p className="text-xs text-muted-foreground">
                  Be specific for better questions
                </p>
              </div>

              <div className="space-y-3">
                <Label>Difficulty Level</Label>
                <div className="grid gap-2">
                  {(Object.entries(difficultyConfig) as [Difficulty, typeof difficultyConfig.easy][]).map(([level, config]) => (
                    <button
                      key={level}
                      onClick={() => setDifficulty(level)}
                      disabled={isCreating}
                      className={cn(
                        'flex items-center justify-between p-3 rounded-lg border-2 transition-all text-left',
                        difficulty === level 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-muted-foreground/30'
                      )}
                    >
                      <div>
                        <div className="font-medium text-sm">{config.label}</div>
                        <div className="text-xs text-muted-foreground">{config.description}</div>
                      </div>
                      <Badge className={cn('text-xs', config.color)}>
                        {config.label}
                      </Badge>
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleCreateInterview}
                disabled={isCreating || !targetRole.trim()}
                className="w-full gap-2"
                size="lg"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating Interview...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Start Interview
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Interview History */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Interview History</CardTitle>
              <CardDescription>
                Continue sessions or review past performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : interviews.length === 0 ? (
                <div className="text-center py-12">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold mb-2">No Interview Sessions Yet</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    Start your first mock interview to practice and improve your skills.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* In Progress Section */}
                  {inProgressInterviews.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                        In Progress
                      </h4>
                      {inProgressInterviews.map((interview) => (
                        <InterviewCard 
                          key={interview._id} 
                          interview={interview} 
                          highlight 
                        />
                      ))}
                    </div>
                  )}

                  {/* Completed Section */}
                  {completedInterviews.length > 0 && (
                    <div>
                      {inProgressInterviews.length > 0 && (
                        <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          Completed
                        </h4>
                      )}
                      {completedInterviews.slice(0, 5).map((interview) => (
                        <InterviewCard 
                          key={interview._id} 
                          interview={interview} 
                        />
                      ))}
                      
                      {completedInterviews.length > 5 && (
                        <p className="text-center text-sm text-muted-foreground mt-4">
                          And {completedInterviews.length - 5} more completed sessions
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Tips Section */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Interview Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="font-medium mb-2">Use the STAR Method</h4>
                <p className="text-sm text-muted-foreground">
                  Structure behavioral answers with Situation, Task, Action, and Result.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="font-medium mb-2">Be Specific</h4>
                <p className="text-sm text-muted-foreground">
                  Provide concrete examples and quantify your achievements when possible.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="font-medium mb-2">Practice Regularly</h4>
                <p className="text-sm text-muted-foreground">
                  Consistent practice builds confidence and improves your delivery.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

// Interview Card Component
function InterviewCard({ interview, highlight = false }: { interview: Interview; highlight?: boolean }) {
  const router = useRouter();
  const isCompleted = interview.status === 'completed';
  
  const handleClick = () => {
    if (isCompleted) {
      router.push(`/interview/${interview._id}/summary`);
    } else {
      router.push(`/interview/${interview._id}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        'flex items-center justify-between p-4 rounded-lg border transition-all cursor-pointer mb-2',
        highlight 
          ? 'border-yellow-200 bg-yellow-50/50 hover:bg-yellow-50' 
          : 'hover:bg-muted/50'
      )}
      onClick={handleClick}
    >
      <div className="flex items-center gap-4">
        <div className={cn(
          'h-10 w-10 rounded-lg flex items-center justify-center',
          isCompleted ? 'bg-emerald-100 text-emerald-600' : 'bg-yellow-100 text-yellow-600'
        )}>
          {isCompleted ? <Award className="h-5 w-5" /> : <Target className="h-5 w-5" />}
        </div>
        <div>
          <p className="font-medium">{interview.targetRole}</p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{new Date(interview.createdAt).toLocaleDateString()}</span>
            <Badge 
              variant="outline" 
              className={cn(
                'text-xs',
                difficultyConfig[interview.difficulty]?.color
              )}
            >
              {interview.difficulty}
            </Badge>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {isCompleted && interview.overallScore !== undefined && (
          <Badge className={cn(
            interview.overallScore >= 70 
              ? 'bg-emerald-100 text-emerald-700' 
              : 'bg-orange-100 text-orange-700'
          )}>
            {Math.round(interview.overallScore)}%
          </Badge>
        )}
        <Badge
          variant={isCompleted ? 'secondary' : 'default'}
          className="capitalize"
        >
          {interview.status.replace('_', ' ')}
        </Badge>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </motion.div>
  );
}
