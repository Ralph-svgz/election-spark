import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ElectionCard } from "@/components/ElectionCard";
import { useToast } from "@/hooks/use-toast";
import { Vote, Clock, ArrowLeft } from "lucide-react";

interface Election {
  id: string;
  title: string;
  description: string | null;
  is_open: boolean;
  created_at: string;
  created_by: string;
}

const Elections = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const [userVotes, setUserVotes] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      fetchElections();
      fetchUserVotes();
    }
  }, [user]);

  const fetchElections = async () => {
    try {
      const { data, error } = await supabase
        .from('elections')
        .select('*')
        .eq('is_open', true)
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

  const fetchUserVotes = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('votes')
        .select('election_id')
        .eq('user_id', user.id);

      if (error) throw error;
      
      const votedElectionIds = new Set(data?.map(vote => vote.election_id) || []);
      setUserVotes(votedElectionIds);
    } catch (error) {
      console.error('Error fetching user votes:', error);
    }
  };

  const handleVote = async (electionId: string, optionId: string) => {
    if (!user) return;

    // Check if user already voted
    if (userVotes.has(electionId)) {
      toast({
        title: "Already Voted",
        description: "You have already voted in this election",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('votes')
        .insert({
          user_id: user.id,
          election_id: electionId,
          option_id: optionId
        });

      if (error) throw error;

      toast({
        title: "Vote Recorded",
        description: "Your vote has been successfully recorded"
      });

      // Update local state
      setUserVotes(prev => new Set([...prev, electionId]));
    } catch (error) {
      console.error('Error casting vote:', error);
      toast({
        title: "Error",
        description: "Failed to record your vote",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading elections...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-12">
        {/* Header with Back Navigation */}
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>

        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6 animate-bounce-gentle">
            <Vote className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">Active Elections</h1>
          <p className="text-muted-foreground text-lg">Participate in ongoing elections and make your voice heard</p>
        </div>

      {elections.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Vote className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No active elections</h3>
            <p className="text-muted-foreground text-center">
              There are currently no open elections available for voting.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {elections.map((election, index) => (
            <div key={election.id} className={`relative animate-fade-in`} style={{ animationDelay: `${index * 150}ms` }}>
              <ElectionCard
                election={election}
                onVote={userVotes.has(election.id) ? undefined : handleVote}
                isAdmin={false}
              />
              {userVotes.has(election.id) && (
                <div className="absolute -top-2 -right-2 z-10">
                  <Badge className="status-badge open shadow-lg animate-scale-in">
                    ✓ Voted
                  </Badge>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {elections.length > 0 && (
        <div className="mt-16 text-center animate-fade-in animation-delay-600">
          <div className="inline-flex items-center space-x-3 px-6 py-4 rounded-xl bg-card/80 backdrop-blur-sm border border-border/50">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
            <p className="text-sm text-muted-foreground">
              You can only vote once per election. Your votes are anonymous and secure.
            </p>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default Elections;