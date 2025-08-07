import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, Download, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface VotingAnalyticsProps {
  electionId: string;
  isAdmin: boolean;
}

interface VoteStats {
  option_name: string;
  vote_count: number;
  percentage: number;
}

interface HourlyVotes {
  hour: string;
  votes: number;
}

export const VotingAnalytics = ({ electionId, isAdmin }: VotingAnalyticsProps) => {
  const [voteStats, setVoteStats] = useState<VoteStats[]>([]);
  const [hourlyData, setHourlyData] = useState<HourlyVotes[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [peakHour, setPeakHour] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      // Fetch vote statistics
      const { data: options, error: optionsError } = await supabase
        .from('options')
        .select(`
          id,
          name,
          votes:votes(count)
        `)
        .eq('election_id', electionId);

      if (optionsError) throw optionsError;

      // Calculate vote stats
      const stats = options.map(option => ({
        option_name: option.name,
        vote_count: option.votes.length,
        percentage: 0 // Will calculate after getting total
      }));

      const total = stats.reduce((sum, stat) => sum + stat.vote_count, 0);
      const statsWithPercentage = stats.map(stat => ({
        ...stat,
        percentage: total > 0 ? (stat.vote_count / total) * 100 : 0
      }));

      setVoteStats(statsWithPercentage);
      setTotalVotes(total);

      // Fetch hourly voting data
      const { data: votes, error: votesError } = await supabase
        .from('votes')
        .select('created_at')
        .eq('election_id', electionId)
        .order('created_at', { ascending: true });

      if (votesError) throw votesError;

      // Group votes by hour
      const hourlyMap = new Map<string, number>();
      votes.forEach(vote => {
        const hour = format(new Date(vote.created_at), 'HH:mm');
        hourlyMap.set(hour, (hourlyMap.get(hour) || 0) + 1);
      });

      const hourlyArray = Array.from(hourlyMap.entries()).map(([hour, votes]) => ({
        hour,
        votes
      }));

      setHourlyData(hourlyArray);

      // Find peak hour
      if (hourlyArray.length > 0) {
        const peak = hourlyArray.reduce((max, current) => 
          current.votes > max.votes ? current : max
        );
        setPeakHour(peak.hour);
      }

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [electionId]);

  const exportData = async () => {
    try {
      // Get basic vote data with timestamps and option info
      const { data: votes, error: votesError } = await supabase
        .from('votes')
        .select(`
          created_at,
          option_id,
          user_id
        `)
        .eq('election_id', electionId);

      if (votesError) throw votesError;

      // Get options for this election
      const { data: options, error: optionsError } = await supabase
        .from('options')
        .select('id, name')
        .eq('election_id', electionId);

      if (optionsError) throw optionsError;

      // Create option name mapping
      const optionMap = new Map(options.map(opt => [opt.id, opt.name]));

      const csvContent = [
        ['Timestamp', 'Option', 'Vote ID'],
        ...votes.map(vote => [
          vote.created_at,
          optionMap.get(vote.option_id) || 'Unknown',
          vote.user_id.substring(0, 8) + '...' // Anonymized user reference
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `election-${electionId}-data.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1'];

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-pulse text-muted-foreground">Loading analytics...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-primary">{totalVotes}</div>
            <div className="text-sm text-muted-foreground">Total Votes</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-green-600">{voteStats.length}</div>
            <div className="text-sm text-muted-foreground">Options</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-orange-600">{peakHour || '--'}</div>
            <div className="text-sm text-muted-foreground">Peak Hour</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Vote Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={voteStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="option_name" 
                  tick={{ fontSize: 12 }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [value, 'Votes']}
                  labelFormatter={(label) => `Option: ${label}`}
                />
                <Bar dataKey="vote_count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Vote Percentage
            </CardTitle>
          </CardHeader>
          <CardContent>
            {totalVotes > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={voteStats}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ option_name, percentage }) => 
                      `${option_name}: ${percentage.toFixed(1)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="vote_count"
                  >
                    {voteStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [value, 'Votes']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No votes to display
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Hourly Voting Trend */}
      {hourlyData.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Voting Timeline
              </CardTitle>
              {peakHour && (
                <Badge variant="secondary">
                  Peak: {peakHour}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="votes" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  dot={{ fill: '#8884d8' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Export Data */}
      {isAdmin && totalVotes > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Export Data</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={exportData} variant="outline" className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Export Voting Data (CSV)
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};