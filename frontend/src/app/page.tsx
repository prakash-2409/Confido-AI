'use client';

/**
 * Landing Page
 * 
 * Public homepage with hero section and CTA
 */

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  FileSearch, 
  MessageSquare, 
  TrendingUp, 
  Sparkles, 
  ArrowRight,
  CheckCircle2,
  Zap,
  Shield
} from 'lucide-react';

const features = [
  {
    icon: FileSearch,
    title: 'ATS Resume Scanner',
    description: 'Get your resume scored against any job description. See exactly what keywords you\'re missing.',
  },
  {
    icon: MessageSquare,
    title: 'Interview Practice',
    description: 'Practice with AI-generated questions tailored to your target role. Get instant feedback.',
  },
  {
    icon: TrendingUp,
    title: 'Career Insights',
    description: 'Track your progress over time. See how your resume improves with each iteration.',
  },
];

const benefits = [
  'Instant ATS compatibility score',
  'Keyword gap analysis',
  'Role-specific interview questions',
  'Actionable improvement tips',
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Navigation */}
      <nav className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">CareerAI</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Zap className="h-4 w-4" />
            AI-Powered Career Tools
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Land Your Dream Job with{' '}
            <span className="text-primary">AI-Powered</span> Resume Analysis
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Stop guessing if your resume will pass ATS filters. Get instant feedback, 
            keyword analysis, and interview prep — all in one platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="gap-2 w-full sm:w-auto">
                Start Free Analysis
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Login to Dashboard
              </Button>
            </Link>
          </div>
          
          {/* Trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-12 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-500" />
              <span>Your data is secure</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-green-500" />
              <span>Results in seconds</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20 border-t">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Everything You Need to Succeed</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            From resume optimization to interview prep, we&apos;ve got you covered.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <Card key={index} className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-4 py-20 border-t">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-6">Why Choose CareerAI?</h2>
            <p className="text-muted-foreground mb-8">
              Most resumes get rejected by ATS before a human ever sees them. 
              Our AI analyzes your resume against real job descriptions to maximize 
              your chances of getting past the filter.
            </p>
            <ul className="space-y-4">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
            <Link href="/register" className="inline-block mt-8">
              <Button size="lg" className="gap-2">
                Try It Free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10">
            <div className="text-center">
              <div className="text-6xl font-bold text-primary mb-2">85%</div>
              <p className="text-muted-foreground">
                Average ATS score improvement after using our recommendations
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 border-t">
        <Card className="max-w-3xl mx-auto text-center p-8 md:p-12 bg-primary text-primary-foreground">
          <CardHeader>
            <CardTitle className="text-3xl">Ready to Land Your Dream Job?</CardTitle>
            <CardDescription className="text-primary-foreground/80 text-lg">
              Join thousands of job seekers who&apos;ve improved their chances with CareerAI.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/register">
              <Button size="lg" variant="secondary" className="gap-2">
                Get Started for Free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} CareerAI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
