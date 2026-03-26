CREATE TYPE public.mail_queue_status AS ENUM ('queued', 'deferred', 'delivered', 'bounced', 'held');
CREATE TYPE public.mail_deliverability_status AS ENUM ('healthy', 'warning', 'critical');
CREATE TYPE public.mail_dkim_status AS ENUM ('active', 'rotating', 'revoked');

CREATE TABLE public.mail_domain_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL UNIQUE REFERENCES public.sites(id) ON DELETE CASCADE,
  dkim_selector TEXT NOT NULL DEFAULT 'default',
  dkim_public_key TEXT,
  dkim_private_key_hint TEXT,
  dkim_last_rotated_at TIMESTAMPTZ,
  spf_policy TEXT NOT NULL DEFAULT 'v=spf1 mx a ~all',
  dmarc_policy TEXT NOT NULL DEFAULT 'v=DMARC1; p=quarantine; rua=mailto:postmaster@localhost',
  spam_filter_provider TEXT NOT NULL DEFAULT 'rspamd',
  spam_filter_enabled BOOLEAN NOT NULL DEFAULT true,
  spam_threshold NUMERIC(4,2) NOT NULL DEFAULT 6.50,
  quarantine_enabled BOOLEAN NOT NULL DEFAULT true,
  smtp_relay_enabled BOOLEAN NOT NULL DEFAULT false,
  smtp_relay_host TEXT,
  smtp_relay_port INTEGER,
  smtp_relay_username TEXT,
  smtp_relay_password_hint TEXT,
  webmail_provider TEXT NOT NULL DEFAULT 'roundcube',
  webmail_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.mail_dkim_rotations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  selector TEXT NOT NULL,
  public_key TEXT NOT NULL,
  dns_name TEXT NOT NULL,
  dns_value TEXT NOT NULL,
  status public.mail_dkim_status NOT NULL DEFAULT 'active',
  rotated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.mail_queue_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  queue_id TEXT NOT NULL,
  message_id TEXT NOT NULL,
  sender TEXT NOT NULL,
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  status public.mail_queue_status NOT NULL DEFAULT 'queued',
  size_bytes INTEGER NOT NULL DEFAULT 0,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  next_attempt_at TIMESTAMPTZ,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.mail_quarantine_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  email_account_id UUID REFERENCES public.email_accounts(id) ON DELETE SET NULL,
  sender TEXT NOT NULL,
  subject TEXT NOT NULL,
  spam_score NUMERIC(5,2) NOT NULL,
  detection_summary TEXT,
  released_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.mail_smtp_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  direction TEXT NOT NULL DEFAULT 'outbound',
  status TEXT NOT NULL,
  sender TEXT NOT NULL,
  recipient TEXT NOT NULL,
  remote_host TEXT,
  queue_id TEXT,
  message_id TEXT,
  response TEXT,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.mail_bounce_diagnostics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  recipient TEXT NOT NULL,
  status TEXT NOT NULL,
  bounce_class TEXT NOT NULL,
  diagnostic_code TEXT,
  recommended_action TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.mail_deliverability_checks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  status public.mail_deliverability_status NOT NULL DEFAULT 'healthy',
  score INTEGER NOT NULL DEFAULT 100,
  blacklist_hits JSONB NOT NULL DEFAULT '[]'::jsonb,
  dns_warnings JSONB NOT NULL DEFAULT '[]'::jsonb,
  summary TEXT,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.mailbox_usage_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email_account_id UUID NOT NULL REFERENCES public.email_accounts(id) ON DELETE CASCADE,
  used_mb INTEGER NOT NULL DEFAULT 0,
  message_count INTEGER NOT NULL DEFAULT 0,
  spam_count INTEGER NOT NULL DEFAULT 0,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.mail_domain_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mail_dkim_rotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mail_queue_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mail_quarantine_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mail_smtp_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mail_bounce_diagnostics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mail_deliverability_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mailbox_usage_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view mail domain settings"
ON public.mail_domain_settings FOR SELECT
USING (public.has_site_access(auth.uid(), site_id));
CREATE POLICY "Owners and admins can manage mail domain settings"
ON public.mail_domain_settings FOR ALL
USING (public.get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]))
WITH CHECK (public.get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]));

CREATE POLICY "Users can view mail dkim rotations"
ON public.mail_dkim_rotations FOR SELECT
USING (public.has_site_access(auth.uid(), site_id));
CREATE POLICY "Owners and admins can manage mail dkim rotations"
ON public.mail_dkim_rotations FOR ALL
USING (public.get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]))
WITH CHECK (public.get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]));

CREATE POLICY "Users can view mail queue"
ON public.mail_queue_messages FOR SELECT
USING (public.has_site_access(auth.uid(), site_id));
CREATE POLICY "Owners and admins can manage mail queue"
ON public.mail_queue_messages FOR ALL
USING (public.get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]))
WITH CHECK (public.get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]));

CREATE POLICY "Users can view mail quarantine"
ON public.mail_quarantine_messages FOR SELECT
USING (public.has_site_access(auth.uid(), site_id));
CREATE POLICY "Owners and admins can manage mail quarantine"
ON public.mail_quarantine_messages FOR ALL
USING (public.get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]))
WITH CHECK (public.get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]));

CREATE POLICY "Users can view mail smtp logs"
ON public.mail_smtp_logs FOR SELECT
USING (public.has_site_access(auth.uid(), site_id));
CREATE POLICY "Owners and admins can manage mail smtp logs"
ON public.mail_smtp_logs FOR ALL
USING (public.get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]))
WITH CHECK (public.get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]));

CREATE POLICY "Users can view mail bounce diagnostics"
ON public.mail_bounce_diagnostics FOR SELECT
USING (public.has_site_access(auth.uid(), site_id));
CREATE POLICY "Owners and admins can manage mail bounce diagnostics"
ON public.mail_bounce_diagnostics FOR ALL
USING (public.get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]))
WITH CHECK (public.get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]));

CREATE POLICY "Users can view mail deliverability checks"
ON public.mail_deliverability_checks FOR SELECT
USING (public.has_site_access(auth.uid(), site_id));
CREATE POLICY "Owners and admins can manage mail deliverability checks"
ON public.mail_deliverability_checks FOR ALL
USING (public.get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]))
WITH CHECK (public.get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]));

CREATE POLICY "Users can view mailbox usage snapshots"
ON public.mailbox_usage_snapshots FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.email_accounts ea
  WHERE ea.id = email_account_id AND public.has_site_access(auth.uid(), ea.site_id)
));
CREATE POLICY "Owners and admins can manage mailbox usage snapshots"
ON public.mailbox_usage_snapshots FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.email_accounts ea
  WHERE ea.id = email_account_id AND public.get_site_role(auth.uid(), ea.site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role])
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.email_accounts ea
  WHERE ea.id = email_account_id AND public.get_site_role(auth.uid(), ea.site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role])
));

CREATE TRIGGER update_mail_domain_settings_updated_at
BEFORE UPDATE ON public.mail_domain_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.mail_domain_settings (
  site_id,
  dmarc_policy,
  webmail_url,
  smtp_relay_host,
  smtp_relay_port,
  smtp_relay_username
)
SELECT
  s.id,
  replace('v=DMARC1; p=quarantine; rua=mailto:postmaster@' || lower(s.domain), '@localhost', '@' || lower(s.domain)),
  'https://mail.' || lower(s.domain) || '/roundcube',
  'smtp.' || lower(s.domain),
  587,
  'relay@' || lower(s.domain)
FROM public.sites s
ON CONFLICT (site_id) DO NOTHING;

INSERT INTO public.mail_queue_messages (site_id, queue_id, message_id, sender, recipient, subject, status, size_bytes, attempt_count, last_attempt_at, next_attempt_at, reason)
SELECT s.id, 'Q-' || substr(replace(s.id::text, '-', ''), 1, 8), '<msg-' || substr(replace(s.id::text, '-', ''), 1, 12) || '@' || lower(s.domain) || '>', 'noreply@' || lower(s.domain), 'admin@' || lower(s.domain), 'Welcome to your new hosting mail stack', 'queued', 48213, 1, now() - interval '5 minutes', now() + interval '10 minutes', 'Awaiting remote MX connection'
FROM public.sites s
ON CONFLICT DO NOTHING;

INSERT INTO public.mail_quarantine_messages (site_id, sender, subject, spam_score, detection_summary)
SELECT s.id, 'mailer@bulk-sender.test', 'Invoice reminder', 8.7, 'Bulk mail heuristics and URL reputation exceeded policy threshold.'
FROM public.sites s
ON CONFLICT DO NOTHING;

INSERT INTO public.mail_smtp_logs (site_id, direction, status, sender, recipient, remote_host, queue_id, message_id, response)
SELECT s.id, 'outbound', 'accepted', 'noreply@' || lower(s.domain), 'admin@' || lower(s.domain), 'mx.remote.test', 'Q-' || substr(replace(s.id::text, '-', ''), 1, 8), '<welcome@' || lower(s.domain) || '>', '250 2.0.0 queued as abc123'
FROM public.sites s
ON CONFLICT DO NOTHING;

INSERT INTO public.mail_bounce_diagnostics (site_id, recipient, status, bounce_class, diagnostic_code, recommended_action)
SELECT s.id, 'missing-user@' || lower(s.domain), '5.1.1', 'hard', '550 5.1.1 User unknown', 'Verify recipient address, alias, or forwarding configuration.'
FROM public.sites s
ON CONFLICT DO NOTHING;

INSERT INTO public.mail_deliverability_checks (site_id, status, score, blacklist_hits, dns_warnings, summary)
SELECT s.id, 'warning', 82, '[]'::jsonb, '["DKIM has not been generated yet."]'::jsonb, 'Initial deliverability baseline created during migration.'
FROM public.sites s
ON CONFLICT DO NOTHING;

INSERT INTO public.mailbox_usage_snapshots (email_account_id, used_mb, message_count, spam_count)
SELECT ea.id, ea.used_mb, 420, 18
FROM public.email_accounts ea
ON CONFLICT DO NOTHING;
