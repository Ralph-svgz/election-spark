import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRealtime } from '@/hooks/useRealtime';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Users, TrendingUp, Activity } from 'lucide-react';

interface VoteData {
  option_id: string;
  option_name: string;
  vote_count: number;
}

interface LiveVoteCounterProps {
  electionId: string;
  electionTitle: string;
  isOpen: boolean;
}

export const LiveVoteCounter = ({ electionId, electionTitle, isOpen }: LiveVoteCounterProps) => {
  const [voteData, setVoteData] = useState<VoteData[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [recentVotes, setRecentVotes] = useState<number>(0);

  // Fetch initial vote data
  const fetchVoteData = async () => {
    try {
      const { data: options, error: optionsError } = await supabase
        .from('options')
        .select('id, name')
        .eq('election_id', electionId);

      if (optionsError) throw optionsError;

      const voteResults = await Promise.all(
        options.map(async (option) => {
          const { count, error } = await supabase
            .from('votes')
            .select('*', { count: 'exact', head: true })
            .eq('option_id', option.id);

          if (error) throw error;

          return {
            option_id: option.id,
            option_name: option.name,
            vote_count: count || 0
          };
        })
      );

      setVoteData(voteResults);
      setTotalVotes(voteResults.reduce((sum, item) => sum + item.vote_count, 0));
    } catch (error) {
      console.error('Error fetching vote data:', error);
    }
  };

  useEffect(() => {
    fetchVoteData();
  }, [electionId]);

  // Real-time vote updates
  useRealtime({
    table: 'votes',
    event: 'INSERT',
    filter: `election_id=eq.${electionId}`,
    onInsert: (payload) => {
      setLastUpdate(new Date());
      setRecentVotes(prev => prev + 1);
      
      // Update vote counts
      setVoteData(prev => 
        prev.map(item => 
          item.option_id === payload.new.option_id
            ? { ...item, vote_count: item.vote_count + 1 }
            : item
        )
      );
      
      setTotalVotes(prev => prev + 1);
      
      // Reset recent votes counter after 3 seconds
      setTimeout(() => setRecentVotes(0), 3000);
    }
  });

  const getPercentage = (votes: number) => {
    return totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
  };

  const leader = voteData.reduce((prev, current) => 
    prev.vote_count > current.vote_count ? prev : current, 
    { option_id: '', option_name: '', vote_count: 0 }
  );

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Live Results: {electionTitle}
          </CardTitle>
          <div className="flex items-center gap-2">
            {isOpen && (
              <Badge variant="secondary" className="animate-pulse">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                Live
              </Badge>
            )}
            <Badge variant="outline">
              <Users className="h-3 w-3 mr-1" />
              {totalVotes} votes
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Live Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 rounded-lg bg-muted/30">
            <div className="text-2xl font-bold text-primary">{totalVotes}</div>
            <div className="text-sm text-muted-foreground">Total Votes</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-muted/30">
            <div className="text-2xl font-bold text-green-600">{recentVotes}</div>
            <div className="text-sm text-muted-foreground">Recent Votes</div>
          </div>
        </div>

        {/* Leading Option */}
        {totalVotes > 0 && (
          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-primary">Current Leader</div>
                <div className="text-lg font-bold">{leader.option_name}</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">{leader.vote_count}</div>
                <div className="text-sm text-muted-foreground">
                  {getPercentage(leader.vote_count).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Vote Breakdown */}
        <div className="space-y-4">
          <h4 className="font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Vote Breakdown
          </h4>
          {voteData
            .sort((a, b) => b.vote_count - a.vote_count)
            .map((item, index) => {
              const percentage = getPercentage(item.vote_count);
              return (
                <div key={item.option_id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Badge variant={index === 0 && totalVotes > 0 ? "default" : "secondary"}>
                        #{index + 1}
                      </Badge>
                      <span className="font-medium">{item.option_name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold">{item.vote_count}</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                  <Progress 
                    value={percentage} 
                    className="h-2"
                  />
                </div>
              );
            })}
        </div>

        {/* Last Update */}
        <div className="text-xs text-muted-foreground text-center pt-4 border-t">
          Last updated: {lastUpdate.toLocaleTimeString()}
          {isOpen && (
            <span className="ml-2 text-green-600">● Live updates enabled</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};