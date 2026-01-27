'use client';

/**
 * Interview Practice Page
 * 
 * Simple text-based interview practice with AI-generated questions
 */

import { useState, useEffect } from 'react';
import { interviewApi, Interview, InterviewQuestion } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  MessageSquare,
  Play,
  Loader2,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Clock,
  Target,
  Sparkles,
  RefreshCw,
  Award,
} from 'lucide-react';

type Difficulty = 'easy' | 'medium' | 'hard';

export default function InterviewPage() {
  const { user } = useAuth();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [activeInterview, setActiveInterview] = useState<Interview | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
    if (!targetRole || targetRole.length < 3) {
      toast.error('Please enter a valid target role');
      return;
    }

    setIsCreating(true);
    try {
      const response = await interviewApi.create({ targetRole, difficulty });
      const newInterview = response.data.data.interview;
      setInterviews((prev) => [newInterview, ...prev]);
      setActiveInterview(newInterview);
      setCurrentQuestionIndex(0);
      setAnswer('');
      toast.success('Interview session created!');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to create interview';
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!activeInterview || !answer.trim()) {
      toast.error('Please enter your answer');
      return;
    }

    const currentQuestion = activeInterview.questions[currentQuestionIndex];
    setIsSubmitting(true);

    try {
      const response = await interviewApi.submitAnswer(
        activeInterview._id,
        currentQuestion._id,
        answer
      );
      
      // Update the question with the response
      const updatedQuestion = response.data.data.question;
      setActiveInterview((prev) => {
        if (!prev) return prev;
        const updatedQuestions = [...prev.questions];
        updatedQuestions[currentQuestionIndex] = {
          ...updatedQuestions[currentQuestionIndex],
          userAnswer: answer,
          score: updatedQuestion.score,
          feedback: updatedQuestion.feedback,
        };
        return { ...prev, questions: updatedQuestions };
      });

      toast.success('Answer submitted!');
      
      // Move to next question or finish
      if (currentQuestionIndex < activeInterview.questions.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1);
        setAnswer('');
      }
    } catch (error: any) {
      toast.error('Failed to submit answer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteInterview = async () => {
    if (!activeInterview) return;

    try {
      const response = await interviewApi.complete(activeInterview._id);
      const completedInterview = response.data.data.interview;
      setActiveInterview(completedInterview);
      setInterviews((prev) =>
        prev.map((i) => (i._id === completedInterview._id ? completedInterview : i))
      );
      toast.success('Interview completed!');
    } catch (error: any) {
      toast.error('Failed to complete interview');
    }
  };

  const currentQuestion = activeInterview?.questions[currentQuestionIndex];
  const progress = activeInterview
    ? ((currentQuestionIndex + 1) / activeInterview.questions.length) * 100
    : 0;
  const answeredCount = activeInterview?.questions.filter((q) => q.userAnswer).length || 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Interview Practice</h1>
        <p className="text-muted-foreground mt-1">
          Practice with AI-generated questions for your target role
        </p>
      </div>

      {/* Active Interview or Create New */}
      {!activeInterview ? (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Create New Interview */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Start New Interview</CardTitle>
              <CardDescription>
                Practice interview questions for your target role
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="targetRole">Target Role</Label>
                <Input
                  id="targetRole"
                  placeholder="e.g., Frontend Developer"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Difficulty</Label>
                <div className="flex gap-2">
                  {(['easy', 'medium', 'hard'] as Difficulty[]).map((level) => (
                    <Button
                      key={level}
                      variant={difficulty === level ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setDifficulty(level)}
                      className="flex-1 capitalize"
                    >
                      {level}
                    </Button>
                  ))}
                </div>
              </div>
              <Button
                onClick={handleCreateInterview}
                disabled={isCreating || !targetRole}
                className="w-full gap-2"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
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

          {/* Previous Interviews */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Previous Interviews</CardTitle>
              <CardDescription>Continue or review past interview sessions</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : interviews.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No interview sessions yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Start your first practice interview!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {interviews.map((interview) => (
                    <div
                      key={interview._id}
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                          <Target className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <p className="font-medium">{interview.targetRole}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {new Date(interview.createdAt).toLocaleDateString()}
                            <Badge variant="outline" className="text-xs capitalize">
                              {interview.difficulty}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {interview.overallScore !== undefined && (
                          <Badge variant={interview.overallScore >= 70 ? 'default' : 'secondary'}>
                            {Math.round(interview.overallScore)}%
                          </Badge>
                        )}
                        <Badge
                          variant={
                            interview.status === 'completed'
                              ? 'default'
                              : interview.status === 'in_progress'
                              ? 'secondary'
                              : 'outline'
                          }
                          className="capitalize"
                        >
                          {interview.status.replace('_', ' ')}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setActiveInterview(interview);
                            setCurrentQuestionIndex(0);
                            setAnswer('');
                          }}
                        >
                          {interview.status === 'completed' ? 'Review' : 'Continue'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Active Interview Session */
        <div className="space-y-6">
          {/* Progress Header */}
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-4">
                  <Badge variant="outline" className="capitalize">
                    {activeInterview.difficulty}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {activeInterview.targetRole}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Question {currentQuestionIndex + 1} of {activeInterview.questions.length}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveInterview(null)}
                  >
                    Exit
                  </Button>
                </div>
              </div>
              <Progress value={progress} className="h-2" />
            </CardContent>
          </Card>

          {/* Question & Answer */}
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Badge>{currentQuestion?.category || 'General'}</Badge>
                </div>
                <CardTitle className="text-xl mt-2">
                  {currentQuestion?.questionText}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {activeInterview.status !== 'completed' && !currentQuestion?.userAnswer ? (
                  <>
                    <Textarea
                      placeholder="Type your answer here... Be specific and provide examples from your experience."
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      className="min-h-[200px] resize-none"
                    />
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        {answer.length} characters
                        {answer.length < 50 && answer.length > 0 && (
                          <span className="text-amber-500 ml-2">
                            (try to write at least 50 characters)
                          </span>
                        )}
                      </p>
                      <Button
                        onClick={handleSubmitAnswer}
                        disabled={isSubmitting || !answer.trim()}
                        className="gap-2"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4" />
                            Submit Answer
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                ) : (
                  /* Show Answer & Feedback */
                  <div className="space-y-4">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <Label className="text-sm text-muted-foreground">Your Answer</Label>
                      <p className="mt-2">{currentQuestion?.userAnswer || 'No answer provided'}</p>
                    </div>
                    {currentQuestion?.feedback && (
                      <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="h-4 w-4 text-blue-600" />
                          <Label className="text-sm text-blue-800 dark:text-blue-200">
                            AI Feedback
                          </Label>
                          {currentQuestion.score !== undefined && (
                            <Badge className="ml-auto">
                              {Math.round(currentQuestion.score)}%
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          {currentQuestion.feedback}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Navigation & Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Questions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {activeInterview.questions.map((q, index) => (
                    <Button
                      key={q._id}
                      variant={index === currentQuestionIndex ? 'default' : 'outline'}
                      size="sm"
                      className="w-full justify-start gap-2"
                      onClick={() => {
                        setCurrentQuestionIndex(index);
                        setAnswer('');
                      }}
                    >
                      <span className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-xs">
                        {index + 1}
                      </span>
                      <span className="truncate flex-1 text-left">
                        {q.category}
                      </span>
                      {q.userAnswer && (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      )}
                    </Button>
                  ))}
                </div>

                {/* Navigation Buttons */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentQuestionIndex === 0}
                    onClick={() => {
                      setCurrentQuestionIndex((prev) => prev - 1);
                      setAnswer('');
                    }}
                    className="flex-1"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentQuestionIndex === activeInterview.questions.length - 1}
                    onClick={() => {
                      setCurrentQuestionIndex((prev) => prev + 1);
                      setAnswer('');
                    }}
                    className="flex-1"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>

                {/* Complete Interview */}
                {answeredCount === activeInterview.questions.length &&
                  activeInterview.status !== 'completed' && (
                    <Button onClick={handleCompleteInterview} className="w-full gap-2">
                      <Award className="h-4 w-4" />
                      Complete Interview
                    </Button>
                  )}

                {activeInterview.status === 'completed' && activeInterview.overallScore !== undefined && (
                  <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-900 text-center">
                    <Award className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="font-medium text-green-800 dark:text-green-200">
                      Overall Score
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      {Math.round(activeInterview.overallScore)}%
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
