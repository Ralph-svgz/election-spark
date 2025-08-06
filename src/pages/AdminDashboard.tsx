import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Settings, Users, BarChart3 } from "lucide-react";
import { CreateElectionDialog } from "@/components/CreateElectionDialog";
import { ElectionCard } from "@/components/ElectionCard";
import { useToast } from "@/hooks/use-toast";

interface Election {
  id: string;
  title: string;
  description: string | null;
  is_open: boolean;
  created_at: string;
  created_by: string;
}

const AdminDashboard = () => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    if (user && isAdmin()) {
      fetchElections();
    }
  }, [user, isAdmin]);

  const fetchElections = async () => {
    try {
      const { data, error } = await supabase
        .from('elections')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setElections(data || []);
    } catch (error) {
      console.error('Error fetching elections:', error);
      toast({
        title: "Error",
        description: "Failed to fetch elections",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleElectionCreated = () => {
    fetchElections();
    setShowCreateDialog(false);
  };

  const handleElectionToggle = async (electionId: string, isOpen: boolean) => {
    try {
      const { error } = await supabase
        .from('elections')
        .update({ is_open: !isOpen })
        .eq('id', electionId);

      if (error) throw error;
      
      fetchElections();
      toast({
        title: "Success",
        description: `Election ${!isOpen ? 'opened' : 'closed'} successfully`
      });
    } catch (error) {
      console.error('Error toggling election:', error);
      toast({
        title: "Error",
        description: "Failed to toggle election status",
        variant: "destructive"
      });
    }
  };

  const handleViewResults = (electionId: string) => {
    navigate(`/admin/results/${electionId}`);
  };

  if (!isAdmin()) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage elections and monitor voting</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Election
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Elections</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{elections.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Elections</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {elections.filter(e => e.is_open).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Closed Elections</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {elections.filter(e => !e.is_open).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Elections List */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">Elections</h2>
        {elections.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No elections yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first election to get started with the voting system.
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Election
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {elections.map((election) => (
              <ElectionCard
                key={election.id}
                election={election}
                onToggle={handleElectionToggle}
                onViewResults={handleViewResults}
                isAdmin={true}
              />
            ))}
          </div>
        )}
      </div>

      <CreateElectionDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onElectionCreated={handleElectionCreated}
      />
    </div>
  );
};

export default AdminDashboard;