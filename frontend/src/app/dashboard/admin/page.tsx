'use client';

/**
 * Admin Dashboard Page
 * 
 * Displays platform-wide statistics, user management,
 * and analytics charts. Only accessible to admin users.
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { adminApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Users,
  FileText,
  MessageSquare,
  TrendingUp,
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  Shield,
  ShieldOff,
  BarChart3,
  Activity,
  UserCheck,
  Crown,
  AlertTriangle,
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

interface DashboardStats {
  overview: {
    totalUsers: number;
    totalResumes: number;
    totalInterviews: number;
    completedInterviews: number;
    avgAtsScore: number;
    avgInterviewScore: number;
    newUsersToday: number;
    newUsersThisWeek: number;
    activeUsersToday: number;
    proUsers: number;
    enterpriseUsers: number;
    verifiedUsers: number;
    resumesAnalyzed: number;
  };
  charts: {
    dailySignups: { _id: string; count: number }[];
    dailyInterviews: { _id: string; count: number }[];
  };
  recentSignups: {
    _id: string;
    name: string;
    email: string;
    createdAt: string;
    subscription?: { plan: string };
  }[];
}

interface UserItem {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: string;
  subscription?: { plan: string };
  resumeCount: number;
  interviewCount: number;
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  useEffect(() => {
    fetchStats();
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [page]);

  const fetchStats = async () => {
    try {
      const response = await adminApi.getStats();
      setStats(response.data.data);
    } catch (error: any) {
      if (error.response?.status === 403) {
        toast.error('Access denied. Admin privileges required.');
      } else {
        toast.error('Failed to load dashboard stats');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async (searchQuery?: string) => {
    setUsersLoading(true);
    try {
      const response = await adminApi.getUsers({
        page,
        limit: 10,
        search: searchQuery || search || undefined,
      });
      setUsers(response.data.data.users || []);
      setTotalPages(response.data.data.pagination?.totalPages || 1);
      setTotalUsers(response.data.data.pagination?.total || 0);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers(search);
  };

  const handleToggleStatus = async (userId: string) => {
    try {
      await adminApi.toggleUserStatus(userId);
      fetchUsers();
      toast.success('User status updated');
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <AlertTriangle className="h-12 w-12 text-yellow-500" />
        <h2 className="text-xl font-semibold">Access Denied</h2>
        <p className="text-muted-foreground">You need admin privileges to view this page.</p>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Users', value: stats.overview.totalUsers, icon: Users, color: 'text-blue-600' },
    { label: 'Total Resumes', value: stats.overview.totalResumes, icon: FileText, color: 'text-green-600' },
    { label: 'Total Interviews', value: stats.overview.totalInterviews, icon: MessageSquare, color: 'text-purple-600' },
    { label: 'Avg ATS Score', value: `${Math.round(stats.overview.avgAtsScore || 0)}%`, icon: TrendingUp, color: 'text-amber-600' },
    { label: 'New Today', value: stats.overview.newUsersToday, icon: UserCheck, color: 'text-emerald-600' },
    { label: 'Pro Users', value: stats.overview.proUsers, icon: Crown, color: 'text-indigo-600' },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
            <Shield className="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Platform overview and user management</p>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat, i) => (
          <motion.div key={stat.label} variants={itemVariants}>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-3xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={cn('h-12 w-12 rounded-full bg-muted flex items-center justify-center', stat.color)}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Daily Signups Chart */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Daily Signups (Last 30 days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48 flex items-end gap-1">
                {stats.charts.dailySignups.length > 0 ? (
                  stats.charts.dailySignups.map((day, i) => {
                    const maxCount = Math.max(...stats.charts.dailySignups.map(d => d.count), 1);
                    const height = (day.count / maxCount) * 100;
                    return (
                      <div
                        key={day._id}
                        className="flex-1 group relative"
                        title={`${day._id}: ${day.count} signups`}
                      >
                        <div
                          className="bg-blue-500/80 hover:bg-blue-600 rounded-t-sm transition-colors mx-px"
                          style={{ height: `${Math.max(height, 2)}%` }}
                        />
                        <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 bg-popover border rounded-md p-2 text-xs shadow-md z-10 whitespace-nowrap">
                          <div className="font-medium">{day.count} signups</div>
                          <div className="text-muted-foreground">{day._id}</div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground">
                    No data yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Daily Interviews Chart */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Daily Interviews (Last 30 days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48 flex items-end gap-1">
                {stats.charts.dailyInterviews.length > 0 ? (
                  stats.charts.dailyInterviews.map((day, i) => {
                    const maxCount = Math.max(...stats.charts.dailyInterviews.map(d => d.count), 1);
                    const height = (day.count / maxCount) * 100;
                    return (
                      <div
                        key={day._id}
                        className="flex-1 group relative"
                        title={`${day._id}: ${day.count} interviews`}
                      >
                        <div
                          className="bg-purple-500/80 hover:bg-purple-600 rounded-t-sm transition-colors mx-px"
                          style={{ height: `${Math.max(height, 2)}%` }}
                        />
                        <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 bg-popover border rounded-md p-2 text-xs shadow-md z-10 whitespace-nowrap">
                          <div className="font-medium">{day.count} interviews</div>
                          <div className="text-muted-foreground">{day._id}</div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground">
                    No data yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Signups */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle>Recent Signups</CardTitle>
            <CardDescription>Latest users who joined the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentSignups.map((user) => (
                <div key={user._id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {user.subscription?.plan || 'free'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Separator />

      {/* User Management */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle>User Management</CardTitle>
                <CardDescription>{totalUsers} total users</CardDescription>
              </div>
              <form onSubmit={handleSearch} className="flex gap-2 max-w-sm">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button type="submit" size="sm">
                  Search
                </Button>
              </form>
            </div>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-3 font-medium">User</th>
                        <th className="pb-3 font-medium">Plan</th>
                        <th className="pb-3 font-medium">Resumes</th>
                        <th className="pb-3 font-medium">Interviews</th>
                        <th className="pb-3 font-medium">Verified</th>
                        <th className="pb-3 font-medium">Status</th>
                        <th className="pb-3 font-medium">Joined</th>
                        <th className="pb-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {users.map((userItem) => (
                        <tr key={userItem._id} className="hover:bg-muted/30">
                          <td className="py-3">
                            <div>
                              <p className="font-medium">{userItem.name}</p>
                              <p className="text-xs text-muted-foreground">{userItem.email}</p>
                            </div>
                          </td>
                          <td className="py-3">
                            <Badge variant={
                              userItem.subscription?.plan === 'pro' ? 'default' :
                              userItem.subscription?.plan === 'enterprise' ? 'secondary' : 'outline'
                            }>
                              {userItem.subscription?.plan || 'free'}
                            </Badge>
                          </td>
                          <td className="py-3">{userItem.resumeCount || 0}</td>
                          <td className="py-3">{userItem.interviewCount || 0}</td>
                          <td className="py-3">
                            {userItem.isEmailVerified ? (
                              <Badge variant="outline" className="text-green-600 border-green-200 dark:border-green-800">Yes</Badge>
                            ) : (
                              <Badge variant="outline" className="text-yellow-600 border-yellow-200 dark:border-yellow-800">No</Badge>
                            )}
                          </td>
                          <td className="py-3">
                            {userItem.isActive !== false ? (
                              <Badge variant="outline" className="text-green-600 border-green-200 dark:border-green-800">Active</Badge>
                            ) : (
                              <Badge variant="outline" className="text-red-600 border-red-200 dark:border-red-800">Disabled</Badge>
                            )}
                          </td>
                          <td className="py-3 text-xs text-muted-foreground">
                            {new Date(userItem.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleStatus(userItem._id)}
                              className="gap-1"
                              title={userItem.isActive !== false ? 'Disable user' : 'Enable user'}
                            >
                              {userItem.isActive !== false ? (
                                <ShieldOff className="h-4 w-4 text-red-500" />
                              ) : (
                                <Shield className="h-4 w-4 text-green-500" />
                              )}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Page {page} of {totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page <= 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
