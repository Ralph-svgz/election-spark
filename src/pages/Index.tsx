import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Vote, Users, Settings, LogOut } from "lucide-react";
import { AdminPromotionHelper } from "@/components/AdminPromotionHelper";
import { SEO } from "@/components/SEO";

const Index = () => {
  const { user, profile, loading, signOut } = useAuth();

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "VoteFlow",
    "description": "Secure online voting platform with real-time results and advanced analytics",
    "url": window.location.origin,
    "applicationCategory": "Voting System",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  };

  if (loading) {
    return (
      <>
        <SEO structuredData={structuredData} />
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="animate-pulse">Loading...</div>
        </div>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <SEO 
          title="VoteFlow - Secure Online Voting Platform"
          description="Create and participate in secure online elections with real-time results, advanced analytics, and user-friendly voting interface."
          structuredData={structuredData}
        />
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30">
          <div className="text-center max-w-md mx-auto p-8">
            <div className="animate-bounce-gentle mb-8">
              <Vote className="h-20 w-20 mx-auto text-primary drop-shadow-lg" />
            </div>
            <h1 className="text-5xl font-bold mb-6 text-foreground animate-fade-in">
              VoteFlow
            </h1>
            <p className="text-xl text-muted-foreground mb-8 animate-fade-in animation-delay-200">
              Secure, transparent, and easy-to-use voting platform
            </p>
            <Link to="/auth" className="animate-fade-in animation-delay-400">
              <Button size="lg" className="btn-gradient w-full text-lg py-6">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO 
        title="Dashboard | VoteFlow"
        description="Access your VoteFlow dashboard to participate in elections and manage voting activities."
        structuredData={structuredData}
      />
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        {/* Header */}
        <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-50"
                role="banner">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <Vote className="h-6 w-6 text-primary" aria-hidden="true" />
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  VoteFlow
                </h1>
              </div>
              <Button variant="ghost" size="sm" onClick={signOut} className="hover-lift"
                      aria-label="Sign out of your account">
                <LogOut className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/30">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Welcome,</span>
                <span className="font-medium text-foreground text-sm truncate max-w-[120px]">{user.email}</span>
              </div>
              <Badge 
                variant={profile?.role === 'admin' ? 'default' : 'secondary'}
                className={`text-xs ${profile?.role === 'admin' ? 'status-badge open' : 'status-badge closed'}`}
                aria-label={`User role: ${profile?.role || 'voter'}`}
              >
                {profile?.role || 'voter'}
              </Badge>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-6" role="main">
        <div className="text-center mb-8 animate-fade-in">
          <h2 className="text-2xl font-bold text-foreground mb-2">Dashboard</h2>
          <p className="text-muted-foreground">Choose an action to get started</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {/* Elections Card */}
          <Card className="election-card group animate-fade-in">
            <CardHeader className="text-center pb-4">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300">
                <Vote className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-lg">Elections</CardTitle>
              <CardDescription className="text-sm">
                View and participate in elections
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Link to="/elections">
                <Button className="btn-gradient w-full">
                  View Elections
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Admin Panel - Only visible to admins */}
          {profile?.role === 'admin' && (
            <Card className="election-card group animate-fade-in animation-delay-200">
              <CardHeader className="text-center pb-4">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-warning/10 flex items-center justify-center group-hover:bg-warning/20 transition-colors duration-300">
                  <Settings className="h-6 w-6 text-warning" />
                </div>
                <CardTitle className="text-lg">Admin Panel</CardTitle>
                <CardDescription className="text-sm">
                  Create and manage elections
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Link to="/admin">
                  <Button className="w-full bg-gradient-to-r from-warning to-warning text-warning-foreground hover:shadow-lg hover:scale-105 transition-all duration-300">
                    Manage Elections
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Users - Admin only */}
          {profile?.role === 'admin' && (
            <Card className="election-card group animate-fade-in animation-delay-400">
              <CardHeader className="text-center pb-4">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-success/10 flex items-center justify-center group-hover:bg-success/20 transition-colors duration-300">
                  <Users className="h-6 w-6 text-success" />
                </div>
                <CardTitle className="text-lg">Users</CardTitle>
                <CardDescription className="text-sm">
                  Manage user roles and permissions
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Link to="/users">
                  <Button className="btn-success w-full">
                    Manage Users
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Testing Helper for non-admin users */}
        <div className="max-w-sm mx-auto mt-8">
          <AdminPromotionHelper />
        </div>

        {/* Status Message */}
        <div className="mt-8 text-center animate-fade-in animation-delay-600">
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-success/10 border border-success/20">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" aria-hidden="true"></div>
            <p className="text-success-foreground font-medium text-sm">
              VoteFlow is ready! Create elections, vote securely, and view real-time results.
            </p>
          </div>
        </div>
        </main>
      </div>
    </>
  );
};

export default Index;
