-- Add password_changed flag to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS password_changed_at timestamptz DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.password_changed_at IS 'Timestamp when user changed their password from default credentials';