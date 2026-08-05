'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/PageHeader';
import { EvidenceBadge } from '@/components/EvidenceBadge';
import { ConfidenceScore } from '@/components/ConfidenceScore';
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
  Info,
  History,
  FileCode,
  Calendar,
  RefreshCw,
  FolderCode
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
  const [pipelineStep, setPipelineStep] = useState(0); // 0: idle, 1: upload, 2: parse, 3: github, 4: gap, 5: scoring, 6: done

  // Fetch placement readiness details using TanStack Query
  const { data: scoreData, isLoading: scoreLoading, isError: scoreError, error: scoreErr, refetch: refetchScore } = useQuery({
    queryKey: ['placement-readiness', user?._id],
    queryFn: () => resumeApi.getPlacementScore(user?._id || ''),
    enabled: !!user?._id,
    retry: false
  });

  const { data: gapData, isLoading: gapLoading, refetch: refetchGap } = useQuery({
    queryKey: ['placement-gap', user?._id],
    queryFn: () => resumeApi.getSkillGap(user?._id || ''),
    enabled: !!user?._id,
    retry: false
  });

  const { data: recsData, isLoading: recsLoading, refetch: refetchRecs } = useQuery({
    queryKey: ['placement-recs', user?._id],
    queryFn: () => resumeApi.getRecommendations(user?._id || ''),
    enabled: !!user?._id,
    retry: false
  });

  const { data: evidenceData, isLoading: evidenceLoading, refetch: refetchEvidence } = useQuery({
    queryKey: ['placement-evidence', user?._id],
    queryFn: () => resumeApi.getEvidence(user?._id || ''),
    enabled: !!user?._id,
    retry: false
  });

  const { data: githubData, isLoading: githubLoading, refetch: refetchGithub } = useQuery({
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

  // Run pipeline trigger via useMutation
  const runPipelineMutation = useMutation({
    mutationFn: (data: { resumeId: string; targetRole: string }) =>
      resumeApi.parse(data.resumeId, data.targetRole),
    onSuccess: (res) => {
      setPipelineStep(6);
      toast.success('Readiness evaluation pipeline completed successfully!');
      // Refetch queries
      refetchScore();
      refetchGap();
      refetchRecs();
      refetchEvidence();
      refetchGithub();
      refetchHistory();
      setTimeout(() => setPipelineStep(0), 2000);
    },
    onError: (err: any) => {
      setPipelineStep(0);
      toast.error(err?.response?.data?.message || err.message || 'Pipeline execution failed.');
    }
  });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
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
      toast.error('Only PDF or DOCX resume formats are supported.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Resume exceeds maximum size of 5MB.');
      return;
    }
    setUploadFile(file);
  };

  const triggerUploadAndParse = async () => {
    if (!uploadFile) return;

    setIsUploading(true);
    setPipelineStep(1);
    setUploadProgress(20);

    try {
      // 1. Upload File
      const uploadRes = await resumeApi.upload(uploadFile);
      const resumeId = uploadRes.data.data.resume._id;
      setUploadProgress(100);
      setIsUploading(false);

      // 2. Trigger Extraction steps
      setPipelineStep(2);
      setTimeout(() => setPipelineStep(3), 1500);
      setTimeout(() => setPipelineStep(4), 3000);
      setTimeout(() => {
        setPipelineStep(5);
        runPipelineMutation.mutate({ resumeId, targetRole: selectedRole });
      }, 4500);

    } catch (err: any) {
      setIsUploading(false);
      setPipelineStep(0);
      toast.error(err?.response?.data?.message || err.message || 'Upload failed.');
    }
  };

  const triggerReparseRole = (role: string) => {
    setSelectedRole(role);
    // Find latest resume and trigger re-evaluation
    const latestResumeId = historyData?.data?.data?.history?.[0]?.resume;
    if (latestResumeId) {
      setPipelineStep(2);
      setTimeout(() => setPipelineStep(3), 1000);
      setTimeout(() => setPipelineStep(4), 2000);
      setTimeout(() => {
        setPipelineStep(5);
        runPipelineMutation.mutate({ resumeId: latestResumeId, targetRole: role });
      }, 3000);
    } else {
      toast.info('Please upload a resume first to run the analysis.');
    }
  };

  if (scoreLoading || gapLoading || recsLoading || evidenceLoading || githubLoading) {
    return <LoadingState message="Connecting intelligence pipeline..." />;
  }

  const readiness = scoreData?.data?.data;
  const skillsBreakdown = gapData?.data?.data?.skillGap;
  const recommendations = recsData?.data?.data?.recommendations;
  const evidenceList = evidenceData?.data?.data?.evidence || [];
  const githubAnalysis = githubData?.data?.data?.githubAnalysis;
  const history = historyData?.data?.data?.history || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Placement Readiness Engine"
        description="Extract resume details, analyze GitHub repositories, and map career gaps"
        icon={GraduationCap}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Col: Upload & Configuration */}
        <div className="space-y-6 lg:col-span-1">
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <UploadCloud className="h-4 w-4 text-primary" />
                Upload Resume
              </CardTitle>
              <CardDescription className="text-2xs">Upload PDF or DOCX file (Max 5MB)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Drag and Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={cn(
                  "border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors bg-muted/20 select-none",
                  uploadFile && "border-evidence-verified/40 bg-evidence-verified/[0.01]"
                )}
              >
                <input
                  type="file"
                  id="resume-file-input"
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.docx"
                />
                <label htmlFor="resume-file-input" className="cursor-pointer space-y-2 block">
                  <div className="h-10 w-10 rounded-full bg-primary/5 mx-auto flex items-center justify-center">
                    <FileText className={cn("h-5 w-5 text-muted-foreground", uploadFile && "text-evidence-verified")} />
                  </div>
                  {uploadFile ? (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-foreground truncate max-w-[200px] mx-auto">{uploadFile.name}</p>
                      <p className="text-2xs text-muted-foreground">{(uploadFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold">Click to upload or drag & drop</p>
                      <p className="text-2xs text-muted-foreground">PDF, DOCX formats supported</p>
                    </div>
                  )}
                </label>
              </div>

              {/* Target Role Dropdown */}
              <div className="space-y-1.5">
                <Label htmlFor="target-role" className="text-2xs font-semibold text-muted-foreground">TARGET JOB PATH</Label>
                <select
                  id="target-role"
                  value={selectedRole}
                  onChange={(e) => {
                    setSelectedRole(e.target.value);
                    if (history.length > 0) triggerReparseRole(e.target.value);
                  }}
                  className="w-full text-xs h-9 bg-background border border-border rounded-md px-2 focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {TARGET_ROLES.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>

              {/* Trigger Button */}
              <Button
                disabled={!uploadFile || isUploading || pipelineStep > 0}
                onClick={triggerUploadAndParse}
                className="w-full text-xs h-9"
              >
                {pipelineStep > 0 ? (
                  <span className="flex items-center gap-1.5 animate-pulse">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    Running Pipeline...
                  </span>
                ) : 'Run Readiness Pipeline'}
              </Button>

              {/* Upload Progress bar */}
              {isUploading && (
                <div className="space-y-1">
                  <div className="flex justify-between text-2xs text-muted-foreground font-mono">
                    <span>Uploading file...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stepper Pipeline Progress Tracker */}
          {pipelineStep > 0 && (
            <Card className="border-border bg-muted/20">
              <CardContent className="p-4 space-y-3">
                <span className="text-2xs font-semibold text-muted-foreground block uppercase tracking-wider">Pipeline Execution logs</span>
                <div className="space-y-2">
                  {[
                    { step: 1, label: 'Resume Upload', detail: 'Validating file safety & format' },
                    { step: 2, label: 'Parser Extraction', detail: 'Extracting education, projects, skills JSON' },
                    { step: 3, label: 'GitHub Scraper', detail: 'Scanning active repos, commits, stars' },
                    { step: 4, label: 'Skill Gap matching', detail: 'Comparing against career profiles' },
                    { step: 5, label: 'Scoring Engine', detail: 'Computing weighted readiness coefficients' }
                  ].map((s) => {
                    const active = pipelineStep === s.step;
                    const completed = pipelineStep > s.step;
                    return (
                      <div key={s.step} className="flex items-start gap-2.5">
                        <div className={cn(
                          "h-4 w-4 rounded-full border flex items-center justify-center shrink-0 text-2xs font-bold font-mono mt-0.5",
                          completed ? "bg-evidence-verified/25 border-evidence-verified text-evidence-verified" :
                          active ? "bg-primary/20 border-primary text-primary animate-pulse" : "bg-muted border-border text-muted-foreground"
                        )}>
                          {completed ? '✓' : s.step}
                        </div>
                        <div className="min-w-0">
                          <span className={cn("text-xs font-semibold block", active && "text-primary")}>{s.label}</span>
                          <span className="text-2xs text-muted-foreground block">{s.detail}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* History Runs List */}
          {history.length > 0 && (
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
                  <History className="h-3.5 w-3.5 text-muted-foreground" />
                  Assessment History
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                {history.slice(0, 3).map((h: any, i: number) => (
                  <div key={h._id} className="flex items-center justify-between p-2 rounded bg-muted/30 border border-border/50 text-2xs">
                    <div>
                      <span className="font-semibold block">{h.targetRole}</span>
                      <span className="text-muted-foreground block font-mono">Run v{h.version} · {new Date(h.createdAt).toLocaleDateString()}</span>
                    </div>
                    <Badge variant="outline" className="font-mono text-2xs">{h.readinessScore}%</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Col: Readiness dashboard (conditional empty state) */}
        <div className="lg:col-span-2 space-y-6">
          {!readiness ? (
            <Card className="border-border h-[400px] flex items-center justify-center">
              <EmptyState
                icon={GraduationCap}
                title="Evaluate Placement Readiness"
                description="Upload your latest PDF/DOCX resume file above to start the extraction and scoring engine."
              />
            </Card>
          ) : (
            <>
              {/* Radial Gauges & Metrics */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-border md:col-span-1 flex flex-col justify-center items-center p-6 text-center bg-primary/[0.01]">
                  <span className="text-2xs font-semibold text-muted-foreground uppercase tracking-wider block mb-4">Overall Readiness</span>
                  <div className="relative h-28 w-28 flex items-center justify-center">
                    <svg className="absolute h-full w-full transform -rotate-90">
                      <circle cx="56" cy="56" r="48" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-muted/30" />
                      <circle cx="56" cy="56" r="48" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-primary transition-all duration-1000"
                        strokeDasharray={2 * Math.PI * 48}
                        strokeDashoffset={2 * Math.PI * 48 * (1 - readiness.readinessScore / 100)}
                      />
                    </svg>
                    <span className="text-3xl font-extrabold font-mono tracking-tight">{readiness.readinessScore}%</span>
                  </div>
                  <span className="text-2xs text-muted-foreground mt-4 block">Weighted Placement Quotient</span>
                </Card>

                {/* Score Category Grid */}
                <Card className="border-border md:col-span-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Category Performance Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    {[
                      { key: 'technicalSkills', label: 'Technical Skills', weight: '25%' },
                      { key: 'resumeQuality', label: 'Resume Quality', weight: '15%' },
                      { key: 'projects', label: 'Projects Profile', weight: '15%' },
                      { key: 'github', label: 'GitHub Activity', weight: '15%' },
                      { key: 'experience', label: 'Work Experience', weight: '10%' },
                      { key: 'consistency', label: 'Consistency', weight: '5%' }
                    ].map((c) => {
                      const score = readiness.categoryScores?.[c.key] || 0;
                      return (
                        <div key={c.key} className="space-y-1">
                          <div className="flex items-center justify-between text-2xs">
                            <span className="font-semibold">{c.label}</span>
                            <span className="font-mono text-muted-foreground">{score}% (w: {c.weight})</span>
                          </div>
                          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all duration-1000",
                                score >= 70 ? 'bg-evidence-verified' : score >= 50 ? 'bg-evidence-review' : 'bg-evidence-risk'
                              )}
                              style={{ width: `${score}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </div>

              {/* Skill Gap Matrix */}
              {skillsBreakdown && (
                <Card className="border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                      <Layers className="h-4 w-4 text-muted-foreground" />
                      Skill Gap Matrix
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Strong Skills */}
                    {skillsBreakdown.strongSkills?.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-2xs font-semibold text-evidence-verified uppercase tracking-wider block">Strong Skills (Resume + GitHub)</span>
                        <div className="flex flex-wrap gap-1.5">
                          {skillsBreakdown.strongSkills.map((s: string) => (
                            <Badge key={s} variant="outline" className="bg-evidence-verified/10 text-evidence-verified border-evidence-verified/20 text-2xs">
                              {s}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Missing Skills */}
                    {skillsBreakdown.missingSkills?.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-2xs font-semibold text-evidence-risk uppercase tracking-wider block">Missing Career Skills</span>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {skillsBreakdown.missingSkills.map((s: any) => (
                            <div key={s.name} className="p-2.5 rounded bg-muted/30 border border-border/50 text-2xs space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-foreground">{s.name}</span>
                                <Badge variant="outline" className="text-3xs uppercase px-1 py-0 border-evidence-risk/20 text-evidence-risk bg-evidence-risk/5">{s.importance}</Badge>
                              </div>
                              <div className="flex items-center gap-3 text-muted-foreground">
                                <span>Difficulty: {s.learningDifficulty}</span>
                                <span>Time: {s.estimatedLearningTime}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Evidence Engine USP Mapping */}
              {evidenceList.length > 0 && (
                <Card className="border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-evidence-verified" />
                      Verification Evidence logs
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {evidenceList.map((e: any) => (
                      <div key={e.category} className="space-y-1.5 border-b border-border/50 pb-2.5 last:border-0 last:pb-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold">{e.category}</span>
                          <Badge className="font-mono text-3xs h-4">{e.score}%</Badge>
                        </div>
                        <ul className="list-disc pl-4 space-y-1 text-2xs text-muted-foreground leading-relaxed">
                          {e.evidenceList.map((item: string, idx: number) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* AI Study Recommendations & Roadmap */}
              {recommendations && (
                <Card className="border-border bg-primary/[0.01]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                      <Zap className="h-4 w-4 text-primary" />
                      AI Placement Roadmap
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <span className="text-2xs font-semibold text-muted-foreground uppercase tracking-wider block">Candidate Strengths</span>
                        <ul className="space-y-1 text-2xs leading-relaxed text-muted-foreground">
                          {recommendations.strengths?.map((s: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <CheckCircle2 className="h-3.5 w-3.5 text-evidence-verified shrink-0 mt-0.5" />
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="space-y-2">
                        <span className="text-2xs font-semibold text-muted-foreground uppercase tracking-wider block">Areas of Improvement</span>
                        <ul className="space-y-1 text-2xs leading-relaxed text-muted-foreground">
                          {recommendations.weaknesses?.map((w: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <AlertTriangle className="h-3.5 w-3.5 text-evidence-review shrink-0 mt-0.5" />
                              {w}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <Separator className="opacity-40" />

                    {/* Timeline roadmap milestones */}
                    <div className="space-y-3">
                      <span className="text-2xs font-semibold text-muted-foreground uppercase tracking-wider block">Personalized 90-Day Learning Milestone calendar</span>
                      <div className="grid gap-3 md:grid-cols-3">
                        <div className="p-3 rounded bg-muted/40 border border-border/50 space-y-1.5">
                          <div className="flex items-center gap-1 text-xs font-semibold text-primary">
                            <Calendar className="h-3.5 w-3.5" />
                            Weekly Goals
                          </div>
                          <ul className="list-disc pl-4 text-2xs text-muted-foreground space-y-1">
                            {recommendations.roadmap?.weeklyGoals?.map((g: string, idx: number) => (
                              <li key={idx}>{g}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="p-3 rounded bg-muted/40 border border-border/50 space-y-1.5">
                          <div className="flex items-center gap-1 text-xs font-semibold text-primary">
                            <Calendar className="h-3.5 w-3.5" />
                            30-Day Targets
                          </div>
                          <ul className="list-disc pl-4 text-2xs text-muted-foreground space-y-1">
                            {recommendations.roadmap?.thirtyDayPlan?.map((t: string, idx: number) => (
                              <li key={idx}>{t}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="p-3 rounded bg-muted/40 border border-border/50 space-y-1.5">
                          <div className="flex items-center gap-1 text-xs font-semibold text-primary">
                            <Calendar className="h-3.5 w-3.5" />
                            90-Day Vision
                          </div>
                          <ul className="list-disc pl-4 text-2xs text-muted-foreground space-y-1">
                            {recommendations.roadmap?.ninetyDayPlan?.map((n: string, idx: number) => (
                              <li key={idx}>{n}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
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
