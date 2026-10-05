-- Create account activity log table
CREATE TABLE public.account_activity (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    event_type TEXT NOT NULL,
    event_description TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient user queries
CREATE INDEX idx_account_activity_user_id ON public.account_activity(user_id);
CREATE INDEX idx_account_activity_created_at ON public.account_activity(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.account_activity ENABLE ROW LEVEL SECURITY;

-- Users can only view their own activity
CREATE POLICY "Users can view their own activity"
ON public.account_activity
FOR SELECT
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Users can insert their own activity (for client-side logging)
CREATE POLICY "Users can insert their own activity"
ON public.account_activity
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);