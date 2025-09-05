-- Create profiles table for additional user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create elections table
CREATE TABLE public.elections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'closed')),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create options table for election choices
CREATE TABLE public.options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  election_id UUID NOT NULL REFERENCES public.elections(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create votes table
CREATE TABLE public.votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  election_id UUID NOT NULL REFERENCES public.elections(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES public.options(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(election_id, user_id) -- Ensure one vote per user per election
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.elections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for elections
CREATE POLICY "Elections are viewable by authenticated users" 
ON public.elections 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can create elections" 
ON public.elections 
FOR INSERT 
WITH CHECK (
  auth.uid() = created_by AND 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can update elections" 
ON public.elections 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can delete elections" 
ON public.elections 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- RLS Policies for options
CREATE POLICY "Options are viewable by authenticated users" 
ON public.options 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can create options" 
ON public.options 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can update options" 
ON public.options 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can delete options" 
ON public.options 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- RLS Policies for votes
CREATE POLICY "Users can view votes for active elections" 
ON public.votes 
FOR SELECT 
USING (
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM public.elections 
    WHERE id = election_id AND status = 'active'
  )
);

CREATE POLICY "Users can insert their own votes for active elections" 
ON public.votes 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.elections 
    WHERE id = election_id AND status = 'active'
  )
);

-- Create indexes for better performance
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_elections_status ON public.elections(status);
CREATE INDEX idx_elections_created_by ON public.elections(created_by);
CREATE INDEX idx_options_election_id ON public.options(election_id);
CREATE INDEX idx_votes_election_id ON public.votes(election_id);
CREATE INDEX idx_votes_user_id ON public.votes(user_id);
CREATE INDEX idx_votes_option_id ON public.votes(option_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_elections_updated_at
  BEFORE UPDATE ON public.elections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();