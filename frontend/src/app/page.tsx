'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  FileSearch, 
  MessageSquare, 
  TrendingUp, 
  Sparkles, 
  ArrowRight,
  CheckCircle2,
  Zap,
  Shield,
  Star,
  ChevronDown,
  Play,
  FileText,
  Briefcase,
  Layers,
  Sparkle,
  Lock,
} from 'lucide-react';

// Animation variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 15 }
  },
};

// Data models
const features = [
  {
    icon: FileSearch,
    title: 'ATS Resume Optimizer',
    description: 'Instantly score your resume against target job descriptions. Uncover critical keyword gaps, formatting bugs, and density insights.',
    badge: 'Real-time feedback',
  },
  {
    icon: MessageSquare,
    title: 'AI Smart Mock Interviews',
    description: 'Practice interactive audio/text sessions with role-specific AI coaches. Receive context-aware advice on structure, tone, and delivery.',
    badge: 'Voice support',
  },
  {
    icon: TrendingUp,
    title: 'Dynamic Roadmap & Growth',
    description: 'Receive personalized learning guides based on your skill gaps. Track real-time progress as you work toward target salary brackets.',
    badge: 'Automated updates',
  },
];

const steps = [
  {
    number: '01',
    title: 'Upload Profile',
    desc: 'Drop in your current resume and specify your target roles or job descriptions.',
  },
  {
    number: '02',
    title: 'Polish & Practice',
    desc: 'Close keyword gaps with the optimizer and practice live rounds with the AI Coach.',
  },
  {
    number: '03',
    title: 'Apply with Confidence',
    desc: 'Unlock higher callback rates and walk into interviews backed by real AI insights.',
  },
];

const testimonials = [
  {
    quote: "This platform single-handedly helped me restructure my resume for senior software engineering roles. My callback rate went from 5% to nearly 40%.",
    author: "Sarah Jenkins",
    role: "Senior Software Engineer",
    company: "Vercel",
    rating: 5,
  },
  {
    quote: "The AI interview feedback was shockingly accurate. It caught my tendency to over-explain technical details and helped me structure answers cleanly using STAR.",
    author: "Marcus Chen",
    role: "Product Manager",
    company: "Stripe",
    rating: 5,
  },
  {
    quote: "I went from getting ghosted by ATS filters to landing three offers in two weeks. The dynamic skill roadmaps showed me exactly what API frameworks I needed to highlight.",
    author: "Elena Rostova",
    role: "Full Stack Developer",
    company: "Linear",
    rating: 5,
  },
];

const faqs = [
  {
    question: "How does the ATS Resume Optimizer work?",
    answer: "Our engine uses advanced natural language processing (NLP) to parse your resume alongside your target job descriptions. It compares semantic skill densities, matches crucial industry terminology, and highlights formatting issues that might cause standard applicant tracking systems (ATS) to reject your application."
  },
  {
    question: "Can I practice for specific, niche roles?",
    answer: "Yes! Our AI mock coach generates dynamic questions tailored to the exact role and job listing you provide. Whether you are a distributed systems engineer, growth marketer, or financial analyst, the AI adapts its questions to match industry-standard expectations."
  },
  {
    question: "Is my personal data and resume content secure?",
    answer: "Absolutely. We treat your personal information with enterprise-grade security. All uploaded resumes are encrypted at rest and in transit, and we never sell your career data or use it to train public, open LLM models."
  },
  {
    question: "How does the free tier compare to the Pro tier?",
    answer: "Our free tier includes 3 resume scans per month and basic interview practice sessions. The Pro tier unlocks unlimited scans, advanced STAR-method analysis, mock audio interviews with voice synthesis, and custom career roadmaps."
  }
];

// Interactive Preview Simulation Component
function LivePreview() {
  const [step, setStep] = useState(0);
  const [resumeScore, setResumeScore] = useState(42);
  const [chatMessages, setChatMessages] = useState<{sender: 'ai' | 'user', text: string}[]>([
    { sender: 'ai', text: 'Welcome to your mock interview coach! Ready to practice?' }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    // Resume Score Animation
    if (resumeScore < 89) {
      const timer = setTimeout(() => setResumeScore(prev => prev + 1), 25);
      return () => clearTimeout(timer);
    }
  }, [resumeScore]);

  useEffect(() => {
    const chatSequence = async () => {
      // Step 1: User replies
      await new Promise(r => setTimeout(r, 3000));
      setChatMessages(prev => [...prev, { sender: 'user', text: 'Yes! Let\'s practice system design questions.' }]);
      
      // Step 2: AI asks question
      await new Promise(r => setTimeout(r, 1500));
      setIsTyping(true);
      await new Promise(r => setTimeout(r, 2000));
      setIsTyping(false);
      setChatMessages(prev => [...prev, { sender: 'ai', text: 'Great. How would you design a rate-limiter for a public API?' }]);

      // Step 3: User replies with detail
      await new Promise(r => setTimeout(r, 4000));
      setChatMessages(prev => [...prev, { sender: 'user', text: 'I\'d use Redis with a sliding window log algorithm to track IPs.' }]);

      // Step 4: AI evaluates response
      await new Promise(r => setTimeout(r, 1500));
      setIsTyping(true);
      await new Promise(r => setTimeout(r, 2500));
      setIsTyping(false);
      setChatMessages(prev => [...prev, { 
        sender: 'ai', 
        text: 'Solid choice. Redis handles scale well. Consider mentioning token bucket for burst traffic next time.' 
      }]);
    };

    chatSequence();
  }, []);

  return (
    <div className="w-full bg-card/60 backdrop-blur-md rounded-2xl border border-border/80 shadow-premium overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-border/50 px-6 py-4 bg-muted/20">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-destructive/60" />
          <div className="h-3 w-3 rounded-full bg-warning/60" />
          <div className="h-3 w-3 rounded-full bg-success/60" />
          <span className="text-xs text-muted-foreground ml-2 font-mono font-medium">dashboard_preview.exe</span>
        </div>
        <Badge variant="success" className="text-[10px] uppercase tracking-wider px-2 py-0.5">Live Simulation</Badge>
      </div>

      {/* Main panel layout */}
      <div className="grid lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-border/50">
        {/* Left Panel: Resume ATS Score */}
        <div className="lg:col-span-5 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-4 w-4 text-primary" />
              <h4 className="font-semibold text-sm">ATS Scanner Module</h4>
            </div>
            <p className="text-xs text-muted-foreground">Scanned against Senior Software Engineer profile.</p>
          </div>

          <div className="py-8 flex flex-col items-center justify-center">
            <div className="relative flex items-center justify-center">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle cx="64" cy="64" r="54" className="stroke-muted-foreground/10 fill-none" strokeWidth="8" />
                <motion.circle 
                  cx="64" 
                  cy="64" 
                  r="54" 
                  className="stroke-primary fill-none" 
                  strokeWidth="8" 
                  strokeDasharray="339"
                  strokeDashoffset={339 - (339 * resumeScore) / 100}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-bold font-mono tracking-tight">{resumeScore}%</span>
                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Score</span>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Badge variant="outline" className="text-[10px] font-mono">+5 Keywords Added</Badge>
              <Badge variant="outline" className="text-[10px] font-mono text-danger">-2 Typos Fixed</Badge>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Semantic Relevance</span>
              <span className="font-semibold font-mono">92%</span>
            </div>
            <div className="w-full bg-muted/50 rounded-full h-1.5 overflow-hidden">
              <div className="bg-primary h-1.5 rounded-full" style={{ width: '92%' }} />
            </div>
          </div>
        </div>

        {/* Right Panel: AI Coach Dialog */}
        <div className="lg:col-span-7 p-6 flex flex-col justify-between min-h-[320px]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              <h4 className="font-semibold text-sm">AI Interview Simulator</h4>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground">latency: 42ms</span>
          </div>

          {/* Chat feed */}
          <div className="flex-1 space-y-3 overflow-y-auto max-h-[200px] pr-2 text-xs scrollbar-thin">
            <AnimatePresence>
              {chatMessages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex flex-col max-w-[85%] rounded-xl p-3 border",
                    msg.sender === 'ai' 
                      ? "bg-muted/30 border-border/40 self-start mr-auto" 
                      : "bg-primary text-primary-foreground border-transparent self-end ml-auto"
                  )}
                >
                  <span className="text-[9px] uppercase tracking-wider font-semibold opacity-60 mb-1">
                    {msg.sender === 'ai' ? 'AI COACH' : 'YOU'}
                  </span>
                  <p className="leading-relaxed">{msg.text}</p>
                </motion.div>
              ))}
              {isTyping && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-muted/30 border border-border/40 self-start mr-auto rounded-xl p-3 max-w-[85%] flex items-center gap-1.5"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Action indicator */}
          <div className="mt-4 pt-4 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
              </span>
              Simulating audio assessment feedback...
            </span>
            <Play className="h-3 w-3 cursor-pointer hover:text-primary transition-colors" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Custom FAQ Accordion Item
function FAQItem({ question, answer }: { question: string, answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-border/50 py-4 transition-all duration-200">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between py-2 text-left font-medium hover:text-primary transition-colors"
      >
        <span className="text-base md:text-lg font-semibold">{question}</span>
        <div className={cn("p-1 rounded-md hover:bg-muted/60 transition-colors")}>
          <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform duration-300", isOpen && "rotate-180")} />
        </div>
      </button>
      <motion.div
        initial={false}
        animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="overflow-hidden"
      >
        <p className="pb-4 pt-2 text-muted-foreground text-sm md:text-base leading-relaxed">{answer}</p>
      </motion.div>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/20 relative">
      
      {/* Animated Mesh Gradients / Blurs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        {/* Glow blobs */}
        <motion.div 
          animate={{
            scale: [1, 1.1, 0.9, 1],
            x: [0, 50, -30, 0],
            y: [0, -30, 40, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[20%] left-[10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]"
        />
        <motion.div 
          animate={{
            scale: [1, 0.9, 1.1, 1],
            x: [0, -40, 50, 0],
            y: [0, 40, -30, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-[40%] right-[5%] w-[450px] h-[450px] bg-purple-500/5 rounded-full blur-[100px]"
        />
        
        {/* Grid Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#00000010_1px,transparent_1px)] dark:bg-[radial-gradient(#ffffff04_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_60%,transparent_100%)]" />
      </div>

      {/* Navigation */}
      <nav className="glass-panel sticky top-0 z-50 border-b border-border/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-premium hover:scale-[1.03] transition-transform">
              <Sparkle className="h-5 w-5 text-primary-foreground animate-pulse" />
            </div>
            <span className="font-bold text-lg tracking-tight">CareerAI</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-xs hover:bg-muted/80 font-semibold px-4">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="text-xs font-semibold gap-1 px-4 shadow-premium hover:shadow-premium-hover">
                Get Started
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 md:pt-32 md:pb-24">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center text-center max-w-4xl mx-auto"
          >
            <motion.div variants={itemVariants}>
              <Badge variant="outline" className="mb-6 px-4 py-1.5 text-xs font-semibold border-border/80 gap-1.5 bg-background/50 backdrop-blur-sm shadow-sm select-none">
                <Zap className="h-3.5 w-3.5 text-primary animate-pulse" />
                Next Generation Career Copilot
              </Badge>
            </motion.div>

            <motion.h1 
              variants={itemVariants}
              className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight mb-6 bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text text-transparent leading-[1.1] max-w-3xl"
            >
              Ace Your Career Journey with AI Insights
            </motion.h1>

            <motion.p 
              variants={itemVariants}
              className="text-base sm:text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl font-medium leading-relaxed"
            >
              Seamlessly optimize your resume for ATS tracking systems, rehearse video and audio interviews with context-aware AI coaches, and skyrocket your job callbacks.
            </motion.p>

            <motion.div 
              variants={itemVariants}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto"
            >
              <Link href="/register" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto gap-2 text-sm font-semibold h-12 px-8 shadow-premium hover:shadow-premium-hover">
                  Start Your Free Trial
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-sm font-semibold h-12 px-8 border-border/80 bg-background/30 backdrop-blur-sm">
                  Sign In
                </Button>
              </Link>
            </motion.div>

            <motion.p 
              variants={itemVariants}
              className="text-xs text-muted-foreground mt-6 flex items-center justify-center gap-1.5 font-medium"
            >
              <Shield className="h-3.5 w-3.5" />
              No credit card required • Free tier included
            </motion.p>

            {/* Interactive Preview Element */}
            <motion.div 
              variants={itemVariants}
              className="w-full mt-16 md:mt-24 max-w-5xl relative z-10"
            >
              <div className="absolute -inset-1.5 bg-gradient-to-tr from-primary/20 via-purple-500/10 to-transparent rounded-2xl blur-lg opacity-80 -z-10" />
              <LivePreview />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats / Numbers Section */}
      <section className="py-12 border-y border-border/40 bg-muted/10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '15,000+', label: 'Resumes Analyzed' },
              { value: '75,000+', label: 'Questions Rehearsed' },
              { value: '98%', label: 'Offer Satisfaction' },
              { value: '3.1x', label: 'Callback Increase' }
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08, type: "spring" }}
                className="text-center"
              >
                <div className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-foreground mb-1 font-mono tracking-tight">
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground font-semibold uppercase tracking-wider">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section className="py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto mb-16"
          >
            <Badge variant="outline" className="mb-4">Features</Badge>
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4 tracking-tight">
              An Enterprise Toolchain for Job Hunting
            </h2>
            <p className="text-muted-foreground font-medium text-sm md:text-base leading-relaxed">
              We leverage advanced LLM intelligence and semantic evaluation metrics to build features that mimic recruiters, resume reviewers, and seasoned career advisors.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, type: "spring" }}
                className="h-full"
              >
                <Card variant="interactive" className="h-full group border-border/60">
                  <CardContent className="pt-8 pb-8 flex flex-col justify-between h-full">
                    <div>
                      <div className="h-12 w-12 rounded-xl bg-primary/5 dark:bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 group-hover:scale-[1.05] transition-transform">
                        <feature.icon className="h-5.5 w-5.5 text-primary" />
                      </div>
                      <h3 className="text-lg md:text-xl font-bold mb-3 tracking-tight">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground font-medium leading-relaxed mb-6">{feature.description}</p>
                    </div>
                    <Badge variant="outline" className="w-fit text-[10px] font-semibold">{feature.badge}</Badge>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 md:py-32 border-t border-border/40 bg-muted/5">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto mb-20"
          >
            <Badge variant="outline" className="mb-4">Workflow</Badge>
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4 tracking-tight">
              Three Steps to Your Dream Offer
            </h2>
            <p className="text-muted-foreground font-medium text-sm md:text-base leading-relaxed">
              We design workflows built on iteration. Refine your profiles step-by-step and track metrics continuously.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.12 }}
                className="relative flex flex-col items-start p-6 rounded-2xl bg-card/40 border border-border/40 backdrop-blur-sm"
              >
                <span className="text-4xl md:text-5xl font-extrabold font-mono text-primary/10 mb-6">{step.number}</span>
                <h3 className="text-lg font-bold mb-2 tracking-tight">{step.title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground font-medium leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 md:py-32 border-t border-border/40">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto mb-16"
          >
            <Badge variant="outline" className="mb-4">Social Proof</Badge>
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4 tracking-tight">
              Loved by Top Professionals
            </h2>
            <p className="text-muted-foreground font-medium text-sm md:text-base leading-relaxed">
              Discover how engineers, product experts, and designers leverage CareerAI to shift fields and close higher comp packages.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {testimonials.map((test, index) => (
              <motion.div
                key={test.author}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="h-full"
              >
                <Card variant="glass" className="h-full flex flex-col justify-between p-6">
                  <div>
                    <div className="flex gap-0.5 mb-4 text-warning">
                      {[...Array(test.rating)].map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 fill-current" />
                      ))}
                    </div>
                    <p className="text-sm font-medium italic text-foreground/80 leading-relaxed mb-6">
                      &ldquo;{test.quote}&rdquo;
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-border/30">
                    <div>
                      <h4 className="text-xs font-bold text-foreground">{test.author}</h4>
                      <p className="text-[10px] text-muted-foreground font-medium">{test.role}</p>
                    </div>
                    <Badge variant="secondary" className="text-[9px] font-mono tracking-tight font-bold">{test.company}</Badge>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 md:py-32 border-t border-border/40 bg-muted/5">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto mb-16"
          >
            <Badge variant="outline" className="mb-4">Pricing</Badge>
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4 tracking-tight">
              Simple, Transparent Pricing
            </h2>
            <p className="text-muted-foreground font-medium text-sm md:text-base leading-relaxed">
              No hidden fees, no complicated agreements. Upgrade, downgrade, or cancel your subscription at any time.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Tier */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex"
            >
              <Card variant="glass" className="w-full p-8 flex flex-col justify-between border-border/60">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold tracking-tight">Basic Core</h3>
                    <Badge variant="outline" className="text-[10px]">Free Forever</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-6 font-medium">Perfect for building your initial profile and experiencing AI coaching features.</p>
                  <div className="flex items-baseline gap-1 mb-8">
                    <span className="text-4xl font-extrabold font-mono tracking-tight">$0</span>
                    <span className="text-xs text-muted-foreground font-semibold">/ month</span>
                  </div>
                  <ul className="space-y-3.5 text-xs text-muted-foreground font-semibold mb-8">
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      3 Resume Scoring reports / mo
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      2 AI Interview coach sessions / mo
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Standard learning path guides
                    </li>
                  </ul>
                </div>
                <Link href="/register" className="w-full">
                  <Button variant="outline" className="w-full font-semibold h-11 border-border/80 bg-background/50">
                    Get Started Free
                  </Button>
                </Link>
              </Card>
            </motion.div>

            {/* Pro Tier */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex relative"
            >
              {/* Highlight Gradient Outline */}
              <div className="absolute -inset-[1.5px] bg-gradient-to-r from-primary via-purple-500 to-indigo-500 rounded-2xl blur-[1.5px] -z-10" />
              <Card variant="glass" className="w-full p-8 flex flex-col justify-between border-transparent bg-background/95 dark:bg-card/95">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold tracking-tight">Career Pro</h3>
                    <Badge variant="success" className="text-[10px] uppercase font-semibold">Popular Choice</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-6 font-medium">Unleash our complete suite of semantic ATS matching and unlimited audio coach sessions.</p>
                  <div className="flex items-baseline gap-1 mb-8">
                    <span className="text-4xl font-extrabold font-mono tracking-tight">$19</span>
                    <span className="text-xs text-muted-foreground font-semibold">/ month</span>
                  </div>
                  <ul className="space-y-3.5 text-xs text-foreground font-semibold mb-8">
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-primary fill-primary/10" />
                      Unlimited ATS Resume Scans
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-primary fill-primary/10" />
                      Unlimited AI Coach practice (Text & Audio)
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-primary fill-primary/10" />
                      Custom role and salary gap roadmaps
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-primary fill-primary/10" />
                      Priority API processing & early model access
                    </li>
                  </ul>
                </div>
                <Link href="/register" className="w-full">
                  <Button className="w-full font-semibold h-11 shadow-premium hover:shadow-premium-hover">
                    Upgrade to Pro
                  </Button>
                </Link>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Accordion FAQ Section */}
      <section className="py-20 md:py-32 border-t border-border/40">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge variant="outline" className="mb-4">FAQ</Badge>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Frequently Asked Questions
            </h2>
          </motion.div>

          <div className="space-y-1">
            {faqs.map((faq, i) => (
              <FAQItem key={i} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>
      </section>

      {/* Enterprise CTA Section */}
      <section className="py-20 md:py-32 border-t border-border/40 relative overflow-hidden bg-muted/10">
        <div className="absolute inset-0 pointer-events-none -z-10 flex items-center justify-center">
          <div className="w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] opacity-80" />
        </div>
        
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col items-center"
          >
            <h2 className="text-3xl md:text-5xl font-extrabold mb-6 tracking-tight">
              Accelerate Your Career Today
            </h2>
            <p className="text-base md:text-lg text-muted-foreground mb-10 max-w-xl font-medium leading-relaxed">
              Don&apos;t leave your dream job to chance. Clean up your resume filters and enter interviews prepared with insights from CareerAI.
            </p>
            <Link href="/register">
              <Button size="lg" className="gap-2 text-sm font-semibold h-12 px-10 shadow-premium hover:shadow-premium-hover">
                Get Started for Free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-16 bg-muted/15 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            {/* Branding Column */}
            <div className="col-span-2 md:col-span-1 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
                  <Sparkle className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-bold tracking-tight">CareerAI</span>
              </div>
              <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                Next-generation career optimization tools mapping resumes to candidate profiles.
              </p>
            </div>
            
            {/* Sitemap columns */}
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider mb-4">Product</h5>
              <ul className="space-y-2.5 text-xs text-muted-foreground font-medium">
                <li><Link href="#features" className="hover:text-foreground transition-colors">ATS Scanner</Link></li>
                <li><Link href="#features" className="hover:text-foreground transition-colors">AI Coaching</Link></li>
                <li><Link href="#pricing" className="hover:text-foreground transition-colors">Pricing</Link></li>
              </ul>
            </div>

            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider mb-4">Resources</h5>
              <ul className="space-y-2.5 text-xs text-muted-foreground font-medium">
                <li><Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
                <li><Link href="/contact" className="hover:text-foreground transition-colors">Contact Support</Link></li>
              </ul>
            </div>

            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider mb-4">Company</h5>
              <ul className="space-y-2.5 text-xs text-muted-foreground font-medium font-mono">
                <li className="flex items-center gap-1.5"><Lock className="h-3 w-3" /> Security Policy</li>
                <li>© {new Date().getFullYear()} CareerAI.</li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-border/20 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground font-medium">
            <p>Designed in compliance with modern SaaS standards.</p>
            <div className="flex gap-4">
              <Link href="/terms" className="hover:underline">Terms</Link>
              <Link href="/privacy" className="hover:underline">Privacy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
