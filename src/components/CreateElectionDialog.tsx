import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, X } from "lucide-react";

interface CreateElectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onElectionCreated: () => void;
}

export const CreateElectionDialog = ({ open, onOpenChange, onElectionCreated }: CreateElectionDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    options: ["", ""]
  });

  const addOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, ""]
    }));
  };

  const removeOption = (index: number) => {
    if (formData.options.length > 2) {
      setFormData(prev => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index)
      }));
    }
  };

  const updateOption = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map((option, i) => i === index ? value : option)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    // Validate form
    if (!formData.title.trim()) {
      toast({
        title: "Validation Error",
        description: "Election title is required",
        variant: "destructive"
      });
      return;
    }

    const validOptions = formData.options.filter(option => option.trim());
    if (validOptions.length < 2) {
      toast({
        title: "Validation Error",
        description: "At least 2 options are required",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Create election
      const { data: election, error: electionError } = await supabase
        .from('elections')
        .insert({
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          created_by: user.id,
          is_open: true
        })
        .select()
        .single();

      if (electionError) throw electionError;

      // Create options
      const optionsData = validOptions.map(option => ({
        election_id: election.id,
        name: option.trim()
      }));

      const { error: optionsError } = await supabase
        .from('options')
        .insert(optionsData);

      if (optionsError) throw optionsError;

      toast({
        title: "Success",
        description: "Election created successfully"
      });

      // Reset form
      setFormData({
        title: "",
        description: "",
        options: ["", ""]
      });

      onElectionCreated();
    } catch (error) {
      console.error('Error creating election:', error);
      toast({
        title: "Error",
        description: "Failed to create election",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Election</DialogTitle>
          <DialogDescription>
            Set up a new election with title, description, and voting options.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Election Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter election title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter election description (optional)"
              rows={3}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Voting Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.options.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    required
                  />
                  {formData.options.length > 2 && (
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
            </CardContent>
          </Card>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Election"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};