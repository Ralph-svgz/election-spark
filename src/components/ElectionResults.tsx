import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
// Charts will be implemented with a working version later
import { Trophy, Users, Vote, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Option {
  id: string;
  name: string;
  election_id: string;
}

interface VoteCount {
  option_id: string;
  option_name: string;
  vote_count: number;
}

interface ElectionResultsProps {
  electionId: string;
  electionTitle: string;
  isOpen: boolean;
}

export const ElectionResults = ({ electionId, electionTitle, isOpen }: ElectionResultsProps) => {
  const [results, setResults] = useState<VoteCount[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

  useEffect(() => {
    fetchResults();
  }, [electionId]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      // Get all options for this election
      const { data: options, error: optionsError } = await supabase
        .from('options')
        .select('*')
        .eq('election_id', electionId);

      if (optionsError) throw optionsError;

      // Get vote counts for each option
      const resultsData: VoteCount[] = [];
      let total = 0;

      for (const option of options || []) {
        const { count, error: countError } = await supabase
          .from('votes')
          .select('*', { count: 'exact', head: true })
          .eq('option_id', option.id);

        if (countError) throw countError;

        const voteCount = count || 0;
        total += voteCount;

        resultsData.push({
          option_id: option.id,
          option_name: option.name,
          vote_count: voteCount
        });
      }

      setResults(resultsData);
      setTotalVotes(total);
    } catch (error) {
      console.error('Error fetching results:', error);
      toast({
        title: "Error",
        description: "Failed to fetch election results",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const winner = results.reduce((prev, current) => 
    (prev.vote_count > current.vote_count) ? prev : current, 
    { option_name: '', vote_count: 0 }
  );

  const chartData = results.map((result, index) => ({
    name: result.option_name,
    value: result.vote_count,
    percentage: totalVotes > 0 ? ((result.vote_count / totalVotes) * 100).toFixed(1) : '0',
    fill: COLORS[index % COLORS.length]
  }));

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Results...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Results Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Results: {electionTitle}
          </CardTitle>
          <div className="flex items-center gap-4">
            <Badge variant={isOpen ? "default" : "secondary"}>
              {isOpen ? "Ongoing" : "Closed"}
            </Badge>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{totalVotes} total votes</span>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Winner Announcement */}
      {!isOpen && totalVotes > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Trophy className="h-5 w-5" />
              Winner
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{winner.option_name}</div>
            <div className="text-muted-foreground">
              {winner.vote_count} votes ({totalVotes > 0 ? ((winner.vote_count / totalVotes) * 100).toFixed(1) : '0'}%)
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vote Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Vote className="h-5 w-5" />
            Vote Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {results.map((result, index) => (
            <div key={result.option_id} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">{result.option_name}</span>
                <div className="text-right">
                  <span className="font-bold">{result.vote_count}</span>
                  <span className="text-muted-foreground ml-1">
                    ({totalVotes > 0 ? ((result.vote_count / totalVotes) * 100).toFixed(1) : '0'}%)
                  </span>
                </div>
              </div>
              <Progress 
                value={totalVotes > 0 ? (result.vote_count / totalVotes) * 100 : 0}
                className="h-2"
              />
            </div>
          ))}
          
          {results.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              No votes recorded yet
            </div>
          )}
        </CardContent>
      </Card>

      {/* Visual Results Summary */}
      {totalVotes > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Visual Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {results.map((result, index) => (
              <div key={result.option_id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="font-medium">{result.option_name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold">{result.vote_count}</span>
                    <span className="text-muted-foreground ml-1">
                      ({totalVotes > 0 ? ((result.vote_count / totalVotes) * 100).toFixed(1) : '0'}%)
                    </span>
                  </div>
                </div>
                <div className="w-full bg-muted rounded-full h-3">
                  <div 
                    className="h-3 rounded-full transition-all duration-300" 
                    style={{ 
                      backgroundColor: COLORS[index % COLORS.length],
                      width: `${totalVotes > 0 ? (result.vote_count / totalVotes) * 100 : 0}%`
                    }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};