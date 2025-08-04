import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { BarChart3, Clock, Users, Vote } from "lucide-react";
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
  isAdmin: boolean;
}

export const ElectionCard = ({ election, onToggle, onVote, isAdmin }: ElectionCardProps) => {
  const [options, setOptions] = useState<Option[]>([]);
  const [voteCount, setVoteCount] = useState(0);
  const [loading, setLoading] = useState(false);

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

  const handleVote = async (optionId: string) => {
    if (!onVote) return;
    
    setLoading(true);
    try {
      await onVote(election.id, optionId);
      await fetchElectionData(); // Refresh vote count
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg">{election.title}</CardTitle>
            {election.description && (
              <CardDescription className="mt-2">
                {election.description}
              </CardDescription>
            )}
          </div>
          <Badge variant={election.is_open ? "default" : "secondary"}>
            {election.is_open ? "Open" : "Closed"}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Election Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {voteCount} votes
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Vote className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {options.length} options
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Created {format(new Date(election.created_at), 'MMM dd, yyyy')}
          </span>
        </div>

        {/* Admin Controls */}
        {isAdmin && onToggle && (
          <div className="flex items-center space-x-2 pt-2 border-t">
            <Switch
              id={`toggle-${election.id}`}
              checked={election.is_open}
              onCheckedChange={() => onToggle(election.id, election.is_open)}
            />
            <Label htmlFor={`toggle-${election.id}`} className="text-sm">
              {election.is_open ? "Open for voting" : "Closed"}
            </Label>
          </div>
        )}

        {/* Voting Options for Voters */}
        {!isAdmin && election.is_open && onVote && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Choose your option:</h4>
            {options.map((option) => (
              <Button
                key={option.id}
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleVote(option.id)}
                disabled={loading}
              >
                {option.name}
              </Button>
            ))}
          </div>
        )}

        {/* Results Button for Admin */}
        {isAdmin && (
          <Button variant="outline" className="w-full" disabled>
            <BarChart3 className="h-4 w-4 mr-2" />
            View Results
          </Button>
        )}

        {/* Closed Election Message */}
        {!election.is_open && !isAdmin && (
          <div className="text-center py-4 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">This election has ended</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};