import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { BarChart3, Clock, Users, Vote, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { format } from "date-fns";

interface Election {
  id: string;
  title: string;
  description: string | null;
  is_open: boolean;
  created_at: string;
  created_by: string;
}

interface Option {
  id: string;
  name: string;
  election_id: string;
}

interface ElectionCardProps {
  election: Election;
  onToggle?: (electionId: string, isOpen: boolean) => void;
  onVote?: (electionId: string, optionId: string) => void;
  onViewResults?: (electionId: string) => void;
  isAdmin: boolean;
}

export const ElectionCard = ({ election, onToggle, onVote, onViewResults, isAdmin }: ElectionCardProps) => {
  const { toast } = useToast();
  const [options, setOptions] = useState<Option[]>([]);
  const [voteCount, setVoteCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [votingOptionId, setVotingOptionId] = useState<string | null>(null);
  const [showVoteConfirm, setShowVoteConfirm] = useState(false);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

  useEffect(() => {
    fetchElectionData();
  }, [election.id]);

  const fetchElectionData = async () => {
    try {
      // Fetch options
      const { data: optionsData, error: optionsError } = await supabase
        .from('options')
        .select('*')
        .eq('election_id', election.id);

      if (optionsError) throw optionsError;
      setOptions(optionsData || []);

      // Fetch vote count
      const { count, error: voteError } = await supabase
        .from('votes')
        .select('*', { count: 'exact', head: true })
        .eq('election_id', election.id);

      if (voteError) throw voteError;
      setVoteCount(count || 0);
    } catch (error) {
      console.error('Error fetching election data:', error);
    }
  };

  const handleVoteClick = (optionId: string) => {
    setSelectedOptionId(optionId);
    setShowVoteConfirm(true);
  };

  const confirmVote = async () => {
    if (!selectedOptionId || !onVote) return;
    
    setVotingOptionId(selectedOptionId);
    setShowVoteConfirm(false);
    
    try {
      await onVote(election.id, selectedOptionId);
      toast({
        title: "Vote Submitted",
        description: "Your vote has been recorded successfully!",
      });
      await fetchElectionData();
    } catch (error) {
      toast({
        title: "Vote Failed",
        description: "There was an error submitting your vote. Please try again.",
        variant: "destructive"
      });
    } finally {
      setVotingOptionId(null);
      setSelectedOptionId(null);
    }
  };

  return (
    <Card className="election-card group animate-fade-in">
      <CardHeader>
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <CardTitle className="text-lg">{election.title}</CardTitle>
            {election.description && (
              <CardDescription className="mt-2">
                {election.description}
              </CardDescription>
            )}
          </div>
          <Badge 
            variant={election.is_open ? "default" : "secondary"}
            className={election.is_open ? 'status-badge open' : 'status-badge closed'}
          >
            {election.is_open ? "Open" : "Closed"}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Election Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/30">
            <div className="p-2 rounded-full bg-primary/10">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="text-lg font-semibold text-foreground">{voteCount}</div>
              <div className="text-xs text-muted-foreground">votes</div>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/30">
            <div className="p-2 rounded-full bg-success/10">
              <Vote className="h-4 w-4 text-success" />
            </div>
            <div>
              <div className="text-lg font-semibold text-foreground">{options.length}</div>
              <div className="text-xs text-muted-foreground">options</div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/30">
          <div className="p-2 rounded-full bg-warning/10">
            <Clock className="h-4 w-4 text-warning" />
          </div>
          <div>
            <div className="text-sm font-medium text-foreground">
              Created {format(new Date(election.created_at), 'MMM dd, yyyy')}
            </div>
            <div className="text-xs text-muted-foreground">Election date</div>
          </div>
        </div>

        {/* Admin Controls */}
        {isAdmin && onToggle && (
          <div className="flex items-center space-x-3 p-4 border border-border rounded-lg bg-card/50">
            <Switch
              id={`toggle-${election.id}`}
              checked={election.is_open}
              onCheckedChange={() => onToggle(election.id, election.is_open)}
            />
            <Label htmlFor={`toggle-${election.id}`} className="text-sm font-medium cursor-pointer">
              {election.is_open ? "Open for voting" : "Closed"}
            </Label>
          </div>
        )}

        {/* Voting Options for Voters */}
        {!isAdmin && election.is_open && onVote && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground border-b border-border pb-2">
              Choose your option:
            </h4>
            {options.map((option) => (
              <Button
                key={option.id}
                variant="outline"
                className="vote-button"
                onClick={() => handleVoteClick(option.id)}
                disabled={votingOptionId === option.id}
              >
                <div className="flex items-center justify-between w-full">
                  <span>{option.name}</span>
                  {votingOptionId === option.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Vote className="h-4 w-4 opacity-50" />
                  )}
                </div>
              </Button>
            ))}
          </div>
        )}

        {/* Results Button for Admin */}
        {isAdmin && onViewResults && (
          <Button 
            variant="outline" 
            className="w-full hover-lift"
            onClick={() => onViewResults(election.id)}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            View Results
          </Button>
        )}

        {/* Closed Election Message */}
        {!election.is_open && !isAdmin && (
          <div className="text-center py-8 space-y-3">
            <div className="w-16 h-16 mx-auto rounded-full bg-muted/50 flex items-center justify-center">
              <Clock className="h-8 w-8 text-muted-foreground opacity-50" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">This election has ended</p>
              <p className="text-xs text-muted-foreground/70">Results will be available soon</p>
            </div>
          </div>
        )}

        {/* Vote Confirmation Dialog */}
        <AlertDialog open={showVoteConfirm} onOpenChange={setShowVoteConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Your Vote</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to vote for "{options.find(opt => opt.id === selectedOptionId)?.name}"? 
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmVote}>
                Confirm Vote
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};