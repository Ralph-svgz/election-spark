import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ElectionResults as ElectionResultsComponent } from "@/components/ElectionResults";
import { LiveVoteCounter } from "@/components/LiveVoteCounter";
import { UserPresence } from "@/components/UserPresence";
import { VotingAnalytics } from "@/components/VotingAnalytics";
import { ArrowLeft, Loader2 } from "lucide-react";

interface Election {
  id: string;
  title: string;
  description: string;
  is_open: boolean;
  created_at: string;
  created_by: string;
}

const ElectionResultsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [election, setElection] = useState<Election | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      navigate('/admin');
      return;
    }
    
    fetchElection();
  }, [id, navigate]);

  const fetchElection = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('elections')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setElection(data);
    } catch (error) {
      console.error('Error fetching election:', error);
      navigate('/admin');
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground">You need admin privileges to view election results.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!election) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Election Not Found</h1>
          <p className="text-muted-foreground mb-4">The election you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate('/admin')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin Dashboard
          </Button>
        </div>

        <div className="space-y-8">
          {/* Main Results */}
          <ElectionResultsComponent
            electionId={election.id}
            electionTitle={election.title}
            isOpen={election.is_open}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Live Counter */}
            <div className="lg:col-span-2">
              <LiveVoteCounter
                electionId={election.id}
                electionTitle={election.title}
                isOpen={election.is_open}
              />
            </div>

            {/* User Presence */}
            <div>
              <UserPresence
                electionId={election.id}
                showViewers={true}
              />
            </div>
          </div>

          {/* Detailed Analytics */}
          <VotingAnalytics
            electionId={election.id}
            isAdmin={true}
          />
        </div>
      </div>
    </div>
  );
};

export default ElectionResultsPage;