import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Vote, Users, Settings, LogOut } from "lucide-react";

const Index = () => {
  const { user, profile, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md mx-auto p-6">
          <Vote className="h-16 w-16 mx-auto mb-6 text-primary" />
          <h1 className="text-4xl font-bold mb-4 text-foreground">Voting System</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Secure, transparent, and easy-to-use voting platform
          </p>
          <Link to="/auth">
            <Button size="lg" className="w-full">
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Vote className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Voting System</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">Welcome,</span>
              <span className="font-medium text-foreground">{user.email}</span>
              <Badge variant={profile?.role === 'admin' ? 'default' : 'secondary'}>
                {profile?.role || 'voter'}
              </Badge>
            </div>
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Elections Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Vote className="h-5 w-5 mr-2" />
                Elections
              </CardTitle>
              <CardDescription>
                View and participate in active elections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/elections">
                <Button className="w-full">
                  View Elections
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Admin Panel - Only visible to admins */}
          {profile?.role === 'admin' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Admin Panel
                </CardTitle>
                <CardDescription>
                  Create and manage elections
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/admin">
                  <Button className="w-full">
                    Manage Elections
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Users - Admin only */}
          {profile?.role === 'admin' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Users
                </CardTitle>
                <CardDescription>
                  Manage user roles and permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" disabled>
                  Manage Users
                  <span className="text-xs ml-2">(Coming Soon)</span>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Status Message */}
        <div className="mt-8 text-center">
          <p className="text-muted-foreground">
            Authentication system is ready! Next step: Implement election management and voting features.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Index;
