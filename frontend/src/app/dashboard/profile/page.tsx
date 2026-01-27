'use client';

/**
 * User Profile Page
 */

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Target,
  Clock,
  Loader2,
  Save,
  CheckCircle2,
} from 'lucide-react';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    currentRole: user?.currentRole || '',
    targetRole: user?.targetRole || '',
    experienceYears: user?.experienceYears || 0,
  });

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await authApi.updateProfile(formData);
      await refreshUser();
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update profile';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      phone: user?.phone || '',
      currentRole: user?.currentRole || '',
      targetRole: user?.targetRole || '',
      experienceYears: user?.experienceYears || 0,
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account and career preferences
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-bold">{user?.name}</h2>
              <p className="text-muted-foreground">{user?.email}</p>
              
              <Separator className="my-4 w-full" />
              
              <div className="w-full space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Profile Complete</span>
                  <span className="font-medium">{user?.profileCompleteness || 30}%</span>
                </div>
                <Progress value={user?.profileCompleteness || 30} className="h-2" />
              </div>
              
              <Separator className="my-4 w-full" />
              
              <div className="w-full space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span className="truncate">{user?.email}</span>
                </div>
                {user?.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{user.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Joined {new Date(user?.createdAt || '').toLocaleDateString()}</span>
                </div>
              </div>
              
              {user?.isEmailVerified ? (
                <div className="flex items-center gap-2 mt-4 text-green-600 text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  Email verified
                </div>
              ) : (
                <Button variant="outline" size="sm" className="mt-4">
                  Verify Email
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Edit Profile Form */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your profile details</CardDescription>
            </div>
            {!isEditing ? (
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                Edit Profile
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Info */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    disabled={!isEditing}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    disabled={!isEditing}
                    placeholder="+1 (555) 000-0000"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Career Info */}
            <div>
              <h3 className="text-lg font-medium mb-4">Career Information</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="currentRole">Current Role</Label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="currentRole"
                      value={formData.currentRole}
                      onChange={(e) => handleChange('currentRole', e.target.value)}
                      disabled={!isEditing}
                      placeholder="e.g., Software Engineer"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="targetRole">Target Role</Label>
                  <div className="relative">
                    <Target className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="targetRole"
                      value={formData.targetRole}
                      onChange={(e) => handleChange('targetRole', e.target.value)}
                      disabled={!isEditing}
                      placeholder="e.g., Senior Developer"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="experienceYears">Years of Experience</Label>
                  <Input
                    id="experienceYears"
                    type="number"
                    min="0"
                    max="50"
                    value={formData.experienceYears}
                    onChange={(e) => handleChange('experienceYears', parseInt(e.target.value) || 0)}
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </div>

            {/* Tips */}
            {!isEditing && (
              <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  💡 Complete Your Profile
                </h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• A complete profile helps us provide better recommendations</li>
                  <li>• Set your target role to get personalized interview questions</li>
                  <li>• Add your experience to get role-appropriate content</li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Account Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
          <CardDescription>Manage your account preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Email Address</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
            <Button variant="outline" disabled>
              Change Email
            </Button>
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Password</p>
              <p className="text-sm text-muted-foreground">••••••••</p>
            </div>
            <Button variant="outline" disabled>
              Change Password
            </Button>
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg border-red-200 dark:border-red-900">
            <div>
              <p className="font-medium text-red-600">Delete Account</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all data
              </p>
            </div>
            <Button variant="destructive" disabled>
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
