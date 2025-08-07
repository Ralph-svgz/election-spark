import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Vote, Clock, Users, Loader2, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Option {
  id: string;
  name: string;
  election_id: string;
  created_at: string;
}

interface VotingInterfaceProps {
  electionId: string;
  electionTitle: string;
  electionDescription?: string;
  options: Option[];
  totalVotes: number;
  hasVoted: boolean;
  onVote: (electionId: string, optionId: string) => Promise<void>;
  onRefresh: () => Promise<void>;
}

export const VotingInterface = ({
  electionId,
  electionTitle,
  electionDescription,
  options,
  totalVotes,
  hasVoted,
  onVote,
  onRefresh
}: VotingInterfaceProps) => {
  const { toast } = useToast();
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [voting, setVoting] = useState(false);
  const [justVoted, setJustVoted] = useState(false);

  const handleOptionSelect = (optionId: string) => {
    if (hasVoted || voting) return;
    setSelectedOptionId(optionId);
    setShowConfirmDialog(true);
  };

  const confirmVote = async () => {
    if (!selectedOptionId || voting) return;
    
    setVoting(true);
    setShowConfirmDialog(false);
    
    try {
      await onVote(electionId, selectedOptionId);
      setJustVoted(true);
      toast({
        title: "Vote Submitted Successfully!",
        description: "Thank you for participating in this election.",
      });
      await onRefresh();
    } catch (error) {
      toast({
        title: "Vote Failed",
        description: "There was an error submitting your vote. Please try again.",
        variant: "destructive"
      });
    } finally {
      setVoting(false);
      setSelectedOptionId(null);
    }
  };

  const selectedOption = options.find(opt => opt.id === selectedOptionId);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Election Header */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Vote className="h-6 w-6 text-primary" />
                {electionTitle}
              </CardTitle>
              {electionDescription && (
                <CardDescription className="mt-2 text-base">
                  {electionDescription}
                </CardDescription>
              )}
            </div>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {totalVotes} votes
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Voting Status */}
      {hasVoted && (
        <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">You have already voted in this election</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Just Voted Confirmation */}
      {justVoted && (
        <Card className="border-primary/20 bg-primary/5 animate-scale-in">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-primary mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-primary mb-2">Vote Recorded!</h3>
              <p className="text-muted-foreground">
                Your vote has been successfully submitted and counted.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Voting Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Select Your Choice
          </CardTitle>
          <CardDescription>
            Choose one option to cast your vote. This action cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {options.map((option) => (
              <Button
                key={option.id}
                variant={selectedOptionId === option.id ? "default" : "outline"}
                size="lg"
                onClick={() => handleOptionSelect(option.id)}
                disabled={hasVoted || voting}
                className="w-full justify-start text-left h-auto py-4 px-6 hover-scale"
              >
                <div className="flex items-center gap-3 w-full">
                  {voting && selectedOptionId === option.id ? (
                    <Loader2 className="h-5 w-5 animate-spin flex-shrink-0" />
                  ) : (
                    <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ${
                      selectedOptionId === option.id 
                        ? 'bg-primary border-primary' 
                        : 'border-muted-foreground'
                    }`} />
                  )}
                  <span className="text-base font-medium">{option.name}</span>
                </div>
              </Button>
            ))}
          </div>

          {!hasVoted && selectedOptionId && (
            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-3">
                You have selected: <span className="font-medium text-foreground">{selectedOption?.name}</span>
              </p>
              <Button 
                onClick={() => setShowConfirmDialog(true)}
                disabled={voting}
                className="w-full"
              >
                {voting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting Vote...
                  </>
                ) : (
                  <>
                    <Vote className="h-4 w-4 mr-2" />
                    Cast Your Vote
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Your Vote</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>You are about to vote for:</p>
              <p className="font-semibold text-foreground text-lg">
                "{selectedOption?.name}"
              </p>
              <p className="text-sm">
                Please confirm your choice. Once submitted, your vote cannot be changed.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={voting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmVote} disabled={voting}>
              {voting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Confirm Vote"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};