'use client';

import { PageHeader } from '@/components/PageHeader';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings as SettingsIcon, User, Shield, CreditCard, Bell } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your account, team, and workspace preferences"
        icon={SettingsIcon}
      />

      <div className="grid gap-6 md:grid-cols-4">
        {/* Navigation sidebar for settings */}
        <div className="space-y-1">
          <Button variant="secondary" className="w-full justify-start text-xs h-9">
            <User className="h-4 w-4 mr-2" />
            Profile
          </Button>
          <Button variant="ghost" className="w-full justify-start text-xs h-9 text-muted-foreground">
            <Shield className="h-4 w-4 mr-2" />
            Security
          </Button>
          <Button variant="ghost" className="w-full justify-start text-xs h-9 text-muted-foreground">
            <CreditCard className="h-4 w-4 mr-2" />
            Billing
          </Button>
          <Button variant="ghost" className="w-full justify-start text-xs h-9 text-muted-foreground">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </Button>
        </div>

        {/* Main settings content */}
        <div className="md:col-span-3 space-y-6">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Profile Information</CardTitle>
              <CardDescription className="text-xs">Update your personal details and public profile.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name" className="text-xs">Full Name</Label>
                <Input id="name" defaultValue={user?.name || ''} className="max-w-md h-9 text-xs" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-xs">Email Address</Label>
                <Input id="email" type="email" defaultValue={user?.email || ''} className="max-w-md h-9 text-xs" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role" className="text-xs">Role</Label>
                <Input id="role" defaultValue="Recruiter" className="max-w-md h-9 text-xs bg-muted" disabled />
                <p className="text-2xs text-muted-foreground mt-1">Contact your admin to change your role.</p>
              </div>
              <div className="pt-2">
                <Button size="sm" className="text-xs">Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
