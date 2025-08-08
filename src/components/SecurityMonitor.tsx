import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Shield, Clock, Users } from 'lucide-react';

interface SecurityMetrics {
  failedLoginAttempts: number;
  lastLoginTime: string | null;
  activeSessionsCount: number;
  suspiciousActivity: boolean;
}

export const SecurityMonitor = () => {
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    failedLoginAttempts: 0,
    lastLoginTime: null,
    activeSessionsCount: 1,
    suspiciousActivity: false
  });

  useEffect(() => {
    // In a real app, this would fetch from a security monitoring service
    const checkSecurityMetrics = () => {
      // Mock data - in production this would come from your security monitoring
      setMetrics({
        failedLoginAttempts: Math.floor(Math.random() * 3),
        lastLoginTime: new Date().toISOString(),
        activeSessionsCount: 1,
        suspiciousActivity: false
      });
    };

    checkSecurityMetrics();
    const interval = setInterval(checkSecurityMetrics, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const getSecurityLevel = () => {
    if (metrics.suspiciousActivity || metrics.failedLoginAttempts > 5) {
      return { level: 'high', color: 'destructive', label: 'High Risk' };
    }
    if (metrics.failedLoginAttempts > 2) {
      return { level: 'medium', color: 'warning', label: 'Medium Risk' };
    }
    return { level: 'low', color: 'success', label: 'Secure' };
  };

  const security = getSecurityLevel();

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Security Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Security Level</span>
          <Badge variant={security.color as any} className="flex items-center gap-1">
            <Shield className="h-3 w-3" />
            {security.label}
          </Badge>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Failed Login Attempts</span>
            <span className={metrics.failedLoginAttempts > 2 ? 'text-warning' : 'text-foreground'}>
              {metrics.failedLoginAttempts}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-muted-foreground">Active Sessions</span>
            <span className="text-foreground">{metrics.activeSessionsCount}</span>
          </div>

          {metrics.lastLoginTime && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Login</span>
              <span className="text-foreground text-xs">
                {new Date(metrics.lastLoginTime).toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {metrics.suspiciousActivity && (
          <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
            <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-destructive">Suspicious Activity Detected</p>
              <p className="text-muted-foreground">Please review your recent account activity.</p>
            </div>
          </div>
        )}

        <Button variant="outline" size="sm" className="w-full">
          <Clock className="h-4 w-4 mr-2" />
          View Activity Log
        </Button>
      </CardContent>
    </Card>
  );
};