'use client';

/**
 * Personalized Learning Roadmap Page (P3 - Growth Feature)
 * 
 * Displays AI-generated learning roadmaps with milestone tracking.
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { growthApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  Loader2,
  Map,
  Plus,
  CheckCircle2,
  Circle,
  Clock,
  BookOpen,
  Target,
  Sparkles,
  ChevronRight,
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

const statusColors: Record<string, string> = {
  not_started: 'text-gray-400',
  in_progress: 'text-blue-500',
  completed: 'text-green-500',
  skipped: 'text-yellow-500',
};

const statusIcons: Record<string, React.ReactNode> = {
  not_started: <Circle className="h-5 w-5" />,
  in_progress: <Clock className="h-5 w-5" />,
  completed: <CheckCircle2 className="h-5 w-5" />,
};

export default function RoadmapPage() {
  const [roadmaps, setRoadmaps] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [targetRole, setTargetRole] = useState('');
  const [selectedRoadmap, setSelectedRoadmap] = useState<any>(null);

  useEffect(() => {
    fetchRoadmaps();
  }, []);

  const fetchRoadmaps = async () => {
    try {
      const response = await growthApi.getRoadmaps();
      setRoadmaps(response.data.data.roadmaps || []);
    } catch (error) {
      console.error('Failed to fetch roadmaps:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!targetRole.trim()) {
      toast.error('Please enter a target role');
      return;
    }
    setIsCreating(true);
    try {
      const response = await growthApi.createRoadmap({ targetRole });
      const newRoadmap = response.data.data.roadmap;
      setRoadmaps(prev => [newRoadmap, ...prev]);
      setSelectedRoadmap(newRoadmap);
      setShowCreate(false);
      setTargetRole('');
      toast.success('Roadmap created!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create roadmap');
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateMilestone = async (roadmapId: string, milestoneId: string, newStatus: string) => {
    try {
      const response = await growthApi.updateMilestone(roadmapId, milestoneId, newStatus);
      const updatedRoadmap = response.data.data.roadmap;
      setRoadmaps(prev => prev.map(r => r._id === roadmapId ? updatedRoadmap : r));
      if (selectedRoadmap?._id === roadmapId) {
        setSelectedRoadmap(updatedRoadmap);
      }
      toast.success('Progress updated!');
    } catch (error) {
      toast.error('Failed to update milestone');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
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
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Map className="h-8 w-8 text-primary" />
            Learning Roadmap
          </h1>
          <p className="text-muted-foreground mt-1">
            AI-personalized learning paths to reach your career goals
          </p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Roadmap
        </Button>
      </motion.div>

      {/* Create Form */}
      {showCreate && (
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Create Learning Roadmap</CardTitle>
              <CardDescription>Enter your target role and we&apos;ll generate a personalized learning path</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="targetRole">Target Role</Label>
                <Input
                  id="targetRole"
                  placeholder="e.g., Senior Software Engineer, Product Manager"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreate} disabled={isCreating} className="gap-2">
                  {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Generate Roadmap
                </Button>
                <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Roadmap List */}
        <div className="space-y-4">
          <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Your Roadmaps</h3>
          {roadmaps.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Map className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No roadmaps yet. Create one to get started!</p>
              </CardContent>
            </Card>
          ) : (
            roadmaps.map((roadmap) => (
              <Card
                key={roadmap._id}
                className={cn(
                  'cursor-pointer transition-colors hover:bg-muted/30',
                  selectedRoadmap?._id === roadmap._id && 'border-primary bg-primary/5'
                )}
                onClick={() => setSelectedRoadmap(roadmap)}
              >
                <CardContent className="py-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm truncate">{roadmap.title}</h4>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">{roadmap.targetRole}</Badge>
                    <Badge variant="secondary" className="text-xs">{roadmap.status}</Badge>
                  </div>
                  <Progress value={roadmap.completionPercentage || 0} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">{roadmap.completionPercentage || 0}% complete</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Roadmap Details */}
        <div className="lg:col-span-2">
          {selectedRoadmap ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{selectedRoadmap.title}</CardTitle>
                    <CardDescription>
                      {selectedRoadmap.aiInsights?.summary}
                    </CardDescription>
                  </div>
                  <Badge>{selectedRoadmap.estimatedTotalHours}h estimated</Badge>
                </div>
                <Progress value={selectedRoadmap.completionPercentage || 0} className="mt-4" />
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Key Focus Areas */}
                {selectedRoadmap.aiInsights?.keyFocus && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {selectedRoadmap.aiInsights.keyFocus.map((focus: string, i: number) => (
                      <Badge key={i} variant="secondary" className="gap-1">
                        <Target className="h-3 w-3" />
                        {focus}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Milestones */}
                <div className="space-y-3">
                  {selectedRoadmap.milestones?.map((milestone: any) => (
                    <div
                      key={milestone._id}
                      className="flex items-start gap-3 p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                    >
                      <button
                        className={cn('mt-0.5 transition-colors', statusColors[milestone.status])}
                        onClick={() => {
                          const nextStatus = milestone.status === 'completed' ? 'not_started' :
                            milestone.status === 'not_started' ? 'in_progress' : 'completed';
                          handleUpdateMilestone(selectedRoadmap._id, milestone._id, nextStatus);
                        }}
                      >
                        {statusIcons[milestone.status] || <Circle className="h-5 w-5" />}
                      </button>
                      <div className="flex-1">
                        <h4 className={cn(
                          'font-medium',
                          milestone.status === 'completed' && 'line-through text-muted-foreground'
                        )}>
                          {milestone.title}
                        </h4>
                        <p className="text-sm text-muted-foreground">{milestone.description}</p>
                        <div className="flex items-center gap-3 mt-2">
                          {milestone.category && (
                            <Badge variant="outline" className="text-xs">{milestone.category}</Badge>
                          )}
                          {milestone.estimatedHours && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {milestone.estimatedHours}h
                            </span>
                          )}
                          {milestone.priority && (
                            <Badge
                              variant={milestone.priority === 'critical' ? 'destructive' : 'secondary'}
                              className="text-xs"
                            >
                              {milestone.priority}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Select a Roadmap</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  Choose a roadmap from the left to view milestones and track your progress.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </motion.div>
  );
}
