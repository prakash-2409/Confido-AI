'use client';

/**
 * Resume Upload & Analysis Page
 * 
 * The main "aha moment" screen where users upload resumes and see ATS analysis
 */

import { useState, useCallback, useEffect } from 'react';
import { resumeApi, Resume, ATSAnalysis } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScoreGauge } from '@/components/ScoreGauge';
import { KeywordList } from '@/components/KeywordList';
import { toast } from 'sonner';
import {
  Upload,
  FileText,
  Loader2,
  X,
  Clock,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Lightbulb,
  Wand2,
} from 'lucide-react';

export default function ResumePage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoadingResumes, setIsLoadingResumes] = useState(true);
  const [analysisResult, setAnalysisResult] = useState<ATSAnalysis | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [suggestions, setSuggestions] = useState<any>(null);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);

  // Fetch resumes on mount
  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      const response = await resumeApi.getAll();
      setResumes(response.data.data.resumes || []);
    } catch (error) {
      console.error('Failed to fetch resumes:', error);
    } finally {
      setIsLoadingResumes(false);
    }
  };

  // Handle file upload
  const handleUpload = async (file: File) => {
    if (!file) return;

    // Validate file type
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a PDF or Word document');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setIsUploading(true);
    try {
      const response = await resumeApi.upload(file);
      const newResume = response.data.data.resume;
      setResumes((prev) => [newResume, ...prev]);
      setSelectedResume(newResume);
      setAnalysisResult(null);
      toast.success('Resume uploaded successfully!');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to upload resume';
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  // Handle drag and drop
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  }, []);

  // Handle analysis
  const handleAnalyze = async () => {
    if (!selectedResume) {
      toast.error('Please select a resume first');
      return;
    }
    if (!jobDescription || jobDescription.length < 50) {
      toast.error('Please enter a job description (at least 50 characters)');
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await resumeApi.analyze(selectedResume._id, jobDescription);
      const analysisData = response.data.data;
      // Handle both old and new response formats
      const analysis = 'analysis' in analysisData ? analysisData.analysis : analysisData;
      setAnalysisResult(analysis);
      
      // Update the resume in the list with new score
      setResumes((prev) =>
        prev.map((r) =>
          r._id === selectedResume._id
            ? { ...r, atsScore: analysis.score, status: 'analyzed' as const }
            : r
        )
      );
      setSelectedResume((prev) =>
        prev ? { ...prev, atsScore: analysis.score, status: 'analyzed' as const } : prev
      );
      
      toast.success('Analysis complete!');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to analyze resume';
      toast.error(message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    try {
      await resumeApi.delete(id);
      setResumes((prev) => prev.filter((r) => r._id !== id));
      if (selectedResume?._id === id) {
        setSelectedResume(null);
        setAnalysisResult(null);
        setSuggestions(null);
      }
      toast.success('Resume deleted');
    } catch (error: any) {
      toast.error('Failed to delete resume');
    }
  };

  // Fetch AI suggestions
  const handleGetSuggestions = async () => {
    if (!selectedResume || !jobDescription) {
      toast.error('Please select a resume and enter a job description first');
      return;
    }
    setIsFetchingSuggestions(true);
    try {
      const response = await resumeApi.getSuggestions({
        resume_text: selectedResume.extractedText || '',
        job_description: jobDescription,
        target_role: undefined,
      });
      setSuggestions(response.data.data.suggestions);
      toast.success('AI suggestions ready!');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to get suggestions';
      toast.error(message);
    } finally {
      setIsFetchingSuggestions(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Resume Analysis</h1>
        <p className="text-muted-foreground mt-1">
          Upload your resume and analyze it against job descriptions
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Upload & Resume List */}
        <div className="space-y-6">
          {/* Upload Area */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Upload Resume</CardTitle>
              <CardDescription>PDF or Word documents up to 5MB</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? 'border-primary bg-primary/5'
                    : 'border-muted-foreground/25 hover:border-primary/50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={isUploading}
                />
                {isUploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Uploading...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm font-medium">
                      Drop your resume here or click to browse
                    </p>
                    <p className="text-xs text-muted-foreground">PDF, DOC, DOCX</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Resume List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Resumes</CardTitle>
              <CardDescription>Select a resume to analyze</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingResumes ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : resumes.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No resumes uploaded yet
                </p>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {resumes.map((resume) => (
                    <div
                      key={resume._id}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedResume?._id === resume._id
                          ? 'border-primary bg-primary/5'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => {
                        setSelectedResume(resume);
                        setAnalysisResult(null);
                      }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {resume.originalFilename}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {new Date(resume.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {resume.atsScore && (
                          <Badge variant="outline" className="text-xs">
                            {Math.round(resume.atsScore)}%
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(resume._id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Analysis Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Job Description Input */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Job Description</CardTitle>
              <CardDescription>
                Paste the job description you want to match your resume against
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Paste the full job description here...&#10;&#10;Example: We are looking for a Senior Software Engineer with 5+ years of experience in React, Node.js, and cloud technologies..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="min-h-[200px] resize-none"
              />
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {jobDescription.length} characters
                  {jobDescription.length < 50 && jobDescription.length > 0 && (
                    <span className="text-amber-500 ml-2">
                      (minimum 50 required)
                    </span>
                  )}
                </p>
                <Button
                  onClick={handleAnalyze}
                  disabled={!selectedResume || jobDescription.length < 50 || isAnalyzing}
                  className="gap-2"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Analyze Resume
                    </>
                  )}
                </Button>
              </div>
              {!selectedResume && (
                <p className="text-sm text-amber-500 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Please select or upload a resume first
                </p>
              )}
            </CardContent>
          </Card>

          {/* Analysis Results */}
          {analysisResult && (
            <Card className="border-primary/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      Analysis Results
                    </CardTitle>
                    <CardDescription>
                      Based on the job description provided
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAnalysisResult(null)}
                    className="gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    New Analysis
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Score Display */}
                <div className="flex flex-col md:flex-row items-center gap-8 p-6 bg-muted/30 rounded-lg">
                  <ScoreGauge score={analysisResult.score} size="lg" />
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-xl font-bold mb-2">ATS Compatibility Score</h3>
                    <p className="text-muted-foreground">
                      {analysisResult.score >= 80
                        ? "Excellent! Your resume is well-optimized for this role."
                        : analysisResult.score >= 60
                        ? "Good match. Consider adding some missing keywords."
                        : analysisResult.score >= 40
                        ? "Fair match. Your resume needs more relevant keywords."
                        : "Low match. Consider tailoring your resume for this role."}
                    </p>
                  </div>
                </div>

                {/* Keywords */}
                <div className="grid gap-6 md:grid-cols-2">
                  <KeywordList
                    keywords={analysisResult.matchedKeywords}
                    type="matched"
                  />
                  <KeywordList
                    keywords={analysisResult.missingKeywords}
                    type="missing"
                  />
                </div>

                {/* Tips */}
                <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                    💡 Quick Tips
                  </h4>
                  <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    {analysisResult.missingKeywords.length > 0 && (
                      <li>
                        • Add the missing keywords naturally to your experience section
                      </li>
                    )}
                    <li>• Use exact phrases from the job description when applicable</li>
                    <li>• Quantify your achievements with numbers and metrics</li>
                    <li>• Keep formatting simple - ATS systems prefer clean layouts</li>
                  </ul>
                </div>

                {/* AI Suggestions Button */}
                <div className="flex justify-center pt-2">
                  <Button
                    onClick={handleGetSuggestions}
                    disabled={isFetchingSuggestions}
                    variant="outline"
                    className="gap-2"
                  >
                    {isFetchingSuggestions ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating AI Suggestions...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4" />
                        Get AI Improvement Suggestions
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Suggestions Results */}
          {suggestions && (
            <Card className="border-purple-500/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-purple-500" />
                      AI Improvement Suggestions
                    </CardTitle>
                    <CardDescription>
                      Personalized recommendations to improve your resume
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSuggestions(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Content Suggestions */}
                {suggestions.content_suggestions && suggestions.content_suggestions.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-500" />
                      Content Improvements
                    </h4>
                    <ul className="space-y-2">
                      {suggestions.content_suggestions.map((s: string, i: number) => (
                        <li key={i} className="text-sm p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-100 dark:border-blue-900">
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Keyword Suggestions */}
                {suggestions.keyword_suggestions && suggestions.keyword_suggestions.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-amber-500" />
                      Keyword Recommendations
                    </h4>
                    <ul className="space-y-2">
                      {suggestions.keyword_suggestions.map((s: string, i: number) => (
                        <li key={i} className="text-sm p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-100 dark:border-amber-900">
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Formatting Suggestions */}
                {suggestions.formatting_suggestions && suggestions.formatting_suggestions.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Formatting & Structure
                    </h4>
                    <ul className="space-y-2">
                      {suggestions.formatting_suggestions.map((s: string, i: number) => (
                        <li key={i} className="text-sm p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-100 dark:border-green-900">
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Overall Summary */}
                {suggestions.overall_summary && (
                  <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-900">
                    <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-2">
                      📝 Summary
                    </h4>
                    <p className="text-sm text-purple-800 dark:text-purple-200">
                      {suggestions.overall_summary}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {!analysisResult && selectedResume && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Sparkles className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">Ready to Analyze</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  Paste a job description above and click &quot;Analyze Resume&quot; to see how well
                  your resume matches the requirements.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
