'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { coachApi, CoachChatMessage } from '@/lib/api';
import {
  MessageSquare,
  Sparkles,
  Trash2,
  Send,
  X,
  Loader2,
  CheckCircle2,
  FileText,
  Map,
  Activity,
  User,
  ArrowRight,
  TrendingUp,
  Award,
  BookOpen,
  Briefcase
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

export function CareerCoachPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<CoachChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeProjectLevel, setActiveProjectLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Intermediate');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch chat history on component load
  useEffect(() => {
    fetchHistory();
  }, []);

  // Scroll to bottom whenever messages list updates or panel opens
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const fetchHistory = async () => {
    try {
      const res = await coachApi.getHistory();
      if (res.data.success && res.data.data.messages) {
        setMessages(res.data.data.messages);
      }
    } catch (err) {
      console.error('Failed to load coach history:', err);
    }
  };

  const handleSendMessage = async (textToSend: string, actionToSend?: string) => {
    if (!textToSend.trim() && !actionToSend) return;
    setIsLoading(true);

    // If it's a manual text input, add it to client state immediately for responsiveness
    if (!actionToSend) {
      const tempUserMsg: CoachChatMessage = {
        sender: 'user',
        text: textToSend,
        type: 'text',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, tempUserMsg]);
      setInputText('');
    }

    try {
      const res = await coachApi.sendMessage(textToSend, actionToSend);
      if (res.data.success && res.data.data.messages) {
        setMessages(res.data.data.messages);
      }
    } catch (err) {
      console.error('Failed to send coach message:', err);
      // Add error fallback message
      setMessages(prev => [
        ...prev,
        {
          sender: 'assistant',
          text: 'Sorry, I encountered an issue processing your request. Please try again.',
          type: 'text',
          timestamp: new Date().toISOString()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm('Are you sure you want to clear your conversation with the Coach?')) return;
    try {
      await coachApi.clearHistory();
      setMessages([]);
    } catch (err) {
      console.error('Failed to clear coach history:', err);
    }
  };

  const quickQuestions = [
    { label: 'Why is my ATS score low?', query: 'Why is my ATS score low?' },
    { label: 'What should I learn next?', query: 'What should I learn next?' },
    { label: 'Am I ready for internships?', query: 'Am I ready for internships?' },
    { label: 'What projects should I build?', query: 'What projects should I build?' },
    { label: 'What companies should I target?', query: 'What companies should I target?' },
    { label: 'What skill gives highest impact?', query: 'What skill gives highest impact?' }
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "h-14 w-14 rounded-full flex items-center justify-center shadow-2xl text-white transition-all bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 border border-violet-500/20"
        )}
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
      </motion.button>

      {/* Slide-out Coach Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: -20, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute bottom-16 right-0 w-[92vw] sm:w-[460px] h-[75vh] min-h-[500px] max-h-[700px] flex flex-col rounded-2xl shadow-3xl bg-card border border-border/80 overflow-hidden backdrop-blur-xl"
          >
            {/* Header */}
            <div className="p-4 border-b border-border bg-gradient-to-r from-violet-600/10 via-indigo-600/10 to-blue-600/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-violet-500 to-indigo-500 flex items-center justify-center text-white">
                  <Sparkles className="h-5 w-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground">CareerAI Coach</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[10px] text-muted-foreground font-medium">Ready to Mentor</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClearHistory}
                    className="h-8 w-8 text-muted-foreground hover:text-red-500"
                    title="Clear Conversation"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 text-muted-foreground"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Context Engine Badges */}
            <div className="px-4 py-2 border-b border-border bg-muted/30 flex items-center gap-2 overflow-x-auto text-[10px] text-muted-foreground select-none scrollbar-none">
              <span className="font-bold shrink-0">CONTEXT LOADED:</span>
              <Badge variant="outline" className="gap-1 bg-background text-[9px] px-1.5 py-0.5">
                <User className="h-2.5 w-2.5 text-blue-500" /> Profile
              </Badge>
              <Badge variant="outline" className="gap-1 bg-background text-[9px] px-1.5 py-0.5">
                <FileText className="h-2.5 w-2.5 text-violet-500" /> Resume ATS
              </Badge>
              <Badge variant="outline" className="gap-1 bg-background text-[9px] px-1.5 py-0.5">
                <Map className="h-2.5 w-2.5 text-emerald-500" /> Roadmap
              </Badge>
              <Badge variant="outline" className="gap-1 bg-background text-[9px] px-1.5 py-0.5">
                <Activity className="h-2.5 w-2.5 text-orange-500" /> Mock Interview
              </Badge>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-card via-card to-background">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-6">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-violet-500/10 to-indigo-500/10 flex items-center justify-center text-indigo-500">
                    <Sparkles className="h-8 w-8" />
                  </div>
                  <div>
                    <h4 className="font-bold text-base">Your Personal Career Mentor</h4>
                    <p className="text-xs text-muted-foreground mt-2 max-w-[280px]">
                      Ask about your ATS score, what technologies to learn next, projects recommendation, or check your internship readiness.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 w-full pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSendMessage('', 'resume_improvement')}
                      className="text-xs gap-1.5 justify-start h-9"
                    >
                      <FileText className="h-3.5 w-3.5 text-violet-500" /> Improve Resume
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSendMessage('', 'project_recommendations')}
                      className="text-xs gap-1.5 justify-start h-9"
                    >
                      <BookOpen className="h-3.5 w-3.5 text-emerald-500" /> Project Ideas
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSendMessage('', 'readiness_check')}
                      className="text-xs gap-1.5 justify-start col-span-2 h-9"
                    >
                      <TrendingUp className="h-3.5 w-3.5 text-indigo-500" /> Internship Readiness
                    </Button>
                  </div>
                </div>
              ) : (
                messages.map((msg, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex flex-col max-w-[85%] rounded-2xl p-3.5 text-sm",
                      msg.sender === 'user'
                        ? "ml-auto bg-primary text-primary-foreground rounded-tr-none"
                        : "mr-auto bg-muted/60 border border-border/50 text-foreground rounded-tl-none"
                    )}
                  >
                    {/* Render message text */}
                    <div className="prose dark:prose-invert text-xs leading-relaxed whitespace-pre-line">
                      {msg.text}
                    </div>

                    {/* Specialized Structured Renderers */}
                    {msg.sender === 'assistant' && msg.type === 'resume_improvement' && msg.data && (
                      <div className="mt-4 space-y-4 pt-3 border-t border-border/80 w-full text-xs">
                        <div className="p-2 rounded bg-violet-500/5 text-[11px] leading-relaxed text-muted-foreground border-l-2 border-violet-500">
                          {msg.data.analysis}
                        </div>
                        
                        {/* Weak vs Rewritten Bullets */}
                        <div className="space-y-3">
                          <h5 className="font-semibold text-foreground flex items-center gap-1.5">
                            <Sparkles className="h-3.5 w-3.5 text-violet-500" /> Recommended Bullet Rewrites
                          </h5>
                          {msg.data.weakBullets?.map((bullet: any, idx: number) => (
                            <div key={idx} className="space-y-1.5 p-2.5 rounded-lg bg-background border border-border/50">
                              <div className="text-[10px] text-red-500 line-through opacity-85">
                                Original: {bullet.original}
                              </div>
                              <div className="text-[11px] text-emerald-600 font-medium">
                                Rewritten: {bullet.rewritten}
                              </div>
                              {bullet.impact && (
                                <div className="text-[9px] text-muted-foreground italic">
                                  Impact: {bullet.impact}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Missing Keywords Badges */}
                        {msg.data.missingKeywords?.length > 0 && (
                          <div className="space-y-1">
                            <span className="font-semibold text-foreground block">Keywords to Add:</span>
                            <div className="flex flex-wrap gap-1">
                              {msg.data.missingKeywords.map((kw: string, idx: number) => (
                                <Badge key={idx} variant="secondary" className="text-[9px] px-1.5 bg-violet-500/10 text-violet-600 hover:bg-violet-500/10">
                                  {kw}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Action checklist */}
                        {msg.data.actionItems?.length > 0 && (
                          <div className="space-y-1">
                            <span className="font-semibold text-foreground block">Action Items:</span>
                            <ul className="space-y-1 pl-4 list-disc text-muted-foreground text-[10px]">
                              {msg.data.actionItems.map((item: string, idx: number) => (
                                <li key={idx}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {msg.sender === 'assistant' && msg.type === 'project_recommendations' && msg.data && (
                      <div className="mt-4 pt-3 border-t border-border/80 w-full text-xs">
                        {/* Difficulty tabs */}
                        <div className="flex border border-border rounded-lg overflow-hidden mb-3">
                          {(['Beginner', 'Intermediate', 'Advanced'] as const).map(lvl => (
                            <button
                              key={lvl}
                              type="button"
                              onClick={() => setActiveProjectLevel(lvl)}
                              className={cn(
                                "flex-1 py-1 text-[10px] font-semibold text-center transition-colors",
                                activeProjectLevel === lvl
                                  ? "bg-emerald-600 text-white"
                                  : "bg-background text-muted-foreground hover:bg-muted"
                              )}
                            >
                              {lvl}
                            </button>
                          ))}
                        </div>

                        {/* Project cards matching level */}
                        {msg.data.recommendations?.filter((r: any) => r.level === activeProjectLevel).map((rec: any, idx: number) => (
                          <div key={idx} className="p-3 rounded-lg bg-background border border-border/60 space-y-2">
                            <h5 className="font-bold text-foreground flex items-center gap-1.5">
                              <Briefcase className="h-3.5 w-3.5 text-emerald-600" /> {rec.title}
                            </h5>
                            <p className="text-[10px] text-muted-foreground leading-relaxed">
                              {rec.description}
                            </p>
                            <div className="space-y-1">
                              <span className="text-[9px] text-foreground font-semibold block">Skills You Will Learn:</span>
                              <div className="flex flex-wrap gap-1">
                                {rec.skillsLearned?.map((skill: string, sIdx: number) => (
                                  <Badge key={sIdx} variant="secondary" className="text-[9px] px-1 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10">
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {msg.sender === 'assistant' && msg.type === 'readiness_check' && msg.data && (
                      <div className="mt-4 space-y-3.5 pt-3 border-t border-border/80 w-full text-xs">
                        {/* Overall gauge */}
                        <div className="flex items-center gap-3 p-2.5 rounded-lg bg-background border border-border">
                          <div className="shrink-0 relative h-12 w-12 rounded-full border-4 border-indigo-600/20 flex items-center justify-center">
                            <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-r-transparent border-b-transparent animate-spin-slow"></div>
                            <span className="font-bold text-xs">{msg.data.overallReadiness}%</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-muted-foreground block">Internship Readiness</span>
                            <span className="font-bold text-foreground text-xs">
                              {msg.data.overallReadiness >= 80 ? 'Highly Competitive' : 'Needs Optimization'}
                            </span>
                          </div>
                        </div>

                        {/* Weakest Area Alert */}
                        <div className="p-2 rounded bg-red-500/5 border border-red-500/10 flex items-start gap-2">
                          <Award className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold text-[10px] text-foreground block">Weakest Component:</span>
                            <span className="text-[10px] text-muted-foreground">{msg.data.weakestArea}</span>
                          </div>
                        </div>

                        <p className="text-[10px] leading-relaxed text-muted-foreground">
                          {msg.data.readinessReport}
                        </p>

                        {/* Step checklist */}
                        {msg.data.improvementPlan?.length > 0 && (
                          <div className="space-y-1.5">
                            <span className="font-semibold text-foreground block">Actionable Checklist:</span>
                            <div className="space-y-1.5">
                              {msg.data.improvementPlan.map((plan: any, idx: number) => (
                                <div key={idx} className="flex gap-2 items-start p-1.5 bg-background border border-border/40 rounded">
                                  <CheckCircle2 className="h-3.5 w-3.5 text-indigo-500 shrink-0 mt-0.5" />
                                  <div>
                                    <p className="text-[10px] font-medium text-foreground">{plan.step}</p>
                                    <span className="text-[9px] text-muted-foreground">{plan.timeframe}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <span className="text-[9px] opacity-60 self-end mt-1.5 block">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              )}

              {/* Chat Input Loader */}
              {isLoading && (
                <div className="mr-auto bg-muted/60 border border-border/50 text-foreground rounded-2xl rounded-tl-none p-3.5 max-w-[85%] flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                  <span className="text-xs text-muted-foreground">Coach is writing advice...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick action prompts */}
            {messages.length > 0 && !isLoading && (
              <div className="p-2 border-t border-border bg-muted/30">
                <div className="flex gap-1.5 overflow-x-auto select-none py-1 scrollbar-none">
                  {quickQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendMessage(q.query)}
                      className="px-2.5 py-1 shrink-0 rounded-full border border-border hover:border-violet-500 bg-background text-[10px] text-foreground font-medium hover:text-violet-600 transition-colors"
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
                <div className="flex gap-1.5 pt-1.5 border-t border-border/40 mt-1.5">
                  <button
                    type="button"
                    onClick={() => handleSendMessage('', 'resume_improvement')}
                    className="flex-1 py-1 px-2 text-center rounded border border-violet-500/30 bg-violet-500/5 hover:bg-violet-500/10 text-[10px] font-semibold text-violet-600 transition-colors flex items-center justify-center gap-1"
                  >
                    <FileText className="h-3 w-3" /> Resume Bullet Check
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendMessage('', 'project_recommendations')}
                    className="flex-1 py-1 px-2 text-center rounded border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 text-[10px] font-semibold text-emerald-600 transition-colors flex items-center justify-center gap-1"
                  >
                    <BookOpen className="h-3 w-3" /> Recommend Projects
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendMessage('', 'readiness_check')}
                    className="flex-1 py-1 px-2 text-center rounded border border-indigo-500/30 bg-indigo-500/5 hover:bg-indigo-500/10 text-[10px] font-semibold text-indigo-600 transition-colors flex items-center justify-center gap-1"
                  >
                    <TrendingUp className="h-3 w-3" /> Readiness Check
                  </button>
                </div>
              </div>
            )}

            {/* Input Bar */}
            <div className="p-3 border-t border-border bg-card">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage(inputText);
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Ask your coach anything..."
                  disabled={isLoading}
                  className="flex-1 px-3.5 py-2 rounded-xl border border-border/80 focus:border-violet-500 bg-background text-xs outline-none focus:ring-1 focus:ring-violet-500/30 transition-all placeholder:text-muted-foreground disabled:opacity-50"
                />
                <Button
                  type="submit"
                  disabled={isLoading || !inputText.trim()}
                  size="icon"
                  className="h-8 w-8 rounded-xl bg-violet-600 hover:bg-violet-700 shrink-0 text-white"
                >
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
