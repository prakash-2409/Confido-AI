'use client';

/**
 * Landing Page
 * 
 * Public homepage with hero section, features, and CTA
 * Design: Inspired by Linear, Vercel, and Stripe
 */

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FileSearch, 
  MessageSquare, 
  TrendingUp, 
  Sparkles, 
  ArrowRight,
  CheckCircle2,
  Zap,
  Shield,
  Target,
  BarChart3,
  Users,
  Star,
} from 'lucide-react';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const features = [
  {
    icon: FileSearch,
    title: 'ATS Resume Scanner',
    description: 'Get your resume scored against any job description. See exactly what keywords you\'re missing and how to improve.',
    color: 'bg-blue-500',
  },
  {
    icon: MessageSquare,
    title: 'AI Interview Practice',
    description: 'Practice with AI-generated questions tailored to your target role. Get instant, personalized feedback.',
    color: 'bg-purple-500',
  },
  {
    icon: TrendingUp,
    title: 'Progress Tracking',
    description: 'Track your improvement over time. Watch your resume scores and interview performance grow.',
    color: 'bg-emerald-500',
  },
];

const benefits = [
  'Instant ATS compatibility score',
  'Keyword gap analysis',
  'Role-specific interview questions',
  'Personalized improvement tips',
  'Performance analytics',
  'No credit card required',
];

const stats = [
  { value: '10K+', label: 'Resumes Analyzed' },
  { value: '50K+', label: 'Interview Questions' },
  { value: '95%', label: 'User Satisfaction' },
  { value: '2.5x', label: 'More Callbacks' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/25 group-hover:shadow-primary/40 transition-shadow">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">CareerAI</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="gap-2">
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 py-20 md:py-32">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-4xl mx-auto text-center"
          >
            <motion.div variants={itemVariants}>
              <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm">
                <Zap className="h-4 w-4 mr-2 text-primary" />
                AI-Powered Career Preparation
              </Badge>
            </motion.div>

            <motion.h1 
              variants={itemVariants}
              className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6"
            >
              Land Your Dream Job with{' '}
              <span className="text-primary relative">
                AI-Powered
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                  <path d="M2 10C50 4 100 2 150 4C200 6 250 4 298 8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-primary/30"/>
                </svg>
              </span>
              {' '}Insights
            </motion.h1>

            <motion.p 
              variants={itemVariants}
              className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto"
            >
              Optimize your resume for ATS systems, practice interviews with AI, 
              and track your progress—all in one powerful platform.
            </motion.p>

            <motion.div 
              variants={itemVariants}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link href="/register">
                <Button size="lg" className="gap-2 text-base h-12 px-8">
                  Start Free Trial
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="gap-2 text-base h-12 px-8">
                  Sign In
                </Button>
              </Link>
            </motion.div>

            <motion.p 
              variants={itemVariants}
              className="text-sm text-muted-foreground mt-4 flex items-center justify-center gap-2"
            >
              <Shield className="h-4 w-4" />
              No credit card required • Free forever plan available
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y bg-muted/30">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold text-primary mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge variant="outline" className="mb-4">Features</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our AI-powered tools help you optimize every aspect of your job search, 
              from resume writing to interview preparation.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="pt-8 pb-8">
                    <div className={`h-14 w-14 rounded-2xl ${feature.color} flex items-center justify-center mb-6`}>
                      <feature.icon className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 md:py-32 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Badge variant="outline" className="mb-4">Why CareerAI</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Built for Job Seekers, <br />
                <span className="text-primary">Powered by AI</span>
              </h2>
              <p className="text-muted-foreground mb-8">
                Our platform combines cutting-edge AI technology with proven career 
                development strategies to help you stand out in today&apos;s competitive job market.
              </p>
              <div className="grid gap-3">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={benefit}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-3"
                  >
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    </div>
                    <span>{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              {/* Mock Dashboard Preview */}
              <div className="bg-background rounded-2xl shadow-2xl border p-6 relative">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-3 w-3 rounded-full bg-red-400" />
                  <div className="h-3 w-3 rounded-full bg-yellow-400" />
                  <div className="h-3 w-3 rounded-full bg-green-400" />
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-32 bg-muted rounded" />
                    <div className="h-8 w-24 bg-primary/10 rounded" />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="h-20 bg-muted/50 rounded-lg" />
                    <div className="h-20 bg-muted/50 rounded-lg" />
                    <div className="h-20 bg-muted/50 rounded-lg" />
                  </div>
                  <div className="h-32 bg-muted/30 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-primary mb-1">85%</div>
                      <div className="text-sm text-muted-foreground">ATS Score</div>
                    </div>
                  </div>
                </div>
                {/* Decorative elements */}
                <div className="absolute -top-4 -right-4 h-24 w-24 bg-primary/10 rounded-full blur-2xl" />
                <div className="absolute -bottom-4 -left-4 h-32 w-32 bg-purple-500/10 rounded-full blur-2xl" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Accelerate Your Career?
            </h2>
            <p className="text-xl text-muted-foreground mb-10">
              Join thousands of job seekers who have improved their interview performance 
              and landed their dream jobs with CareerAI.
            </p>
            <Link href="/register">
              <Button size="lg" className="gap-2 text-base h-12 px-8">
                Get Started for Free
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">CareerAI</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">
                Terms of Service
              </Link>
              <Link href="/contact" className="hover:text-foreground transition-colors">
                Contact
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} CareerAI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
