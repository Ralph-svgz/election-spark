import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Clock, Plus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface ScheduledElection {
  title: string;
  description: string;
  options: string[];
  scheduledStart: string;
  scheduledEnd: string;
}

export const ElectionScheduler = () => {
  const { user } = useAuth();
  const [scheduledElection, setScheduledElection] = useState<ScheduledElection>({
    title: '',
    description: '',
    options: ['', ''],
    scheduledStart: '',
    scheduledEnd: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const addOption = () => {
    setScheduledElection(prev => ({
      ...prev,
      options: [...prev.options, '']
    }));
  };

  const removeOption = (index: number) => {
    if (scheduledElection.options.length > 2) {
      setScheduledElection(prev => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index)
      }));
    }
  };

  const updateOption = (index: number, value: string) => {
    setScheduledElection(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => i === index ? value : opt)
    }));
  };

  const scheduleElection = async () => {
    setLoading(true);
    try {
      // Validate form
      if (!scheduledElection.title.trim()) {
        throw new Error('Title is required');
      }

      const validOptions = scheduledElection.options.filter(opt => opt.trim() !== '');
      if (validOptions.length < 2) {
        throw new Error('At least 2 options are required');
      }

      if (!scheduledElection.scheduledStart || !scheduledElection.scheduledEnd) {
        throw new Error('Start and end dates are required');
      }

      const startDate = new Date(scheduledElection.scheduledStart);
      const endDate = new Date(scheduledElection.scheduledEnd);
      const now = new Date();

      if (startDate <= now) {
        throw new Error('Start date must be in the future');
      }

      if (endDate <= startDate) {
        throw new Error('End date must be after start date');
      }

      // Create the election as closed initially
      const { data: election, error: electionError } = await supabase
        .from('elections')
        .insert({
          title: scheduledElection.title,
          description: scheduledElection.description || null,
          is_open: false,
          created_by: user?.id || ''
        })
        .select()
        .single();

      if (electionError) throw electionError;

      // Create options
      const optionsData = validOptions.map(option => ({
        name: option,
        election_id: election.id
      }));

      const { error: optionsError } = await supabase
        .from('options')
        .insert(optionsData);

      if (optionsError) throw optionsError;

      // Store scheduling information (you might want to create a separate table for this)
      // For now, we'll just show a success message with the scheduling info
      
      toast({
        title: "Election Scheduled",
        description: `Election "${scheduledElection.title}" has been created and will need to be manually opened at ${format(startDate, 'PPp')}`
      });

      // Reset form
      setScheduledElection({
        title: '',
        description: '',
        options: ['', ''],
        scheduledStart: '',
        scheduledEnd: ''
      });

    } catch (error) {
      console.error('Error scheduling election:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to schedule election",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Schedule Election
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Election Title</Label>
            <Input
              id="title"
              placeholder="Enter election title"
              value={scheduledElection.title}
              onChange={(e) => setScheduledElection(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Enter election description"
              value={scheduledElection.description}
              onChange={(e) => setScheduledElection(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div>
            <Label>Options</Label>
            <div className="space-y-2">
              {scheduledElection.options.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder={`Option ${index + 1}`}
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                  />
                  {scheduledElection.options.length > 2 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeOption(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={addOption}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Option
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start">Scheduled Start</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="start"
                  type="datetime-local"
                  className="pl-10"
                  value={scheduledElection.scheduledStart}
                  onChange={(e) => setScheduledElection(prev => ({ ...prev, scheduledStart: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="end">Scheduled End</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="end"
                  type="datetime-local"
                  className="pl-10"
                  value={scheduledElection.scheduledEnd}
                  onChange={(e) => setScheduledElection(prev => ({ ...prev, scheduledEnd: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-start gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="text-sm">
                <div className="font-medium text-foreground mb-1">Scheduling Note</div>
                <div className="text-muted-foreground">
                  Elections will be created but remain closed until manually opened. 
                  Future versions will include automatic scheduling.
                </div>
              </div>
            </div>
          </div>

          <Button 
            onClick={scheduleElection} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Scheduling...' : 'Schedule Election'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};