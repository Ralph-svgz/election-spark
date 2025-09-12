import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ModeToggle } from "@/components/ModeToggle";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Vote, KeyRound } from "lucide-react";

const Auth = () => {
  const { user, signIn, signUp, resetPassword, updatePassword, loading } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: ""
  });

  useEffect(() => {
    // Listen for auth state changes to detect password recovery
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const { error } = await signIn(formData.email, formData.password);
    
    if (error) {
      toast({
        title: "Sign In Error",
        description: error.message,
        variant: "destructive"
      });
    }
    
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords don't match. Please try again.",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    const { error } = await signUp(formData.email, formData.password);
    
    if (error) {
      toast({
        title: "Sign Up Error",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Check your email",
        description: "Please check your email for a confirmation link."
      });
    }
    
    setIsLoading(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords don't match. Please try again.",
        variant: "destructive"
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    const { error } = await updatePassword(formData.password);
    
    if (error) {
      toast({
        title: "Update Password Error",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Password Updated",
        description: "Your password has been successfully updated!"
      });
      setIsPasswordRecovery(false);
      // Clear form
      setFormData({ email: "", password: "", confirmPassword: "" });
    }
    
    setIsLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address.",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    const { error } = await resetPassword(formData.email);
    
    if (error) {
      toast({
        title: "Reset Password Error",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Reset link sent",
        description: "Please check your email for a password reset link."
      });
      setShowForgotPassword(false);
    }
    
    setIsLoading(false);
  };

  // Show password recovery form if user clicked reset link
  if (isPasswordRecovery) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4 relative">
        <div className="absolute top-4 right-4">
          <ModeToggle />
        </div>
        
        <div className="w-full max-w-md">
          <div className="flex items-center justify-center mb-12 animate-fade-in">
            <div className="p-3 rounded-2xl bg-primary/10 mr-4 animate-bounce-gentle">
              <KeyRound className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Set New Password
            </h1>
          </div>
          
          <Card className="card-elegant animate-fade-in animation-delay-200">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl">Update Your Password</CardTitle>
              <CardDescription className="text-base">
                Enter your new password below
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    name="password"
                    type="password"
                    placeholder="Enter your new password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-new-password">Confirm New Password</Label>
                  <Input
                    id="confirm-new-password"
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm your new password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="btn-gradient w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating Password...
                    </>
                  ) : (
                    "Update Password"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Redirect if already authenticated
  if (user) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4 relative">
      {/* Dark mode toggle in top right */}
      <div className="absolute top-4 right-4">
        <ModeToggle />
      </div>
      
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center mb-12 animate-fade-in">
          <div className="p-3 rounded-2xl bg-primary/10 mr-4 animate-bounce-gentle">
            <Vote className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Voting System
          </h1>
        </div>
        
        <Card className="card-elegant animate-fade-in animation-delay-200">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl">Welcome</CardTitle>
            <CardDescription className="text-base">
              Sign in to your account or create a new one to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      name="password"
                      type="password"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <Button type="submit" className="btn-gradient w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing In...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                  <div className="text-center mt-4">
                    <Button
                      type="button"
                      variant="link"
                      className="text-sm text-muted-foreground"
                      onClick={() => setShowForgotPassword(true)}
                    >
                      Forgot your password?
                    </Button>
                  </div>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      name="password"
                      type="password"
                      placeholder="Create a password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      name="confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <Button type="submit" className="btn-gradient w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Forgot Password Modal */}
        {showForgotPassword && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Reset Password</CardTitle>
                <CardDescription>
                  Enter your email address and we'll send you a reset link
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">Email</Label>
                    <Input
                      id="reset-email"
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        "Send Reset Link"
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowForgotPassword(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
        
        <div className="text-center text-sm text-muted-foreground mt-6 animate-fade-in animation-delay-400">
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-muted/50">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
            <span>New users are registered as voters by default</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;