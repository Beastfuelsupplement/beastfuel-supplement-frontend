-- Create table for 2FA backup codes
CREATE TABLE public.mfa_backup_codes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    code_hash text NOT NULL,
    used_at timestamp with time zone DEFAULT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mfa_backup_codes ENABLE ROW LEVEL SECURITY;

-- Users can view their own backup codes
CREATE POLICY "Users can view their own backup codes"
ON public.mfa_backup_codes
FOR SELECT
USING ((auth.uid() IS NOT NULL) AND (auth.uid() = user_id));

-- Users can insert their own backup codes
CREATE POLICY "Users can insert their own backup codes"
ON public.mfa_backup_codes
FOR INSERT
WITH CHECK ((auth.uid() IS NOT NULL) AND (auth.uid() = user_id));

-- Users can update their own backup codes (mark as used)
CREATE POLICY "Users can update their own backup codes"
ON public.mfa_backup_codes
FOR UPDATE
USING ((auth.uid() IS NOT NULL) AND (auth.uid() = user_id));

-- Users can delete their own backup codes
CREATE POLICY "Users can delete their own backup codes"
ON public.mfa_backup_codes
FOR DELETE
USING ((auth.uid() IS NOT NULL) AND (auth.uid() = user_id));

-- Create index for faster lookups
CREATE INDEX idx_mfa_backup_codes_user_id ON public.mfa_backup_codes(user_id);
CREATE INDEX idx_mfa_backup_codes_hash ON public.mfa_backup_codes(code_hash);