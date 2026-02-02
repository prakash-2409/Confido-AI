'use client';

/**
 * Interview Simulator Page
 * 
 * Step-by-step interview flow with:
 * - Progress indicator
 * - Answer input with character guidance
 * - No skipping questions
 * - Real-time feedback
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { interviewApi, Interview, InterviewQuestion, getErrorMessage } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  MessageSquare,
  Loader2,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Clock,
  Target,
  AlertCircle,
  Send,
  Award,
  ArrowRight,
  Lightbulb,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Character count guidelines
const MIN_ANSWER_LENGTH = 50;
const IDEAL_ANSWER_LENGTH = 200;
const MAX_ANSWER_LENGTH = 1000;

// Animation variants
const questionVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 50 : -50,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 50 : -50,
    opacity: 0,
  }),
};

export default function InterviewSimulatorPage() {
  const params = useParams();
  const router = useRouter();
  const interviewId = params.id as string;

  const [interview, setInterview] = useState<Interview | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [direction, setDirection] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Fetch interview data
  const fetchInterview = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await interviewApi.getById(interviewId);
      const data = response.data.data.interview;
      setInterview(data);

      // Find the first unanswered question
      const firstUnansweredIndex = data.questions.findIndex(
        (q: InterviewQuestion) => !q.userAnswer
      );
      
      if (firstUnansweredIndex !== -1) {
        setCurrentQuestionIndex(firstUnansweredIndex);
      } else if (data.status === 'completed') {
        // All questions answered and completed - redirect to summary
        router.push(`/interview/${interviewId}/summary`);
      }
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [interviewId, router]);

  useEffect(() => {
    if (interviewId) {
      fetchInterview();
    }
  }, [interviewId, fetchInterview]);

  // Current question
  const currentQuestion = interview?.questions[currentQuestionIndex];
  const totalQuestions = interview?.questions.length || 0;
  const answeredCount = interview?.questions.filter(q => q.userAnswer).length || 0;
  const progressPercentage = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  // Check if current question is already answered
  const isCurrentAnswered = !!currentQuestion?.userAnswer;

  // Submit answer
  const handleSubmitAnswer = async () => {
    if (!interview || !currentQuestion || answer.trim().length < MIN_ANSWER_LENGTH) {
      toast.error(`Please provide at least ${MIN_ANSWER_LENGTH} characters`);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await interviewApi.submitAnswer(
        interview._id,
        currentQuestion._id,
        answer.trim()
      );

      // Update local state with the response
      const updatedInterview = response.data.data.interview;
      setInterview(updatedInterview);

      // Show feedback toast if available
      const updatedQuestion = updatedInterview.questions.find(
        (q: InterviewQuestion) => q._id === currentQuestion._id
      );
      if (updatedQuestion?.score !== undefined) {
        toast.success(`Answer submitted! Score: ${updatedQuestion.score}%`);
      } else {
        toast.success('Answer submitted!');
      }

      // Move to next question or complete
      if (currentQuestionIndex < totalQuestions - 1) {
        setDirection(1);
        setCurrentQuestionIndex(prev => prev + 1);
        setAnswer('');
      } else {
        // All questions answered - complete the interview
        await handleCompleteInterview();
      }
    } catch (err) {
      const message = getErrorMessage(err);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Complete interview
  const handleCompleteInterview = async () => {
    if (!interview) return;

    try {
      await interviewApi.complete(interview._id);
      toast.success('Interview completed! Viewing results...');
      router.push(`/interview/${interview._id}/summary`);
    } catch (err) {
      const message = getErrorMessage(err);
      toast.error(message);
    }
  };

  // Navigate to previous question (only for review)
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setDirection(-1);
      setCurrentQuestionIndex(prev => prev - 1);
      const prevQuestion = interview?.questions[currentQuestionIndex - 1];
      setAnswer(prevQuestion?.userAnswer || '');
    }
  };

  // Navigate to next answered question
  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1 && isCurrentAnswered) {
      setDirection(1);
      setCurrentQuestionIndex(prev => prev + 1);
      const nextQuestion = interview?.questions[currentQuestionIndex + 1];
      setAnswer(nextQuestion?.userAnswer || '');
    }
  };

  // Get character count status
  const getCharacterStatus = () => {
    const length = answer.length;
    if (length === 0) return { status: 'empty', color: 'text-muted-foreground' };
    if (length < MIN_ANSWER_LENGTH) return { status: 'short', color: 'text-red-500' };
    if (length < IDEAL_ANSWER_LENGTH) return { status: 'good', color: 'text-yellow-500' };
    if (length <= MAX_ANSWER_LENGTH) return { status: 'ideal', color: 'text-emerald-500' };
    return { status: 'long', color: 'text-orange-500' };
  };

  const charStatus = getCharacterStatus();

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading interview...</p>
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
                <h3 className="font-semibold text-lg">Interview Not Found</h3>
                <p className="text-muted-foreground mt-1">
                  {error || 'Unable to load the interview. It may have been deleted or you may not have access.'}
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

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">{interview.title || 'Interview Session'}</h1>
            <div className="flex items-center gap-3 mt-1">
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
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">
              {currentQuestionIndex + 1}/{totalQuestions}
            </div>
            <p className="text-sm text-muted-foreground">Questions</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{Math.round(progressPercentage)}% Complete</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
      </motion.div>

      {/* Question Card */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentQuestionIndex}
          custom={direction}
          variants={questionVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.3 }}
        >
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">
                      {currentQuestion?.category || 'General'}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      Question {currentQuestionIndex + 1}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl leading-relaxed">
                    {currentQuestion?.questionText}
                  </CardTitle>
                </div>
                {isCurrentAnswered && (
                  <div className="flex items-center gap-2 shrink-0">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    {currentQuestion?.score !== undefined && (
                      <Badge className="bg-emerald-100 text-emerald-700">
                        {currentQuestion.score}%
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Answer Input */}
              <div className="space-y-2">
                <Textarea
                  placeholder="Type your answer here. Be specific and provide examples where possible..."
                  value={isCurrentAnswered ? (currentQuestion?.userAnswer || '') : answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  disabled={isSubmitting || isCurrentAnswered}
                  className={cn(
                    'min-h-[200px] resize-none',
                    isCurrentAnswered && 'bg-muted/50'
                  )}
                  maxLength={MAX_ANSWER_LENGTH}
                />
                
                {/* Character Count & Guidelines */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <span className={charStatus.color}>
                      {answer.length}/{MAX_ANSWER_LENGTH} characters
                    </span>
                    {!isCurrentAnswered && answer.length > 0 && answer.length < MIN_ANSWER_LENGTH && (
                      <span className="text-muted-foreground">
                        (minimum {MIN_ANSWER_LENGTH})
                      </span>
                    )}
                  </div>
                  {!isCurrentAnswered && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Lightbulb className="h-3 w-3" />
                      <span>Aim for {IDEAL_ANSWER_LENGTH}+ characters</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Feedback Display (for answered questions) */}
              {isCurrentAnswered && currentQuestion?.feedback && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-4 rounded-lg bg-muted/50 border"
                >
                  <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    AI Feedback
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {currentQuestion.feedback}
                  </p>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Navigation & Actions */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0 || isSubmitting}
          className="gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        <div className="flex items-center gap-3">
          {!isCurrentAnswered ? (
            <Button
              onClick={handleSubmitAnswer}
              disabled={isSubmitting || answer.trim().length < MIN_ANSWER_LENGTH}
              className="gap-2 min-w-[140px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : currentQuestionIndex === totalQuestions - 1 ? (
                <>
                  <Award className="h-4 w-4" />
                  Finish Interview
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Submit Answer
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={currentQuestionIndex === totalQuestions - 1 ? handleCompleteInterview : handleNext}
              disabled={isSubmitting}
              className="gap-2"
            >
              {currentQuestionIndex === totalQuestions - 1 ? (
                <>
                  <Award className="h-4 w-4" />
                  View Results
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Question Navigation Dots */}
      <div className="flex items-center justify-center gap-2 mt-8">
        {interview.questions.map((q, index) => (
          <button
            key={q._id}
            onClick={() => {
              if (q.userAnswer || index <= currentQuestionIndex) {
                setDirection(index > currentQuestionIndex ? 1 : -1);
                setCurrentQuestionIndex(index);
                setAnswer(q.userAnswer || '');
              }
            }}
            disabled={!q.userAnswer && index > currentQuestionIndex}
            className={cn(
              'w-3 h-3 rounded-full transition-all',
              index === currentQuestionIndex 
                ? 'bg-primary w-6' 
                : q.userAnswer 
                  ? 'bg-emerald-500' 
                  : 'bg-muted hover:bg-muted-foreground/30',
              (!q.userAnswer && index > currentQuestionIndex) && 'cursor-not-allowed opacity-50'
            )}
            title={`Question ${index + 1}${q.userAnswer ? ' (Answered)' : ''}`}
          />
        ))}
      </div>
    </div>
  );
}
