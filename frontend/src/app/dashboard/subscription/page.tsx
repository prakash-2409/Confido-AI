'use client';

/**
 * Subscription & Pricing Page
 * 
 * Displays available plans, current subscription status,
 * and handles Stripe checkout/portal redirects.
 */

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { subscriptionApi, SubscriptionPlan, SubscriptionStatus } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Check,
  Crown,
  Loader2,
  Sparkles,
  Zap,
  Building2,
  CreditCard,
  ExternalLink,
  Star,
  Shield,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const planIcons: Record<string, React.ReactNode> = {
  free: <Zap className="h-6 w-6" />,
  pro: <Sparkles className="h-6 w-6" />,
  enterprise: <Building2 className="h-6 w-6" />,
};

const planColors: Record<string, string> = {
  free: 'border-gray-200 dark:border-gray-700',
  pro: 'border-blue-500 ring-2 ring-blue-500/20',
  enterprise: 'border-purple-500 ring-2 ring-purple-500/20',
};

const planPrices: Record<string, { amount: string; period: string }> = {
  free: { amount: '$0', period: 'forever' },
  pro: { amount: '$19', period: '/month' },
  enterprise: { amount: '$49', period: '/month' },
};

export default function SubscriptionPage() {
  const searchParams = useSearchParams();
  const [plans, setPlans] = useState<Record<string, SubscriptionPlan> | null>(null);
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  useEffect(() => {
    // Handle redirect from Stripe
    const subscriptionResult = searchParams.get('subscription');
    if (subscriptionResult === 'success') {
      toast.success('Subscription activated! Welcome to your new plan.');
    } else if (subscriptionResult === 'cancelled') {
      toast.info('Checkout cancelled. No charges were made.');
    }
  }, [searchParams]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [plansRes, statusRes] = await Promise.all([
        subscriptionApi.getPlans(),
        subscriptionApi.getStatus(),
      ]);
      setPlans(plansRes.data.data.plans);
      setStatus(statusRes.data.data);
    } catch (error) {
      console.error('Failed to fetch subscription data:', error);
      toast.error('Failed to load subscription data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckout = async (plan: string) => {
    setCheckoutLoading(plan);
    try {
      const response = await subscriptionApi.createCheckout(plan);
      const { url } = response.data.data;
      if (url) {
        window.location.href = url;
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to start checkout';
      toast.error(message);
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handlePortal = async () => {
    setPortalLoading(true);
    try {
      const response = await subscriptionApi.createPortal();
      const { url } = response.data.data;
      if (url) {
        window.location.href = url;
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to open billing portal';
      toast.error(message);
    } finally {
      setPortalLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will retain access until the end of your billing period.')) {
      return;
    }
    setCancelLoading(true);
    try {
      await subscriptionApi.cancel();
      toast.success('Subscription will be cancelled at the end of your billing period.');
      fetchData();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to cancel subscription';
      toast.error(message);
    } finally {
      setCancelLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const currentPlan = status?.plan || 'free';

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 max-w-5xl mx-auto"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold">Subscription Plans</h1>
        <p className="text-muted-foreground mt-1">
          Choose the plan that fits your career goals
        </p>
      </motion.div>

      {/* Current Plan Banner */}
      {status && currentPlan !== 'free' && (
        <motion.div variants={itemVariants}>
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-blue-200 dark:border-blue-800">
            <CardContent className="py-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <Crown className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium">
                      You&apos;re on the <span className="text-blue-600 dark:text-blue-400 font-bold">{status.planDetails.name}</span> plan
                    </p>
                    {status.currentPeriodEnd && (
                      <p className="text-sm text-muted-foreground">
                        {status.cancelAtPeriodEnd
                          ? `Access until ${new Date(status.currentPeriodEnd).toLocaleDateString()}`
                          : `Renews ${new Date(status.currentPeriodEnd).toLocaleDateString()}`}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePortal}
                    disabled={portalLoading}
                    className="gap-2"
                  >
                    {portalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                    Manage Billing
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                  {!status.cancelAtPeriodEnd && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCancel}
                      disabled={cancelLoading}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                      {cancelLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Cancel'}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Plan Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {plans && Object.entries(plans).map(([key, plan]: [string, SubscriptionPlan]) => {
          const isCurrentPlan = currentPlan === key;
          const isPopular = key === 'pro';
          const pricing = planPrices[key] || { amount: '?', period: '' };

          return (
            <motion.div key={key} variants={itemVariants}>
              <Card className={cn(
                'relative h-full flex flex-col transition-shadow hover:shadow-lg',
                planColors[key],
                isCurrentPlan && 'bg-primary/5'
              )}>
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-blue-600 text-white hover:bg-blue-700 gap-1">
                      <Star className="h-3 w-3" />
                      Most Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pt-8">
                  <div className={cn(
                    'mx-auto h-12 w-12 rounded-full flex items-center justify-center mb-3',
                    key === 'free' && 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
                    key === 'pro' && 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400',
                    key === 'enterprise' && 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400',
                  )}>
                    {planIcons[key]}
                  </div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <div className="mt-2">
                    <span className="text-4xl font-bold">{pricing.amount}</span>
                    <span className="text-muted-foreground ml-1">{pricing.period}</span>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col">
                  <Separator className="mb-6" />
                  
                  <ul className="space-y-3 flex-1">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className={cn(
                          'h-4 w-4 mt-0.5 flex-shrink-0',
                          key === 'free' && 'text-gray-500',
                          key === 'pro' && 'text-blue-500',
                          key === 'enterprise' && 'text-purple-500',
                        )} />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6 pt-4 border-t">
                    {isCurrentPlan ? (
                      <Button disabled className="w-full gap-2" variant="outline">
                        <Shield className="h-4 w-4" />
                        Current Plan
                      </Button>
                    ) : key === 'free' ? (
                      <Button disabled variant="outline" className="w-full">
                        Free Forever
                      </Button>
                    ) : (
                      <Button
                        className={cn(
                          'w-full gap-2',
                          key === 'pro' && 'bg-blue-600 hover:bg-blue-700',
                          key === 'enterprise' && 'bg-purple-600 hover:bg-purple-700',
                        )}
                        onClick={() => handleCheckout(key)}
                        disabled={!!checkoutLoading}
                      >
                        {checkoutLoading === key ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4" />
                            Upgrade to {plan.name}
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* FAQ Section */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-medium mb-1">Can I switch plans anytime?</h4>
              <p className="text-sm text-muted-foreground">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately for upgrades, and at the end of your billing period for downgrades.
              </p>
            </div>
            <Separator />
            <div>
              <h4 className="font-medium mb-1">What happens if I cancel?</h4>
              <p className="text-sm text-muted-foreground">
                You&apos;ll retain access to all premium features until the end of your current billing period. After that, you&apos;ll be moved back to the Free plan.
              </p>
            </div>
            <Separator />
            <div>
              <h4 className="font-medium mb-1">Is my payment information secure?</h4>
              <p className="text-sm text-muted-foreground">
                All payments are processed securely through Stripe. We never store your credit card details on our servers.
              </p>
            </div>
            <Separator />
            <div>
              <h4 className="font-medium mb-1">Do you offer refunds?</h4>
              <p className="text-sm text-muted-foreground">
                We offer a 14-day money-back guarantee. If you&apos;re not satisfied, contact our support team for a full refund.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
