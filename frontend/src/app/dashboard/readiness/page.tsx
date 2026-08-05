'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { resumeApi } from '@/lib/api';
import { useQuery, useMutation } from '@tanstack/react-query';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { EmptyState } from '@/components/EmptyState';
import { toast } from 'sonner';
import axios from 'axios';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import {
  GraduationCap,
  UploadCloud,
  FileText,
  Github,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  TrendingUp,
  Award,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
  History,
  FileCode,
  Calendar,
  RefreshCw,
  GitCompare,
  CheckCircle,
  HelpCircle,
  Eye,
  ListChecks,
  Maximize2
} from 'lucide-react';

const TARGET_ROLES = [
  'Software Engineer',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'AI Engineer',
  'ML Engineer',
  'Data Scientist',
  'DevOps Engineer',
  'Cloud Engineer',
  'Cyber Security Engineer'
];

export default function PlacementReadinessPage() {
  const { user } = useAuth();
  const [selectedRole, setSelectedRole] = useState(user?.targetRole || 'Software Engineer');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [pipelineStep, setPipelineStep] = useState(0); // 0: idle, 1-5: stages, 6: done
  const [activeTab, setActiveTab] = useState<'overview' | 'ats' | 'semantic' | 'confidence' | 'history'>('overview');
  
  // Comparative Diff States
  const [compareMode, setCompareMode] = useState(false);
  const [compareOldVer, setCompareOldVer] = useState('1');
  const [compareNewVer, setCompareNewVer] = useState('2');

  // TanStack Query Hooks
  const { data: scoreData, isLoading: scoreLoading, isError: scoreError, refetch: refetchScore } = useQuery({
    queryKey: ['placement-readiness', user?._id],
    queryFn: () => resumeApi.getPlacementScore(user?._id || ''),
    enabled: !!user?._id,
    retry: false
  });

  const { data: gapData, refetch: refetchGap } = useQuery({
    queryKey: ['placement-gap', user?._id],
    queryFn: () => resumeApi.getSkillGap(user?._id || ''),
    enabled: !!user?._id,
    retry: false
  });

  const { data: recsData, refetch: refetchRecs } = useQuery({
    queryKey: ['placement-recs', user?._id],
    queryFn: () => resumeApi.getRecommendations(user?._id || ''),
    enabled: !!user?._id,
    retry: false
  });

  const { data: evidenceData, refetch: refetchEvidence } = useQuery({
    queryKey: ['placement-evidence', user?._id],
    queryFn: () => resumeApi.getEvidence(user?._id || ''),
    enabled: !!user?._id,
    retry: false
  });

  const { data: githubData, refetch: refetchGithub } = useQuery({
    queryKey: ['placement-github', user?._id],
    queryFn: () => resumeApi.getGithubAnalysis(user?._id || ''),
    enabled: !!user?._id,
    retry: false
  });

  const { data: historyData, refetch: refetchHistory } = useQuery({
    queryKey: ['placement-history', user?._id],
    queryFn: () => resumeApi.getHistory(user?._id || ''),
    enabled: !!user?._id,
    retry: false
  });

  const { data: timelineData, refetch: refetchTimeline } = useQuery({
    queryKey: ['placement-timeline', user?._id],
    queryFn: () => resumeApi.getTimelineHistory(),
    enabled: !!user?._id,
    retry: false
  });

  const { data: benchmarkData } = useQuery({
    queryKey: ['placement-benchmark', user?._id],
    queryFn: () => axios.get('/api/v1/benchmark').then(res => res.data),
    enabled: !!user?._id
  });

  const { data: confidenceData } = useQuery({
    queryKey: ['placement-confidence', user?._id],
    queryFn: () => axios.get('/api/v1/confidence').then(res => res.data),
    enabled: !!user?._id
  });

  const { data: semanticData } = useQuery({
    queryKey: ['placement-semantic', user?._id, selectedRole],
    queryFn: () => axios.get(`/api/v1/semantic-match?targetRole=${selectedRole}`).then(res => res.data),
    enabled: !!user?._id
  });

  const { data: atsData } = useQuery({
    queryKey: ['placement-ats-report', user?._id],
    queryFn: () => axios.get('/api/v1/ats/report').then(res => res.data),
    enabled: !!user?._id
  });

  // Resume Diff mutation
  const diffMutation = useMutation({
    mutationFn: (versions: { oldVersion: number; newVersion: number }) =>
      axios.post('/api/v1/resume/diff', versions).then(res => res.data),
    onError: () => {
      toast.error('Failed to compare resume versions.');
    }
  });

  // Run pipeline trigger
  const runPipelineMutation = useMutation({
    mutationFn: (data: { resumeId: string; targetRole: string }) =>
      resumeApi.parse(data.resumeId, data.targetRole),
    onSuccess: () => {
      setPipelineStep(6);
      toast.success('Readiness evaluation pipeline completed!');
      refetchScore();
      refetchGap();
      refetchRecs();
      refetchEvidence();
      refetchGithub();
      refetchHistory();
      refetchTimeline();
      setTimeout(() => setPipelineStep(0), 1500);
    },
    onError: (err: any) => {
      setPipelineStep(0);
      toast.error(err?.response?.data?.message || err.message || 'Pipeline failed.');
    }
  });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'pdf' && ext !== 'docx') {
      toast.error('Only PDF or DOCX format is supported.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Maximum file size is 5MB.');
      return;
    }
    setUploadFile(file);
  };

  const triggerUploadAndParse = async () => {
    if (!uploadFile) return;
    setIsUploading(true);
    setPipelineStep(1);
    setUploadProgress(30);

    try {
      const uploadRes = await resumeApi.upload(uploadFile);
      const resumeId = uploadRes.data.data.resume._id;
      setUploadProgress(100);
      setIsUploading(false);

      setPipelineStep(2);
      setTimeout(() => setPipelineStep(3), 1000);
      setTimeout(() => setPipelineStep(4), 2000);
      setTimeout(() => {
        setPipelineStep(5);
        runPipelineMutation.mutate({ resumeId, targetRole: selectedRole });
      }, 3000);

    } catch (err: any) {
      setIsUploading(false);
      setPipelineStep(0);
      toast.error(err?.response?.data?.message || 'Upload failed.');
    }
  };

  const runDiffComparison = () => {
    diffMutation.mutate({
      oldVersion: parseInt(compareOldVer),
      newVersion: parseInt(compareNewVer)
    });
  };

  if (scoreLoading) {
    return <LoadingState message="Loading advanced intelligence engines..." />;
  }

  const readiness = scoreData?.data?.data;
  const skillsBreakdown = gapData?.data?.data?.skillGap;
  const recommendations = recsData?.data?.data?.recommendations;
  const evidenceList = evidenceData?.data?.data?.evidence || [];
  const githubAnalysis = githubData?.data?.data?.githubAnalysis;
  const historyList = historyData?.data?.data?.history || [];
  const chartScores = timelineData?.data?.data?.scores || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Placement Intelligence Command Center"
        description="Evolve your readiness score with semantic matching, deep ATS analysis, and history timelines"
        icon={GraduationCap}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Actions & Configurations */}
        <div className="space-y-6 lg:col-span-1">
          {/* Resume Upload Box */}
          <Card className="border-border bg-card/60 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <UploadCloud className="h-4 w-4 text-primary" />
                Upload New Version
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={cn(
                  "border-2 border-dashed border-border rounded-lg p-5 text-center cursor-pointer hover:border-primary/50 transition-colors bg-muted/20 select-none",
                  uploadFile && "border-evidence-verified/40 bg-evidence-verified/[0.01]"
                )}
              >
                <input
                  type="file"
                  id="resume-file-selector"
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.docx"
                />
                <label htmlFor="resume-file-selector" className="cursor-pointer space-y-2 block">
                  <div className="h-10 w-10 rounded-full bg-primary/5 mx-auto flex items-center justify-center">
                    <FileText className={cn("h-5 w-5 text-muted-foreground", uploadFile && "text-evidence-verified")} />
                  </div>
                  {uploadFile ? (
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold truncate max-w-[200px] mx-auto">{uploadFile.name}</p>
                      <p className="text-3xs text-muted-foreground">{(uploadFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-semibold">Click to upload or drag & drop</p>
                      <p className="text-3xs text-muted-foreground">PDF or DOCX (Max 5MB)</p>
                    </div>
                  )}
                </label>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="target-role-selector" className="text-[10px] font-bold text-muted-foreground uppercase">Target Role Track</Label>
                <select
                  id="target-role-selector"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full text-xs h-9 bg-background border border-border rounded-md px-2 focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {TARGET_ROLES.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>

              <Button
                disabled={!uploadFile || isUploading || pipelineStep > 0}
                onClick={triggerUploadAndParse}
                className="w-full text-xs h-9"
              >
                {pipelineStep > 0 ? (
                  <span className="flex items-center gap-1 animate-pulse">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    Executing...
                  </span>
                ) : 'Upload & Grade'}
              </Button>
            </CardContent>
          </Card>

          {/* Stepper progress tracker */}
          {pipelineStep > 0 && (
            <Card className="border-border bg-muted/30">
              <CardContent className="p-4 space-y-3">
                <span className="text-3xs font-bold text-muted-foreground uppercase block tracking-wider">Scoring pipeline stepper logs</span>
                <div className="space-y-2">
                  {[
                    { step: 1, label: 'Resume Parser', detail: 'Parsing structured sections' },
                    { step: 2, label: 'GitHub Scraper', detail: 'Calculating repo contributions' },
                    { step: 3, label: 'Semantic Matching', detail: 'Executing TF-IDF vector projections' },
                    { step: 4, label: 'ATS Auditor', detail: 'Analyzing metrics usage and buzzwords' },
                    { step: 5, label: 'Roadmap Generator', detail: 'Computing score priority roadmaps' }
                  ].map((s) => {
                    const active = pipelineStep === s.step;
                    const completed = pipelineStep > s.step;
                    return (
                      <div key={s.step} className="flex items-start gap-2 text-2xs">
                        <div className={cn(
                          "h-3.5 w-3.5 rounded-full border flex items-center justify-center shrink-0 font-bold",
                          completed ? "bg-evidence-verified/25 border-evidence-verified text-evidence-verified" :
                          active ? "bg-primary/20 border-primary text-primary animate-pulse" : "bg-muted border-border text-muted-foreground"
                        )}>
                          {completed ? '✓' : s.step}
                        </div>
                        <div>
                          <span className={cn("font-semibold block", active && "text-primary")}>{s.label}</span>
                          <span className="text-[10px] text-muted-foreground block">{s.detail}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Resume Version Compare Section */}
          {historyList.length >= 2 && (
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-bold flex items-center gap-1.5">
                  <GitCompare className="h-3.5 w-3.5 text-primary" />
                  Compare Resume Versions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground uppercase">Base Ver</Label>
                    <select
                      value={compareOldVer}
                      onChange={(e) => setCompareOldVer(e.target.value)}
                      className="w-full text-xs h-8 bg-background border border-border rounded-md px-1.5"
                    >
                      {historyList.map((h: any) => (
                        <option key={h._id} value={h.version}>Version {h.version}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground uppercase">New Ver</Label>
                    <select
                      value={compareNewVer}
                      onChange={(e) => setCompareNewVer(e.target.value)}
                      className="w-full text-xs h-8 bg-background border border-border rounded-md px-1.5"
                    >
                      {historyList.map((h: any) => (
                        <option key={h._id} value={h.version}>Version {h.version}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <Button
                  onClick={() => {
                    setCompareMode(true);
                    runDiffComparison();
                  }}
                  className="w-full h-8 text-2xs"
                  variant="outline"
                >
                  Run Comparison Diff
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Dynamic Analytics Tabs */}
        <div className="lg:col-span-2 space-y-6">
          {!readiness ? (
            <Card className="border-border h-[450px] flex items-center justify-center bg-card/45">
              <EmptyState
                icon={GraduationCap}
                title="Connect AI Placement Intelligence"
                description="Upload your technical resume above. The platform will automatically execute vector similarity matching, evaluate ATS indices, and generate customized roadmaps."
              />
            </Card>
          ) : (
            <>
              {/* Tab Navigation */}
              <div className="flex border-b border-border gap-2 pb-px overflow-x-auto scrollbar-none">
                {[
                  { id: 'overview', label: 'Dashboard Overview', icon: Layers },
                  { id: 'ats', label: 'ATS Analysis', icon: ListChecks },
                  { id: 'semantic', label: 'Semantic Matching', icon: TrendingUp },
                  { id: 'confidence', label: 'Confidence & Evidence', icon: ShieldCheck },
                  { id: 'history', label: 'Weekly History', icon: History }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id as any);
                      setCompareMode(false);
                    }}
                    className={cn(
                      "flex items-center gap-1.5 px-4 py-2 text-xs font-semibold border-b-2 transition-all whitespace-nowrap",
                      activeTab === tab.id && !compareMode
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <tab.icon className="h-3.5 w-3.5" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* COMPARE MODE VIEW */}
              {compareMode && diffMutation.data?.success && (
                <Card className="border-evidence-verified/20 bg-evidence-verified/[0.01]">
                  <CardHeader className="pb-3 border-b border-border/50">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <GitCompare className="h-4 w-4 text-evidence-verified" />
                        Comparison: Version {compareOldVer} vs. Version {compareNewVer}
                      </CardTitle>
                      <Button variant="ghost" size="sm" className="h-7 text-2xs" onClick={() => setCompareMode(false)}>
                        Close Compare
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-5 space-y-4">
                    {/* Score deltas */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: 'Readiness Shift', val: diffMutation.data.data.scoreChanges.readiness },
                        { label: 'ATS Change', val: diffMutation.data.data.scoreChanges.ats },
                        { label: 'GitHub Change', val: diffMutation.data.data.scoreChanges.github },
                        { label: 'Projects Change', val: diffMutation.data.data.scoreChanges.projects }
                      ].map((item) => (
                        <div key={item.label} className="p-3 rounded bg-muted/40 text-center border border-border/50">
                          <span className="text-[10px] text-muted-foreground uppercase block mb-1">{item.label}</span>
                          <span className={cn(
                            "text-base font-extrabold font-mono",
                            item.val > 0 ? "text-evidence-verified" : item.val < 0 ? "text-evidence-risk" : "text-muted-foreground"
                          )}>
                            {item.val > 0 ? '+' : ''}{item.val}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Added/Removed technical components */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <span className="text-2xs font-bold text-evidence-verified uppercase tracking-wider block">Added Skills</span>
                        <div className="flex flex-wrap gap-1.5">
                          {diffMutation.data.data.addedSkills?.length > 0 ? (
                            diffMutation.data.data.addedSkills.map((s: string) => (
                              <Badge key={s} variant="outline" className="bg-evidence-verified/10 border-evidence-verified/25 text-evidence-verified text-2xs">
                                + {s}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-2xs text-muted-foreground">No skills added.</span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <span className="text-2xs font-bold text-evidence-review uppercase tracking-wider block">Removed Skills</span>
                        <div className="flex flex-wrap gap-1.5">
                          {diffMutation.data.data.removedSkills?.length > 0 ? (
                            diffMutation.data.data.removedSkills.map((s: string) => (
                              <Badge key={s} variant="outline" className="bg-evidence-review/10 border-evidence-review/25 text-evidence-review text-2xs">
                                - {s}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-2xs text-muted-foreground">No skills removed.</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <Separator className="opacity-40" />

                    {/* Diff summaries */}
                    <div className="space-y-2">
                      <span className="text-2xs font-bold text-muted-foreground uppercase tracking-wider block">Change Log Summary</span>
                      <ul className="list-disc pl-4 space-y-1 text-2xs text-muted-foreground">
                        {diffMutation.data.data.summary?.map((line: string, idx: number) => (
                          <li key={idx}>{line}</li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* OVERVIEW TAB */}
              {activeTab === 'overview' && !compareMode && (
                <div className="space-y-6">
                  {/* Score gauge cards */}
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card className="border-border p-5 text-center flex flex-col justify-center items-center bg-primary/[0.01]">
                      <span className="text-3xs font-bold text-muted-foreground uppercase tracking-wider block mb-3">PLACEMENT READY SCORE</span>
                      <div className="relative h-24 w-24 flex items-center justify-center">
                        <svg className="absolute h-full w-full transform -rotate-90">
                          <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="5" fill="transparent" className="text-muted/30" />
                          <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="5" fill="transparent" className="text-primary"
                            strokeDasharray={2 * Math.PI * 40}
                            strokeDashoffset={2 * Math.PI * 40 * (1 - readiness.readinessScore / 100)}
                          />
                        </svg>
                        <span className="text-2xl font-extrabold font-mono">{readiness.readinessScore}%</span>
                      </div>
                    </Card>

                    {/* Target benchmark score overlay comparison */}
                    {benchmarkData?.success && (
                      <Card className="border-border md:col-span-2 p-5 space-y-3.5">
                        <span className="text-3xs font-bold text-muted-foreground uppercase tracking-wider block">Industry Benchmarks ({selectedRole})</span>
                        <div className="space-y-2.5">
                          {[
                            { label: 'Your Profile Score', val: readiness.readinessScore, color: 'bg-primary' },
                            { label: 'Average Candidate', val: benchmarkData.data.benchmarks.averageCandidate, color: 'bg-muted-foreground/60' },
                            { label: 'Top 10% Target', val: benchmarkData.data.benchmarks.topTenPercent, color: 'bg-evidence-verified' }
                          ].map((b) => (
                            <div key={b.label} className="space-y-1">
                              <div className="flex justify-between text-2xs">
                                <span className="font-semibold">{b.label}</span>
                                <span className="font-mono text-muted-foreground">{b.val}%</span>
                              </div>
                              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                <div className={cn("h-full rounded-full", b.color)} style={{ width: `${b.val}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>
                    )}
                  </div>

                  {/* Priority Recommendations Matrix */}
                  {recommendations && (
                    <Card className="border-border">
                      <CardHeader className="pb-3 border-b border-border/50">
                        <CardTitle className="text-xs font-bold flex items-center gap-1.5">
                          <Zap className="h-4 w-4 text-primary animate-pulse" />
                          AI Prioritized Improvement Matrix
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-5 space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          {/* Quick Wins - Low Effort, High Impact */}
                          <div className="p-3.5 rounded-lg border border-evidence-verified/20 bg-evidence-verified/[0.02] space-y-2">
                            <span className="text-2xs font-bold text-evidence-verified uppercase tracking-wider block">🔥 Quick Wins (Low Effort / High Impact)</span>
                            <ul className="space-y-1.5 text-2xs text-muted-foreground">
                              {recommendations.priorityImprovements?.slice(0, 2).map((item: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-1.5">
                                  <span className="text-evidence-verified shrink-0 mt-0.5">•</span>
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Major Projects - High Effort, High Impact */}
                          <div className="p-3.5 rounded-lg border border-primary/20 bg-primary/[0.02] space-y-2">
                            <span className="text-2xs font-bold text-primary uppercase tracking-wider block">⚡ High Impact Projects (High Effort / High Impact)</span>
                            <ul className="space-y-1.5 text-2xs text-muted-foreground">
                              {recommendations.projectSuggestions?.slice(0, 2).map((item: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-1.5">
                                  <span className="text-primary shrink-0 mt-0.5">•</span>
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* ATS ANALYSIS REPORT TAB */}
              {activeTab === 'ats' && atsData?.success && (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card className="border-border p-5 text-center flex flex-col justify-center items-center bg-card">
                      <span className="text-3xs font-bold text-muted-foreground uppercase block mb-3">ATS Score</span>
                      <span className="text-3xl font-extrabold font-mono text-primary">{atsData.data.overallAtsScore}%</span>
                    </Card>

                    <Card className="border-border md:col-span-2 p-5 space-y-3.5">
                      <span className="text-3xs font-bold text-muted-foreground uppercase block">Section Audits</span>
                      <div className="grid grid-cols-2 gap-3">
                        {Object.entries(atsData.data.sectionScores || {}).map(([sec, val]: any) => (
                          <div key={sec} className="flex items-center justify-between text-2xs border-b border-border/50 pb-1.5">
                            <span className="font-semibold capitalize">{sec}</span>
                            <Badge variant={val >= 75 ? 'outline' : 'secondary'} className="font-mono text-3xs">{val}%</Badge>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>

                  {/* Priority Fixes */}
                  <Card className="border-border">
                    <CardHeader className="pb-3 border-b border-border/50">
                      <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Actionable ATS Auditing Fixes</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      {atsData.data.fixes?.length > 0 ? (
                        <div className="divide-y divide-border/50">
                          {atsData.data.fixes.map((fix: any, idx: number) => (
                            <div key={idx} className="p-4 flex items-start justify-between gap-4">
                              <div className="space-y-1 min-w-0">
                                <span className="text-xs font-semibold block text-foreground">{fix.action}</span>
                                <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground font-mono">
                                  <span>Before: <span className="text-evidence-risk line-through">{fix.before}</span></span>
                                  <span>·</span>
                                  <span>After: <span className="text-evidence-verified">{fix.after}</span></span>
                                </div>
                              </div>
                              <Badge className="bg-primary/10 border-primary/20 text-primary font-mono shrink-0 whitespace-nowrap text-2xs">
                                +{fix.expectedIncrease} Points
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-8 text-center text-xs text-muted-foreground">
                          No formatting or keywords gaps detected in your ATS audits!
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* SEMANTIC MATCHING TAB */}
              {activeTab === 'semantic' && semanticData?.success && (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card className="border-border p-5 text-center flex flex-col justify-center items-center">
                      <span className="text-3xs font-bold text-muted-foreground uppercase block mb-3">Semantic Similarity Matching</span>
                      <span className="text-3xl font-extrabold font-mono text-primary">{semanticData.data.semantic_match_pct}%</span>
                      <p className="text-[10px] text-muted-foreground mt-3">Calculates tech synonym overlaps (e.g. FastAPI → REST APIs)</p>
                    </Card>

                    <Card className="border-border p-5 text-center flex flex-col justify-center items-center">
                      <span className="text-3xs font-bold text-muted-foreground uppercase block mb-3">Exact Keyword Matching</span>
                      <span className="text-3xl font-extrabold font-mono text-muted-foreground">{semanticData.data.exact_match_pct}%</span>
                      <p className="text-[10px] text-muted-foreground mt-3">Requires identical string overlays on required skills list</p>
                    </Card>
                  </div>

                  {/* Synonym & Hidden skill mappings */}
                  {semanticData.data.hidden_skills?.length > 0 && (
                    <Card className="border-border">
                      <CardHeader className="pb-3 border-b border-border/50">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Discovered Hidden Skill Mappings</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 space-y-2">
                        {semanticData.data.hidden_skills.map((msg: string, idx: number) => (
                          <div key={idx} className="flex items-center gap-2 text-2xs text-muted-foreground p-2 rounded bg-muted/40 border border-border/50">
                            <CheckCircle className="h-4 w-4 text-evidence-verified shrink-0" />
                            <span>{msg}</span>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* CONFIDENCE & EVIDENCE TAB */}
              {activeTab === 'confidence' && confidenceData?.success && (
                <Card className="border-border">
                  <CardHeader className="pb-3 border-b border-border/50">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Skills Confidence Matrix</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-border/50">
                      {confidenceData.data.skills?.map((item: any) => (
                        <div key={item.skill} className="p-4 flex items-start justify-between gap-4">
                          <div className="space-y-1.5 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold">{item.skill}</span>
                              <Badge variant={item.rating === 'High' ? 'outline' : 'secondary'} className={cn(
                                "text-3xs uppercase font-mono px-1 py-0.5",
                                item.rating === 'High' ? 'text-evidence-verified bg-evidence-verified/5 border-evidence-verified/25' : 'text-evidence-review bg-evidence-review/5'
                              )}>
                                {item.rating} Confidence
                              </Badge>
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground font-mono">
                              <span>Evidence:</span>
                              {item.evidence?.map((e: string, idx: number) => (
                                <Badge key={idx} variant="outline" className="text-3xs">{e}</Badge>
                              ))}
                            </div>
                          </div>
                          <span className="font-mono text-xs font-extrabold">{item.confidence}%</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* WEEKLY HISTORY TAB */}
              {activeTab === 'history' && chartScores.length > 0 && (
                <Card className="border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Chronological Placement Readiness History</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartScores} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                          <XAxis
                            dataKey="timestamp"
                            tickFormatter={(str) => new Date(str).toLocaleDateString()}
                            style={{ fontSize: 10, fontFamily: 'monospace' }}
                          />
                          <YAxis style={{ fontSize: 10, fontFamily: 'monospace' }} domain={[0, 100]} />
                          <ChartTooltip
                            labelFormatter={(label) => new Date(label).toLocaleDateString()}
                            contentStyle={{ fontSize: 11, backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                          />
                          <Legend wrapperStyle={{ fontSize: 10 }} />
                          <Line type="monotone" dataKey="readinessScore" name="Readiness Score" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
                          <Line type="monotone" dataKey="atsScore" name="ATS Score" stroke="#f59e0b" strokeWidth={1.5} dot={{ r: 3 }} />
                          <Line type="monotone" dataKey="githubScore" name="GitHub Score" stroke="#10b981" strokeWidth={1.5} dot={{ r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
