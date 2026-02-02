-- Email accounts table
CREATE TABLE public.email_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  password_hash TEXT,
  quota_mb INTEGER NOT NULL DEFAULT 1000,
  used_mb INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(email)
);

-- Email forwarders table
CREATE TABLE public.email_forwarders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  source_email TEXT NOT NULL,
  destination_emails TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(source_email)
);

-- Email autoresponders table
CREATE TABLE public.email_autoresponders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email_account_id UUID NOT NULL REFERENCES public.email_accounts(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_forwarders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_autoresponders ENABLE ROW LEVEL SECURITY;

-- Email accounts policies
CREATE POLICY "Users can view email accounts of their sites"
ON public.email_accounts FOR SELECT
USING (has_site_access(auth.uid(), site_id));

CREATE POLICY "Owners and admins can create email accounts"
ON public.email_accounts FOR INSERT
WITH CHECK (get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]));

CREATE POLICY "Owners and admins can update email accounts"
ON public.email_accounts FOR UPDATE
USING (get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]));

CREATE POLICY "Owners and admins can delete email accounts"
ON public.email_accounts FOR DELETE
USING (get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]));

-- Email forwarders policies
CREATE POLICY "Users can view forwarders of their sites"
ON public.email_forwarders FOR SELECT
USING (has_site_access(auth.uid(), site_id));

CREATE POLICY "Owners and admins can create forwarders"
ON public.email_forwarders FOR INSERT
WITH CHECK (get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]));

CREATE POLICY "Owners and admins can update forwarders"
ON public.email_forwarders FOR UPDATE
USING (get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]));

CREATE POLICY "Owners and admins can delete forwarders"
ON public.email_forwarders FOR DELETE
USING (get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]));

-- Email autoresponders policies (join through email_accounts)
CREATE POLICY "Users can view autoresponders"
ON public.email_autoresponders FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.email_accounts ea 
  WHERE ea.id = email_account_id 
  AND has_site_access(auth.uid(), ea.site_id)
));

CREATE POLICY "Owners and admins can create autoresponders"
ON public.email_autoresponders FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.email_accounts ea 
  WHERE ea.id = email_account_id 
  AND get_site_role(auth.uid(), ea.site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role])
));

CREATE POLICY "Owners and admins can update autoresponders"
ON public.email_autoresponders FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.email_accounts ea 
  WHERE ea.id = email_account_id 
  AND get_site_role(auth.uid(), ea.site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role])
));

CREATE POLICY "Owners and admins can delete autoresponders"
ON public.email_autoresponders FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.email_accounts ea 
  WHERE ea.id = email_account_id 
  AND get_site_role(auth.uid(), ea.site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role])
));

-- Update triggers
CREATE TRIGGER update_email_accounts_updated_at
BEFORE UPDATE ON public.email_accounts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_forwarders_updated_at
BEFORE UPDATE ON public.email_forwarders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_autoresponders_updated_at
BEFORE UPDATE ON public.email_autoresponders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();