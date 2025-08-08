import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, Vote, Calendar, Download, Activity } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

interface SystemStats {
  totalElections: number;
  totalVotes: number;
  totalUsers: number;
  activeElections: number;
  avgVotesPerElection: number;
  adminCount: number;
}

interface DailyActivity {
  date: string;
  elections: number;
  votes: number;
  users: number;
}

interface ElectionPopularity {
  title: string;
  votes: number;
  participation_rate: number;
}

export const SystemAnalytics = () => {
  const [stats, setStats] = useState<SystemStats>({
    totalElections: 0,
    totalVotes: 0,
    totalUsers: 0,
    activeElections: 0,
    avgVotesPerElection: 0,
    adminCount: 0
  });
  const [dailyActivity, setDailyActivity] = useState<DailyActivity[]>([]);
  const [popularElections, setPopularElections] = useState<ElectionPopularity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSystemAnalytics();
  }, []);

  const fetchSystemAnalytics = async () => {
    try {
      // Fetch basic stats
      const [electionsRes, votesRes, usersRes] = await Promise.all([
        supabase.from('elections').select('id, is_open'),
        supabase.from('votes').select('id'),
        supabase.from('profiles').select('id, role')
      ]);

      const elections = electionsRes.data || [];
      const votes = votesRes.data || [];
      const users = usersRes.data || [];

      const systemStats: SystemStats = {
        totalElections: elections.length,
        totalVotes: votes.length,
        totalUsers: users.length,
        activeElections: elections.filter(e => e.is_open).length,
        avgVotesPerElection: elections.length > 0 ? votes.length / elections.length : 0,
        adminCount: users.filter(u => u.role === 'admin').length
      };

      setStats(systemStats);

      // Fetch daily activity for the last 7 days
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(new Date(), i);
        return {
          date: format(date, 'yyyy-MM-dd'),
          startOfDay: startOfDay(date).toISOString(),
          endOfDay: endOfDay(date).toISOString()
        };
      }).reverse();

      const dailyData: DailyActivity[] = [];

      for (const day of last7Days) {
        const [dayElections, dayVotes, dayUsers] = await Promise.all([
          supabase
            .from('elections')
            .select('id')
            .gte('created_at', day.startOfDay)
            .lt('created_at', day.endOfDay),
          supabase
            .from('votes')
            .select('id')
            .gte('created_at', day.startOfDay)
            .lt('created_at', day.endOfDay),
          supabase
            .from('profiles')
            .select('id')
            .gte('created_at', day.startOfDay)
            .lt('created_at', day.endOfDay)
        ]);

        dailyData.push({
          date: format(new Date(day.date), 'MMM dd'),
          elections: dayElections.data?.length || 0,
          votes: dayVotes.data?.length || 0,
          users: dayUsers.data?.length || 0
        });
      }

      setDailyActivity(dailyData);

      // Fetch popular elections
      const { data: electionsWithVotes, error: popularError } = await supabase
        .from('elections')
        .select(`
          id,
          title,
          votes:votes(count)
        `)
        .limit(5);

      if (!popularError && electionsWithVotes) {
        const popularity = electionsWithVotes
          .map(election => ({
            title: election.title,
            votes: election.votes.length,
            participation_rate: systemStats.totalUsers > 0 
              ? (election.votes.length / systemStats.totalUsers) * 100 
              : 0
          }))
          .sort((a, b) => b.votes - a.votes);

        setPopularElections(popularity);
      }

    } catch (error) {
      console.error('Error fetching system analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportSystemReport = async () => {
    try {
      const reportData = [
        ['System Analytics Report', ''],
        ['Generated on', format(new Date(), 'PPP')],
        ['', ''],
        ['System Overview', ''],
        ['Total Elections', stats.totalElections],
        ['Total Votes', stats.totalVotes],
        ['Total Users', stats.totalUsers],
        ['Active Elections', stats.activeElections],
        ['Admin Users', stats.adminCount],
        ['Average Votes per Election', stats.avgVotesPerElection.toFixed(1)],
        ['', ''],
        ['Popular Elections', ''],
        ['Title', 'Votes', 'Participation Rate'],
        ...popularElections.map(election => [
          election.title,
          election.votes,
          `${election.participation_rate.toFixed(1)}%`
        ])
      ];

      const csvContent = reportData.map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `system-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1'];

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-pulse text-muted-foreground">Loading system analytics...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <Vote className="h-8 w-8 mx-auto mb-2 text-primary" />
            <div className="text-3xl font-bold text-primary">{stats.totalVotes}</div>
            <div className="text-sm text-muted-foreground">Total Votes Cast</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Calendar className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <div className="text-3xl font-bold text-green-600">{stats.totalElections}</div>
            <div className="text-sm text-muted-foreground">Elections Created</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
            <div className="text-3xl font-bold text-blue-600">{stats.totalUsers}</div>
            <div className="text-sm text-muted-foreground">Registered Users</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Activity className="h-8 w-8 mx-auto mb-2 text-orange-600" />
            <div className="text-3xl font-bold text-orange-600">{stats.activeElections}</div>
            <div className="text-sm text-muted-foreground">Active Elections</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 text-purple-600" />
            <div className="text-3xl font-bold text-purple-600">{stats.avgVotesPerElection.toFixed(1)}</div>
            <div className="text-sm text-muted-foreground">Avg Votes/Election</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Users className="h-8 w-8 mx-auto mb-2 text-red-600" />
            <div className="text-3xl font-bold text-red-600">{stats.adminCount}</div>
            <div className="text-sm text-muted-foreground">Admin Users</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Activity */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                7-Day Activity
              </CardTitle>
              <Badge variant="secondary">Last 7 days</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyActivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="votes" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  name="Votes"
                />
                <Line 
                  type="monotone" 
                  dataKey="elections" 
                  stroke="#82ca9d" 
                  strokeWidth={2}
                  name="Elections"
                />
                <Line 
                  type="monotone" 
                  dataKey="users" 
                  stroke="#ffc658" 
                  strokeWidth={2}
                  name="New Users"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Popular Elections */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Most Popular Elections
            </CardTitle>
          </CardHeader>
          <CardContent>
            {popularElections.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={popularElections.slice(0, 5)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="title" 
                    tick={{ fontSize: 12 }}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [value, name === 'votes' ? 'Votes' : 'Participation Rate']}
                  />
                  <Bar dataKey="votes" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No elections data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Participation Rates */}
      {popularElections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Vote className="h-5 w-5" />
              Participation Rates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {popularElections.slice(0, 5).map((election, index) => (
                <div key={election.title} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{election.title}</span>
                    <div className="text-right">
                      <span className="font-bold">{election.votes} votes</span>
                      <span className="text-muted-foreground ml-2">
                        ({election.participation_rate.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all duration-300" 
                      style={{ 
                        backgroundColor: COLORS[index % COLORS.length],
                        width: `${Math.min(election.participation_rate, 100)}%`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Export */}
      <Card>
        <CardHeader>
          <CardTitle>System Report</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={exportSystemReport} variant="outline" className="w-full">
            <Download className="h-4 w-4 mr-2" />
            Export System Analytics Report (CSV)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};