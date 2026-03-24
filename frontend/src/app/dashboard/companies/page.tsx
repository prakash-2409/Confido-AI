'use client';

/**
 * Company-Specific Interview Practice Page (P3 - Growth Feature)
 * 
 * Browse companies and practice with company-specific questions.
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { growthApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Loader2,
  Search,
  Building2,
  MessageSquare,
  Star,
  ChevronRight,
  Briefcase,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

// Popular companies (placeholder data for empty state)
const popularCompanies = [
  { name: 'Google', roles: ['Software Engineer', 'Product Manager'], color: 'bg-blue-500' },
  { name: 'Meta', roles: ['Frontend Engineer', 'ML Engineer'], color: 'bg-indigo-500' },
  { name: 'Amazon', roles: ['SDE', 'Solutions Architect'], color: 'bg-amber-500' },
  { name: 'Apple', roles: ['iOS Developer', 'Hardware Engineer'], color: 'bg-gray-500' },
  { name: 'Microsoft', roles: ['Software Engineer', 'PM'], color: 'bg-green-500' },
  { name: 'Netflix', roles: ['Senior SWE', 'Data Engineer'], color: 'bg-red-500' },
];

export default function CompanyInterviewsPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [interviewsLoading, setInterviewsLoading] = useState(false);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async (searchQuery?: string) => {
    setIsLoading(true);
    try {
      const response = await growthApi.getCompanies(searchQuery);
      setCompanies(response.data.data.companies || []);
    } catch (error) {
      console.error('Failed to fetch companies:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCompanies(search);
  };

  const handleSelectCompany = async (company: string) => {
    setSelectedCompany(company);
    setInterviewsLoading(true);
    try {
      const response = await growthApi.getCompanyInterviews(company);
      setInterviews(response.data.data.interviews || []);
    } catch (error) {
      console.error('Failed to fetch interviews:', error);
    } finally {
      setInterviewsLoading(false);
    }
  };

  if (selectedCompany) {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        <motion.div variants={itemVariants}>
          <Button variant="ghost" onClick={() => setSelectedCompany(null)} className="gap-2 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Companies
          </Button>
          <h1 className="text-3xl font-bold">{selectedCompany} Interviews</h1>
          <p className="text-muted-foreground mt-1">
            Practice with {selectedCompany}-specific interview questions
          </p>
        </motion.div>

        {interviewsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : interviews.length === 0 ? (
          <motion.div variants={itemVariants}>
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Building2 className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Coming Soon!</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  We&apos;re building a database of {selectedCompany}-specific interview questions.
                  Check back soon or contribute your own experience!
                </p>
                <Badge variant="secondary" className="mt-4 gap-1">
                  <Sparkles className="h-3 w-3" />
                  AI-generated questions coming soon
                </Badge>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div className="grid gap-4">
            {interviews.map((interview: any) => (
              <motion.div key={interview._id} variants={itemVariants}>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{interview.role}</CardTitle>
                      <Badge variant={
                        interview.difficulty === 'easy' ? 'secondary' :
                        interview.difficulty === 'hard' ? 'destructive' : 'default'
                      }>
                        {interview.difficulty}
                      </Badge>
                    </div>
                    <CardDescription>
                      {interview.interviewStyle} • {interview.questions?.length || 0} questions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {interview.interviewProcess?.tips && (
                      <div className="space-y-1 mb-4">
                        {interview.interviewProcess.tips.slice(0, 3).map((tip: string, i: number) => (
                          <p key={i} className="text-sm text-muted-foreground">• {tip}</p>
                        ))}
                      </div>
                    )}
                    <Button variant="outline" className="gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Start Practice
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Building2 className="h-8 w-8 text-primary" />
          Company Interviews
        </h1>
        <p className="text-muted-foreground mt-1">
          Practice with company-specific interview questions
        </p>
      </motion.div>

      {/* Search */}
      <motion.div variants={itemVariants}>
        <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search companies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit">Search</Button>
        </form>
      </motion.div>

      {/* Companies from DB */}
      {companies.length > 0 && (
        <div>
          <h3 className="font-medium mb-4">Available Companies</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {companies.map((company: any) => (
              <motion.div key={company._id} variants={itemVariants}>
                <Card
                  className="cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => handleSelectCompany(company._id)}
                >
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium">{company._id}</h4>
                          <p className="text-xs text-muted-foreground">
                            {company.totalQuestions} questions • {company.roles?.length || 0} roles
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Popular Companies (Placeholder / Coming Soon) */}
      <div>
        <h3 className="font-medium mb-4">Popular Companies</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {popularCompanies.map((company) => (
            <motion.div key={company.name} variants={itemVariants}>
              <Card
                className="cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => handleSelectCompany(company.name)}
              >
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn('h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm', company.color)}>
                        {company.name[0]}
                      </div>
                      <div>
                        <h4 className="font-medium">{company.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {company.roles.join(', ')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs gap-1">
                        <Sparkles className="h-3 w-3" />
                        Coming Soon
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
