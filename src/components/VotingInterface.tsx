import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, Vote, Users, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Option {
  id: string;
  name: string;
  description?: string;
  election_id: string;
  created_at: string;
}

interface Election {
  id: string;
  title: string;
  description?: string;
  is_open: boolean;
  start_date?: string;
  end_date?: string;
  created_at: string;
}

interface VotingInterfaceProps {
  electionId: string;
}

export const VotingInterface: React.FC<VotingInterfaceProps> = ({ electionId }) => {
  const { user } = useAuth();
  const [election, setElection] = useState<Election | null>(null);
  const [options, setOptions] = useState<Option[]>([]);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [voteCount, setVoteCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (electionId && user) {
      fetchElectionData();
      checkIfUserVoted();
      fetchVoteCount();
      
      // Set up realtime subscription for vote count
      const channel = supabase
        .channel('vote-updates')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'votes',
            filter: `election_id=eq.${electionId}`
          },
          () => {
            fetchVoteCount();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [electionId, user]);

  const fetchElectionData = async () => {
    try {
      // Fetch election details
      const { data: electionData, error: electionError } = await supabase
        .from('elections')
        .select('*')
        .eq('id', electionId)
        .single();

      if (electionError) throw electionError;
      setElection(electionData);

      // Fetch options
      const { data: optionsData, error: optionsError } = await supabase
        .from('options')
        .select('*')
        .eq('election_id', electionId)
        .order('created_at');

      if (optionsError) throw optionsError;
      setOptions(optionsData || []);
    } catch (error) {
      console.error('Error fetching election data:', error);
      toast.error('Failed to load election data');
    } finally {
      setLoading(false);
    }
  };

  const checkIfUserVoted = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('votes')
        .select('id')
        .eq('election_id', electionId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setHasVoted(!!data);
    } catch (error) {
      console.error('Error checking vote status:', error);
    }
  };

  const fetchVoteCount = async () => {
    try {
      const { count, error } = await supabase
        .from('votes')
        .select('*', { count: 'exact', head: true })
        .eq('election_id', electionId);

      if (error) throw error;
      setVoteCount(count || 0);
    } catch (error) {
      console.error('Error fetching vote count:', error);
    }
  };

  const handleOptionSelect = (optionId: string) => {
    if (hasVoted || !election?.is_open) return;
    setSelectedOption(optionId);
    setShowConfirmDialog(true);
  };

  const confirmVote = async () => {
    if (!user || !selectedOption) return;
    
    setIsVoting(true);
    try {
      const { error } = await supabase
        .from('votes')
        .insert({
          election_id: electionId,
          option_id: selectedOption,
          user_id: user.id
        });

      if (error) throw error;

      setHasVoted(true);
      setShowConfirmDialog(false);
      toast.success('Vote cast successfully!');
      fetchVoteCount();
    } catch (error) {
      console.error('Error casting vote:', error);
      toast.error('Failed to cast vote. Please try again.');
    } finally {
      setIsVoting(false);
    }
  };

  if (loading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading election...</span>
        </CardContent>
      </Card>
    );
  }

  if (!election) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Election not found</p>
        </CardContent>
      </Card>
    );
  }

  const selectedOptionData = options.find(opt => opt.id === selectedOption);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">{election.title}</CardTitle>
            <Badge variant={election.is_open ? "default" : "secondary"}>
              {election.is_open ? "Active" : "Closed"}
            </Badge>
          </div>
          {election.description && (
            <p className="text-muted-foreground">{election.description}</p>
          )}
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{voteCount} votes</span>
            </div>
            {election.end_date && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>Ends {new Date(election.end_date).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {hasVoted && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-800">
                <Vote className="h-4 w-4" />
                <span className="font-medium">You have already voted in this election</span>
              </div>
            </div>
          )}

          <div className="grid gap-3">
            {options.map((option) => (
              <Button
                key={option.id}
                variant={selectedOption === option.id ? "default" : "outline"}
                className="justify-start p-4 h-auto"
                onClick={() => handleOptionSelect(option.id)}
                disabled={hasVoted || !election.is_open || isVoting}
              >
                <div className="text-left">
                  <div className="font-medium">{option.name}</div>
                  {option.description && (
                    <div className="text-sm text-muted-foreground mt-1">
                      {option.description}
                    </div>
                  )}
                </div>
              </Button>
            ))}
          </div>

          {!election.is_open && !hasVoted && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800">This election is currently closed.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Your Vote</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to vote for "{selectedOptionData?.name}". 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isVoting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmVote} disabled={isVoting}>
              {isVoting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Casting Vote...
                </>
              ) : (
                'Confirm Vote'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};