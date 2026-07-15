'use client';

/**
 * Job Match Intelligence Page
 *
 * Premium dashboard for analyzing job descriptions against user profile:
 * - JD input (paste text or upload PDF)
 * - Overall match score with animated gauge
 * - Category breakdown (Skills, Experience, Tools, Education)
 * - Gap analysis with matched/missing skills
 * - Hiring probability assessment
 * - Improvement simulator with projected impacts
 * - Interview prediction with topics and questions
 * - Analysis history sidebar
 */

import { useState, useCallback, useEffect } from 'react';
import {
  jobMatchApi,
  resumeApi,
  JobMatch,
  Resume as ResumeType,
} from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScoreGauge } from '@/components/ScoreGauge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Upload,
  Loader2,
  Target,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  BrainCircuit,
  Lightbulb,
  Shield,
  Zap,
  BookOpen,
  Clock,
  Building2,
  FileText,
  Trash2,
  ArrowUpRight,
  GraduationCap,
  Briefcase,
  Wrench,
  BarChart3,
} from 'lucide-react';

// ── Helper: Color by score ───────────────────────────────────────────────────

const getScoreColor = (score: number) => {
  if (score >= 70) return 'text-emerald-500';
  if (score >= 40) return 'text-amber-500';
  return 'text-red-500';
};

const getScoreBg = (score: number) => {
  if (score >= 70) return 'bg-emerald-500/10 border-emerald-500/30';
  if (score >= 40) return 'bg-amber-500/10 border-amber-500/30';
  return 'bg-red-500/10 border-red-500/30';
};

const getHiringColor = (level: string) => {
  if (level === 'high') return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
  if (level === 'medium') return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30';
  return 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30';
};

const getImportanceColor = (imp: string) => {
  if (imp === 'critical') return 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30';
  if (imp === 'important') return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30';
  return 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30';
};

const getDifficultyColor = (diff: string) => {
  if (diff === 'hard') return 'bg-red-500/10 text-red-600 dark:text-red-400';
  if (diff === 'medium') return 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
  return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
};

const getCategoryColor = (cat: string) => {
  if (cat === 'technical') return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
  if (cat === 'behavioral') return 'bg-purple-500/10 text-purple-600 dark:text-purple-400';
  if (cat === 'system_design') return 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400';
  return 'bg-orange-500/10 text-orange-600 dark:text-orange-400';
};

// ── Category Icons ───────────────────────────────────────────────────────────

const categoryIcons: Record<string, typeof Sparkles> = {
  skills: Sparkles,
  experience: Briefcase,
  tools: Wrench,
  education: GraduationCap,
};

const categoryLabels: Record<string, string> = {
  skills: 'Skills Match',
  experience: 'Experience',
  tools: 'Tools & Tech',
  education: 'Education',
};

// ═══════════════════════════════════════════════════════════════════════════════
// Main Page Component
// ═══════════════════════════════════════════════════════════════════════════════

export default function JobMatchPage() {
  // ── State ──
  const [jobDescription, setJobDescription] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  const [resumes, setResumes] = useState<ResumeType[]>([]);
  const [isLoadingResumes, setIsLoadingResumes] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<JobMatch | null>(null);
  const [history, setHistory] = useState<JobMatch[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    gap: true,
    hiring: true,
    improvement: true,
    interview: false,
  });

  // ── Fetch initial data ──
  useEffect(() => {
    fetchResumes();
    fetchHistory();
  }, []);

  const fetchResumes = async () => {
    try {
      const response = await resumeApi.getAll();
      const data = response.data.data.resumes || [];
      setResumes(data);
      if (data.length > 0) setSelectedResumeId(data[0]._id);
    } catch (error) {
      console.error('Failed to fetch resumes:', error);
    } finally {
      setIsLoadingResumes(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await jobMatchApi.getAll();
      setHistory(response.data.data.matches || []);
    } catch (error) {
      console.error('Failed to fetch match history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // ── Handlers ──
  const handleAnalyze = async () => {
    if (!jobDescription || jobDescription.trim().length < 50) {
      toast.error('Please paste a job description (at least 50 characters)');
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await jobMatchApi.analyze({
        jobDescriptionText: jobDescription.trim(),
        resumeId: selectedResumeId || undefined,
        jobTitle: jobTitle.trim() || undefined,
        company: company.trim() || undefined,
      });
      const match = response.data.data.jobMatch;
      setAnalysisResult(match);
      setHistory(prev => [match, ...prev]);
      toast.success('Job match analysis complete!');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Analysis failed';
      toast.error(message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePdfUpload = async (file: File) => {
    if (!file) return;
    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file');
      return;
    }
    setIsAnalyzing(true);
    try {
      const response = await jobMatchApi.analyzeWithPdf(
        file,
        selectedResumeId || undefined,
        jobTitle.trim() || undefined,
        company.trim() || undefined,
      );
      const match = response.data.data.jobMatch;
      setAnalysisResult(match);
      setHistory(prev => [match, ...prev]);
      toast.success('PDF analyzed successfully!');
    } catch (error: any) {
      const message = error.response?.data?.message || 'PDF analysis failed';
      toast.error(message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handlePdfUpload(e.dataTransfer.files[0]);
  }, [selectedResumeId, jobTitle, company]);

  const loadHistoryItem = async (id: string) => {
    try {
      const response = await jobMatchApi.getById(id);
      setAnalysisResult(response.data.data.jobMatch);
    } catch (error) {
      toast.error('Failed to load analysis');
    }
  };

  const deleteHistoryItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await jobMatchApi.delete(id);
      setHistory(prev => prev.filter(h => h._id !== id));
      if (analysisResult?._id === id) setAnalysisResult(null);
      toast.success('Analysis deleted');
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const result = analysisResult;
  const mr = result?.matchResult;
  const ga = result?.gapAnalysis;
  const hp = result?.hiringProbability;
  const sims = result?.improvementSimulations || [];
  const ip = result?.interviewPrediction;

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Target className="h-5 w-5 text-white" />
          </div>
          Job Match Intelligence
        </h1>
        <p className="text-muted-foreground mt-1">
          Compare yourself against job descriptions and discover exactly what&apos;s needed to get hired
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* ═══ Left: Input + Results (3 cols) ═══ */}
        <div className="lg:col-span-3 space-y-6">

          {/* ── Input Section ── */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-violet-500" />
                Job Description
              </CardTitle>
              <CardDescription>
                Paste the job listing or upload a PDF to start your analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Optional fields */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="jm-job-title">Job Title (optional)</Label>
                  <Input
                    id="jm-job-title"
                    placeholder="e.g. Senior Frontend Engineer"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jm-company">Company (optional)</Label>
                  <Input
                    id="jm-company"
                    placeholder="e.g. Google, Stripe"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                  />
                </div>
              </div>

              {/* Resume selector */}
              {resumes.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="jm-resume">Resume to compare</Label>
                  <select
                    id="jm-resume"
                    value={selectedResumeId}
                    onChange={(e) => setSelectedResumeId(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {resumes.map((r) => (
                      <option key={r._id} value={r._id}>
                        {r.originalFilename} {r.atsScore ? `(ATS: ${Math.round(r.atsScore)}%)` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Textarea */}
              <Textarea
                id="jm-description"
                placeholder={"Paste the full job description here...\n\nExample: We are looking for a Senior Software Engineer with 5+ years of experience in React, TypeScript, and Node.js..."}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="min-h-[180px] resize-none"
              />

              {/* PDF Upload Zone */}
              <div
                className={cn(
                  'relative border-2 border-dashed rounded-lg p-6 text-center transition-all',
                  dragActive
                    ? 'border-violet-500 bg-violet-500/5'
                    : 'border-muted-foreground/25 hover:border-violet-500/50'
                )}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => e.target.files?.[0] && handlePdfUpload(e.target.files[0])}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={isAnalyzing}
                />
                <div className="flex flex-col items-center gap-1">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Or drop a <span className="font-medium text-foreground">PDF</span> job description here
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {jobDescription.length} characters
                  {jobDescription.length > 0 && jobDescription.length < 50 && (
                    <span className="text-amber-500 ml-2">(minimum 50 required)</span>
                  )}
                </p>
                <Button
                  onClick={handleAnalyze}
                  disabled={jobDescription.trim().length < 50 || isAnalyzing}
                  className="gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <BrainCircuit className="h-4 w-4" />
                      Analyze Match
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* ═══ RESULTS ═══ */}
          {result && result.status === 'completed' && mr && (
            <>
              {/* ── 1. Overall Match Score ── */}
              <Card className={cn('border', getScoreBg(mr.overallScore))}>
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row items-center gap-8">
                    <ScoreGauge score={mr.overallScore} size="lg" />
                    <div className="flex-1 text-center md:text-left space-y-2">
                      <h2 className="text-2xl font-bold">
                        {result.jobTitle || 'Job'} Match Score
                      </h2>
                      {result.company && (
                        <p className="text-muted-foreground flex items-center gap-1 justify-center md:justify-start">
                          <Building2 className="h-4 w-4" /> {result.company}
                        </p>
                      )}
                      <p className="text-muted-foreground">
                        {mr.overallScore >= 70
                          ? "Strong match! You're well-positioned for this role."
                          : mr.overallScore >= 40
                          ? 'Moderate match. Focus on closing the gaps below.'
                          : 'Significant gaps detected. Use the improvement plan to level up.'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* ── 2. Category Breakdown ── */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {(['skills', 'experience', 'tools', 'education'] as const).map((cat) => {
                  const score = mr.categoryScores[cat];
                  const Icon = categoryIcons[cat];
                  return (
                    <Card key={cat} className="relative overflow-hidden">
                      <div className={cn('absolute top-0 left-0 h-1 transition-all duration-700', score >= 70 ? 'bg-emerald-500' : score >= 40 ? 'bg-amber-500' : 'bg-red-500')} style={{ width: `${score}%` }} />
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center', score >= 70 ? 'bg-emerald-500/10' : score >= 40 ? 'bg-amber-500/10' : 'bg-red-500/10')}>
                            <Icon className={cn('h-4 w-4', getScoreColor(score))} />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">{categoryLabels[cat]}</p>
                            <p className={cn('text-xl font-bold', getScoreColor(score))}>{score}%</p>
                          </div>
                        </div>
                        <Progress value={score} className="h-2" />
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* ── 3. Gap Analysis ── */}
              {ga && (
                <Card>
                  <CardHeader className="cursor-pointer" onClick={() => toggleSection('gap')}>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-blue-500" />
                        Gap Analysis
                      </CardTitle>
                      {expandedSections.gap ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </div>
                    <CardDescription>Skills you match vs skills you need</CardDescription>
                  </CardHeader>
                  {expandedSections.gap && (
                    <CardContent className="space-y-6">
                      {/* Matched Skills */}
                      <div>
                        <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          Matched Skills ({mr.matchedSkills.length})
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {mr.matchedSkills.length > 0 ? mr.matchedSkills.map((skill) => (
                            <Badge key={skill} variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                              <CheckCircle2 className="h-3 w-3 mr-1" /> {skill}
                            </Badge>
                          )) : (
                            <p className="text-sm text-muted-foreground">No matched skills detected</p>
                          )}
                        </div>
                      </div>

                      <Separator />

                      {/* Missing Skills */}
                      <div>
                        <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-red-500" />
                          Missing Skills ({ga.missingSkills.length})
                        </h4>
                        {ga.missingSkills.length > 0 ? (
                          <div className="space-y-2">
                            {ga.missingSkills.map((item) => (
                              <div key={item.skill} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                                <div className="flex items-center gap-3">
                                  <XCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                                  <span className="text-sm font-medium">{item.skill}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {item.estimatedLearningTime && (
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Clock className="h-3 w-3" /> {item.estimatedLearningTime}
                                    </span>
                                  )}
                                  <Badge variant="outline" className={cn('text-xs', getImportanceColor(item.importance))}>
                                    {item.importance.replace('_', ' ')}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No missing skills! Great match.</p>
                        )}
                      </div>

                      {/* Missing Tools */}
                      {mr.missingTools.length > 0 && (
                        <>
                          <Separator />
                          <div>
                            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                              <Wrench className="h-4 w-4 text-amber-500" />
                              Missing Tools ({mr.missingTools.length})
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {mr.missingTools.map((tool) => (
                                <Badge key={tool} variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30">
                                  {tool}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </>
                      )}

                      {/* Experience & Interview Gaps */}
                      {(ga.missingExperience.length > 0 || ga.missingInterviewPrep.length > 0) && (
                        <>
                          <Separator />
                          <div className="grid gap-4 sm:grid-cols-2">
                            {ga.missingExperience.length > 0 && (
                              <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900">
                                <h4 className="text-sm font-medium mb-2 text-orange-800 dark:text-orange-200 flex items-center gap-2">
                                  <Briefcase className="h-4 w-4" /> Experience Gaps
                                </h4>
                                <ul className="space-y-1">
                                  {ga.missingExperience.map((exp, i) => (
                                    <li key={i} className="text-xs text-orange-700 dark:text-orange-300">• {exp}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {ga.missingInterviewPrep.length > 0 && (
                              <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900">
                                <h4 className="text-sm font-medium mb-2 text-purple-800 dark:text-purple-200 flex items-center gap-2">
                                  <BookOpen className="h-4 w-4" /> Interview Prep Needed
                                </h4>
                                <ul className="space-y-1">
                                  {ga.missingInterviewPrep.map((prep, i) => (
                                    <li key={i} className="text-xs text-purple-700 dark:text-purple-300">• {prep}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </CardContent>
                  )}
                </Card>
              )}

              {/* ── 4. Hiring Probability ── */}
              {hp && (
                <Card>
                  <CardHeader className="cursor-pointer" onClick={() => toggleSection('hiring')}>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Shield className="h-5 w-5 text-violet-500" />
                        Hiring Probability
                      </CardTitle>
                      {expandedSections.hiring ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </div>
                  </CardHeader>
                  {expandedSections.hiring && (
                    <CardContent className="space-y-5">
                      <div className="flex flex-col sm:flex-row items-center gap-6">
                        {/* Level Badge */}
                        <div className={cn('px-6 py-4 rounded-xl border-2 text-center min-w-[140px]', getHiringColor(hp.level))}>
                          <p className="text-3xl font-bold capitalize">{hp.level}</p>
                          <p className="text-sm opacity-80">{hp.percentage}% chance</p>
                        </div>
                        {/* Probability bar */}
                        <div className="flex-1 w-full">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted-foreground">Estimated Probability</span>
                            <span className="text-sm font-medium">{hp.percentage}%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                            <div
                              className={cn('h-full rounded-full transition-all duration-1000',
                                hp.level === 'high' ? 'bg-gradient-to-r from-emerald-500 to-green-400' :
                                hp.level === 'medium' ? 'bg-gradient-to-r from-amber-500 to-yellow-400' :
                                'bg-gradient-to-r from-red-500 to-rose-400'
                              )}
                              style={{ width: `${hp.percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Reasoning */}
                      {hp.reasoning.length > 0 && (
                        <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900">
                          <h4 className="text-sm font-medium mb-2 text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" /> Positive Signals
                          </h4>
                          <ul className="space-y-1">
                            {hp.reasoning.map((r, i) => (
                              <li key={i} className="text-xs text-emerald-700 dark:text-emerald-300">✓ {r}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Top Blockers */}
                      {hp.topBlockers.length > 0 && hp.topBlockers[0] !== 'No major blockers identified' && (
                        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
                          <h4 className="text-sm font-medium mb-2 text-red-800 dark:text-red-200 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" /> Top Blockers
                          </h4>
                          <ul className="space-y-1">
                            {hp.topBlockers.map((b, i) => (
                              <li key={i} className="text-xs text-red-700 dark:text-red-300">⚠ {b}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              )}

              {/* ── 5. Improvement Simulator ── */}
              {sims.length > 0 && (
                <Card>
                  <CardHeader className="cursor-pointer" onClick={() => toggleSection('improvement')}>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-emerald-500" />
                        Improvement Simulator
                      </CardTitle>
                      {expandedSections.improvement ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </div>
                    <CardDescription>What happens if you close each gap?</CardDescription>
                  </CardHeader>
                  {expandedSections.improvement && (
                    <CardContent>
                      <div className="space-y-3">
                        {sims.map((sim, i) => (
                          <div key={i} className="p-4 rounded-lg border bg-card hover:border-emerald-500/30 transition-colors">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <Zap className="h-4 w-4 text-amber-500 flex-shrink-0" />
                                <span className="text-sm font-medium truncate">{sim.action}</span>
                              </div>
                              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 ml-2 flex-shrink-0">
                                <ArrowUpRight className="h-3 w-3 mr-1" />
                                +{sim.impact}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-muted-foreground w-8">{sim.currentScore}</span>
                              <div className="flex-1 relative h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="absolute h-full bg-muted-foreground/30 rounded-full"
                                  style={{ width: `${sim.currentScore}%` }}
                                />
                                <div
                                  className="absolute h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full transition-all duration-700"
                                  style={{ width: `${sim.projectedScore}%` }}
                                />
                              </div>
                              <span className="text-xs font-medium text-emerald-500 w-8">{sim.projectedScore}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              )}

              {/* ── 6. Interview Prediction ── */}
              {ip && (ip.likelyTopics.length > 0 || ip.predictedQuestions.length > 0) && (
                <Card>
                  <CardHeader className="cursor-pointer" onClick={() => toggleSection('interview')}>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-amber-500" />
                        Interview Prediction
                      </CardTitle>
                      {expandedSections.interview ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </div>
                    <CardDescription>Likely questions and topics based on this job</CardDescription>
                  </CardHeader>
                  {expandedSections.interview && (
                    <CardContent className="space-y-6">
                      {/* Likely Topics */}
                      {ip.likelyTopics.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-3">Likely Topics</h4>
                          <div className="flex flex-wrap gap-2">
                            {ip.likelyTopics.map((topic) => (
                              <Badge key={topic} variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30">
                                {topic}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Predicted Questions */}
                      {ip.predictedQuestions.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-3">Predicted Questions</h4>
                          <div className="space-y-2">
                            {ip.predictedQuestions.map((q, i) => (
                              <div key={i} className="p-3 rounded-lg border bg-card">
                                <p className="text-sm mb-2">{q.question}</p>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className={cn('text-xs', getCategoryColor(q.category))}>
                                    {q.category.replace('_', ' ')}
                                  </Badge>
                                  <Badge variant="outline" className={cn('text-xs', getDifficultyColor(q.difficulty))}>
                                    {q.difficulty}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Preparation Tips */}
                      {ip.preparationTips.length > 0 && (
                        <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
                          <h4 className="text-sm font-medium mb-2 text-amber-800 dark:text-amber-200 flex items-center gap-2">
                            <BookOpen className="h-4 w-4" /> Preparation Tips
                          </h4>
                          <ul className="space-y-1">
                            {ip.preparationTips.map((tip, i) => (
                              <li key={i} className="text-xs text-amber-700 dark:text-amber-300">💡 {tip}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              )}
            </>
          )}

          {/* Empty State (no result yet) */}
          {!result && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 flex items-center justify-center mb-4">
                  <BrainCircuit className="h-10 w-10 text-violet-500/70" />
                </div>
                <h3 className="text-lg font-medium mb-2">Ready to Analyze</h3>
                <p className="text-muted-foreground text-center max-w-md text-sm">
                  Paste a job description above and click &quot;Analyze Match&quot; to see your compatibility score,
                  skill gaps, hiring probability, and personalized improvement plan.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ═══ Right: History Sidebar (1 col) ═══ */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Analysis History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : history.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">
                  No analyses yet. Run your first match above.
                </p>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {history.map((item) => (
                    <div
                      key={item._id}
                      onClick={() => loadHistoryItem(item._id)}
                      className={cn(
                        'p-3 rounded-lg border cursor-pointer transition-all hover:border-violet-500/50',
                        analysisResult?._id === item._id
                          ? 'border-violet-500 bg-violet-500/5'
                          : 'hover:bg-muted/50'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">
                            {item.jobTitle || 'Untitled'}
                          </p>
                          {item.company && (
                            <p className="text-xs text-muted-foreground truncate">{item.company}</p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              variant="outline"
                              className={cn('text-xs', getScoreBg(item.matchResult?.overallScore || 0))}
                            >
                              {item.matchResult?.overallScore || 0}%
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(item.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 flex-shrink-0"
                          onClick={(e) => deleteHistoryItem(item._id, e)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
