import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Calendar, Clock, Vote, Users, Eye, EyeOff } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useRateLimit } from '@/hooks/useRateLimit';

interface Election {
  id: string;
  title: string;
  description: string | null;
  is_open: boolean;
  created_at: string;
  created_by: string;
}

interface OptimizedElectionCardProps {
  election: Election;
  onVote?: (electionId: string) => void;
  onViewResults?: (electionId: string) => void;
  userHasVoted?: boolean;
  voteCount?: number;
  totalVoters?: number;
  isAdmin?: boolean;
}

export const OptimizedElectionCard = memo<OptimizedElectionCardProps>(({
  election,
  onVote,
  onViewResults,
  userHasVoted = false,
  voteCount = 0,
  totalVoters = 0,
  isAdmin = false
}) => {
  const { toast } = useToast();
  const voteRateLimit = useRateLimit({ 
    maxAttempts: 3, 
    windowMs: 60000, // 1 minute
    message: 'Please wait before voting again.' 
  });

  const handleVote = () => {
    if (!voteRateLimit.checkRateLimit()) return;
    
    if (userHasVoted) {
      toast({
        title: "Already Voted",
        description: "You have already voted in this election.",
        variant: "default"
      });
      return;
    }

    onVote?.(election.id);
  };

  const handleViewResults = () => {
    onViewResults?.(election.id);
  };

  const participationRate = totalVoters > 0 ? (voteCount / totalVoters) * 100 : 0;

  return (
    <Card 
      className="h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
      role="article"
      aria-labelledby={`election-title-${election.id}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle 
            id={`election-title-${election.id}`}
            className="text-lg font-semibold leading-tight"
          >
            {election.title}
          </CardTitle>
          <Badge 
            variant={election.is_open ? "default" : "secondary"}
            className="shrink-0"
            aria-label={`Election status: ${election.is_open ? 'Open' : 'Closed'}`}
          >
            {election.is_open ? 'Open' : 'Closed'}
          </Badge>
        </div>
        
        {election.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {election.description}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Election Meta Info */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" aria-hidden="true" />
            <time dateTime={election.created_at}>
              {format(new Date(election.created_at), 'MMM dd, yyyy')}
            </time>
          </div>
          <div className="flex items-center gap-1">
            <Vote className="h-3 w-3" aria-hidden="true" />
            <span aria-label={`${voteCount} votes cast`}>
              {voteCount} votes
            </span>
          </div>
        </div>

        {/* Participation Progress */}
        {totalVoters > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Participation</span>
              <span className="font-medium">
                {participationRate.toFixed(1)}%
              </span>
            </div>
            <Progress 
              value={participationRate} 
              className="h-2"
              aria-label={`Participation rate: ${participationRate.toFixed(1)}%`}
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {election.is_open && !isAdmin && (
            <Button
              onClick={handleVote}
              disabled={userHasVoted || !voteRateLimit.checkRateLimit}
              className="flex-1"
              aria-describedby={userHasVoted ? `voted-status-${election.id}` : undefined}
            >
              <Vote className="h-4 w-4 mr-2" aria-hidden="true" />
              {userHasVoted ? 'Voted' : 'Vote Now'}
            </Button>
          )}
          
          <Button
            variant="outline"
            onClick={handleViewResults}
            className={election.is_open && !isAdmin ? 'flex-1' : 'w-full'}
          >
            {election.is_open ? (
              <>
                <Eye className="h-4 w-4 mr-2" aria-hidden="true" />
                Live Results
              </>
            ) : (
              <>
                <EyeOff className="h-4 w-4 mr-2" aria-hidden="true" />
                Final Results
              </>
            )}
          </Button>
        </div>

        {/* Accessibility Status */}
        {userHasVoted && (
          <div 
            id={`voted-status-${election.id}`}
            className="text-sm text-muted-foreground text-center"
            role="status"
            aria-live="polite"
          >
            ✓ You have voted in this election
          </div>
        )}
      </CardContent>
    </Card>
  );
});

OptimizedElectionCard.displayName = 'OptimizedElectionCard';