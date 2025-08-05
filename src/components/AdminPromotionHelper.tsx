import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Shield, UserCog } from "lucide-react";

export const AdminPromotionHelper = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Only show this helper if user is not already an admin
  if (!user || profile?.role === 'admin') {
    return null;
  }

  const promoteToAdmin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "You are now an admin! Please refresh the page.",
      });
      
      // Refresh the page to update auth context
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Error promoting to admin:', error);
      toast({
        title: "Error",
        description: "Failed to promote to admin",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-warning/20 bg-warning/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-warning">
          <Shield className="h-5 w-5" />
          Testing Helper
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          To test the admin features, you can promote your current account to admin role.
          This is for testing purposes only.
        </p>
        <Button 
          onClick={promoteToAdmin}
          disabled={loading}
          variant="outline"
          className="w-full"
        >
          <UserCog className="h-4 w-4 mr-2" />
          {loading ? "Promoting..." : "Promote to Admin"}
        </Button>
      </CardContent>
    </Card>
  );
};