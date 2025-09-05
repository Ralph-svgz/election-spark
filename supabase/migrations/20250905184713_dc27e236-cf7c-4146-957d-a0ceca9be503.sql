-- Add missing columns to elections table for better functionality
ALTER TABLE public.elections 
ADD COLUMN IF NOT EXISTS start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS end_date TIMESTAMP WITH TIME ZONE;

-- Add description column to options if it doesn't exist
ALTER TABLE public.options 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Create indexes for better performance (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_elections_is_open ON public.elections(is_open);
CREATE INDEX IF NOT EXISTS idx_elections_created_by ON public.elections(created_by);
CREATE INDEX IF NOT EXISTS idx_options_election_id ON public.options(election_id);
CREATE INDEX IF NOT EXISTS idx_votes_election_id ON public.votes(election_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON public.votes(user_id);
CREATE INDEX IF NOT EXISTS idx_votes_option_id ON public.votes(option_id);

-- Ensure RLS policies are properly set up for viewing votes (admin access to results)
DROP POLICY IF EXISTS "Admins can view election results" ON public.votes;
CREATE POLICY "Admins can view election results" 
ON public.votes 
FOR SELECT 
USING (
  get_user_role(auth.uid()) = 'admin'::user_role OR 
  auth.uid() = user_id
);

-- Enable realtime for live vote counting
ALTER TABLE public.votes REPLICA IDENTITY FULL;
ALTER TABLE public.elections REPLICA IDENTITY FULL;