import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShieldCheck, GitCompareArrows, LineChart, Brain, Target, Bot, CheckCircle2 } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg tracking-tight">Confido AI</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <Link href="#features" className="hover:text-foreground transition-colors">Features</Link>
            <Link href="#evidence-engine" className="hover:text-foreground transition-colors">Evidence Engine</Link>
            <Link href="#pricing" className="hover:text-foreground transition-colors">Pricing</Link>
          </nav>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/login" className="hidden sm:inline-flex text-sm font-medium hover:text-primary transition-colors">
              Sign in
            </Link>
            <Link href="/register">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-24 md:py-32 lg:py-40 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
          
          <div className="container mx-auto px-4 relative">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                <Target className="h-4 w-4" />
                The New Standard in Hiring Intelligence
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-balance leading-tight">
                Hire with evidence,<br className="hidden md:block" /> not resumes.
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-balance leading-relaxed">
                Confido AI validates candidate skills through multi-source evidence collection, cross-referencing GitHub, interviews, and assessments to give you absolute confidence in every hire.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Link href="/register">
                  <Button size="lg" className="w-full sm:w-auto h-12 px-8 text-base">
                    Start Hiring Smarter
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto h-12 px-8 text-base group">
                    Explore Platform
                    <GitCompareArrows className="ml-2 h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </Button>
                </Link>
              </div>

              <div className="pt-12 text-sm text-muted-foreground font-medium flex items-center justify-center gap-8 opacity-70">
                <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Multi-source verification</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Explainable AI</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Bias-resistant</div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section id="features" className="py-24 bg-muted/30 border-y border-border">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mb-16">
              <h2 className="text-3xl font-bold tracking-tight mb-4">Intelligence built for hiring teams</h2>
              <p className="text-lg text-muted-foreground">Move beyond keyword matching and resume parsing. Confido AI analyzes the complete candidate profile to surface true signal over noise.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-background rounded-2xl p-8 border border-border shadow-sm">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                  <ShieldCheck className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Evidence Engine</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Automatically collect and verify skills across resumes, GitHub repositories, technical blogs, and interview performance. Every claim gets a confidence score with explainable reasoning.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-background rounded-2xl p-8 border border-border shadow-sm">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                  <GitCompareArrows className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Dimensional Comparison</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Compare shortlisted candidates side-by-side across 6 distinct dimensions, including technical depth, problem-solving, communication, and learning velocity.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-background rounded-2xl p-8 border border-border shadow-sm">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                  <Bot className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">AI Recruiter Copilot</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Chat with your candidate database. Ask natural language questions like &quot;Who has verified Docker experience in production?&quot; or &quot;Compare the top 3 backend candidates.&quot;
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-background border-t border-border py-12 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <ShieldCheck className="h-5 w-5 text-muted-foreground" />
            <span className="font-semibold text-muted-foreground">Confido AI</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Confido AI. Evidence-based hiring intelligence.
          </p>
        </div>
      </footer>
    </div>
  );
}
