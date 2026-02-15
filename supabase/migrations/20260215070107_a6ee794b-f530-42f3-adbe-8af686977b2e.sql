
-- Fix ALL RLS policies to be PERMISSIVE instead of RESTRICTIVE
-- This is critical: without at least one PERMISSIVE policy, all access is denied

-- ========== SITES ==========
DROP POLICY IF EXISTS "Authenticated users can create sites" ON public.sites;
CREATE POLICY "Authenticated users can create sites" ON public.sites FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can view sites they have access to" ON public.sites;
CREATE POLICY "Users can view sites they have access to" ON public.sites FOR SELECT TO authenticated USING (has_site_access(auth.uid(), id));

DROP POLICY IF EXISTS "Owners and admins can update their sites" ON public.sites;
CREATE POLICY "Owners and admins can update their sites" ON public.sites FOR UPDATE TO authenticated USING (get_site_role(auth.uid(), id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]));

DROP POLICY IF EXISTS "Only owners can delete sites" ON public.sites;
CREATE POLICY "Only owners can delete sites" ON public.sites FOR DELETE TO authenticated USING (get_site_role(auth.uid(), id) = 'owner'::site_role);

-- Also allow admins to see all sites
CREATE POLICY "Admins can view all sites" ON public.sites FOR SELECT TO authenticated USING (is_admin(auth.uid()));

-- ========== SITE_MEMBERS ==========
DROP POLICY IF EXISTS "Users can view members of their sites" ON public.site_members;
CREATE POLICY "Users can view members of their sites" ON public.site_members FOR SELECT TO authenticated USING (has_site_access(auth.uid(), site_id));

DROP POLICY IF EXISTS "Owners and admins can add members" ON public.site_members;
CREATE POLICY "Owners and admins can add members" ON public.site_members FOR INSERT TO authenticated WITH CHECK (get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]));

DROP POLICY IF EXISTS "Owners and admins can update members" ON public.site_members;
CREATE POLICY "Owners and admins can update members" ON public.site_members FOR UPDATE TO authenticated USING (get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]));

DROP POLICY IF EXISTS "Owners can remove members" ON public.site_members;
CREATE POLICY "Owners can remove members" ON public.site_members FOR DELETE TO authenticated USING (get_site_role(auth.uid(), site_id) = 'owner'::site_role);

-- ========== PROFILES ==========
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
CREATE POLICY "Admins can insert profiles" ON public.profiles FOR INSERT TO authenticated WITH CHECK (is_admin(auth.uid()) OR auth.uid() = id);

DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
CREATE POLICY "Admins can delete profiles" ON public.profiles FOR DELETE TO authenticated USING (is_admin(auth.uid()));

-- ========== USER_ROLES ==========
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (is_admin(auth.uid()) OR user_id = auth.uid());

DROP POLICY IF EXISTS "Super admins can manage roles" ON public.user_roles;
CREATE POLICY "Super admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (has_app_role(auth.uid(), 'super_admin'::app_role));

-- ========== ACTIVITY_LOGS ==========
DROP POLICY IF EXISTS "Users can view their own activity logs" ON public.activity_logs;
CREATE POLICY "Users can view their own activity logs" ON public.activity_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view site activity logs" ON public.activity_logs;
CREATE POLICY "Admins can view site activity logs" ON public.activity_logs FOR SELECT TO authenticated USING (site_id IS NOT NULL AND get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]));

DROP POLICY IF EXISTS "Users can create their own activity logs" ON public.activity_logs;
CREATE POLICY "Users can create their own activity logs" ON public.activity_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ========== DATABASES ==========
DROP POLICY IF EXISTS "Users can view databases of their sites" ON public.databases;
CREATE POLICY "Users can view databases of their sites" ON public.databases FOR SELECT TO authenticated USING (has_site_access(auth.uid(), site_id));

DROP POLICY IF EXISTS "Owners and admins can create databases" ON public.databases;
CREATE POLICY "Owners and admins can create databases" ON public.databases FOR INSERT TO authenticated WITH CHECK (get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]));

DROP POLICY IF EXISTS "Owners and admins can update databases" ON public.databases;
CREATE POLICY "Owners and admins can update databases" ON public.databases FOR UPDATE TO authenticated USING (get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]));

DROP POLICY IF EXISTS "Owners and admins can delete databases" ON public.databases;
CREATE POLICY "Owners and admins can delete databases" ON public.databases FOR DELETE TO authenticated USING (get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]));

-- ========== BACKUPS ==========
DROP POLICY IF EXISTS "Users can view backups of their sites" ON public.backups;
CREATE POLICY "Users can view backups of their sites" ON public.backups FOR SELECT TO authenticated USING (has_site_access(auth.uid(), site_id));

DROP POLICY IF EXISTS "Owners and admins can create backups" ON public.backups;
CREATE POLICY "Owners and admins can create backups" ON public.backups FOR INSERT TO authenticated WITH CHECK (get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]));

DROP POLICY IF EXISTS "Owners and admins can update backups" ON public.backups;
CREATE POLICY "Owners and admins can update backups" ON public.backups FOR UPDATE TO authenticated USING (get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]));

DROP POLICY IF EXISTS "Owners and admins can delete backups" ON public.backups;
CREATE POLICY "Owners and admins can delete backups" ON public.backups FOR DELETE TO authenticated USING (get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]));

-- ========== BACKUP_SCHEDULES ==========
DROP POLICY IF EXISTS "Users can view schedules of their sites" ON public.backup_schedules;
CREATE POLICY "Users can view schedules of their sites" ON public.backup_schedules FOR SELECT TO authenticated USING (has_site_access(auth.uid(), site_id));

DROP POLICY IF EXISTS "Owners and admins can create schedules" ON public.backup_schedules;
CREATE POLICY "Owners and admins can create schedules" ON public.backup_schedules FOR INSERT TO authenticated WITH CHECK (get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]));

DROP POLICY IF EXISTS "Owners and admins can update schedules" ON public.backup_schedules;
CREATE POLICY "Owners and admins can update schedules" ON public.backup_schedules FOR UPDATE TO authenticated USING (get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]));

DROP POLICY IF EXISTS "Owners and admins can delete schedules" ON public.backup_schedules;
CREATE POLICY "Owners and admins can delete schedules" ON public.backup_schedules FOR DELETE TO authenticated USING (get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]));

-- ========== EMAIL_ACCOUNTS ==========
DROP POLICY IF EXISTS "Users can view email accounts of their sites" ON public.email_accounts;
CREATE POLICY "Users can view email accounts of their sites" ON public.email_accounts FOR SELECT TO authenticated USING (has_site_access(auth.uid(), site_id));

DROP POLICY IF EXISTS "Owners and admins can create email accounts" ON public.email_accounts;
CREATE POLICY "Owners and admins can create email accounts" ON public.email_accounts FOR INSERT TO authenticated WITH CHECK (get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]));

DROP POLICY IF EXISTS "Owners and admins can update email accounts" ON public.email_accounts;
CREATE POLICY "Owners and admins can update email accounts" ON public.email_accounts FOR UPDATE TO authenticated USING (get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]));

DROP POLICY IF EXISTS "Owners and admins can delete email accounts" ON public.email_accounts;
CREATE POLICY "Owners and admins can delete email accounts" ON public.email_accounts FOR DELETE TO authenticated USING (get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]));

-- ========== EMAIL_AUTORESPONDERS ==========
DROP POLICY IF EXISTS "Users can view autoresponders" ON public.email_autoresponders;
CREATE POLICY "Users can view autoresponders" ON public.email_autoresponders FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM email_accounts ea WHERE ea.id = email_autoresponders.email_account_id AND has_site_access(auth.uid(), ea.site_id)));

DROP POLICY IF EXISTS "Owners and admins can create autoresponders" ON public.email_autoresponders;
CREATE POLICY "Owners and admins can create autoresponders" ON public.email_autoresponders FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM email_accounts ea WHERE ea.id = email_autoresponders.email_account_id AND get_site_role(auth.uid(), ea.site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role])));

DROP POLICY IF EXISTS "Owners and admins can update autoresponders" ON public.email_autoresponders;
CREATE POLICY "Owners and admins can update autoresponders" ON public.email_autoresponders FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM email_accounts ea WHERE ea.id = email_autoresponders.email_account_id AND get_site_role(auth.uid(), ea.site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role])));

DROP POLICY IF EXISTS "Owners and admins can delete autoresponders" ON public.email_autoresponders;
CREATE POLICY "Owners and admins can delete autoresponders" ON public.email_autoresponders FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM email_accounts ea WHERE ea.id = email_autoresponders.email_account_id AND get_site_role(auth.uid(), ea.site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role])));

-- ========== EMAIL_FORWARDERS ==========
DROP POLICY IF EXISTS "Users can view forwarders of their sites" ON public.email_forwarders;
CREATE POLICY "Users can view forwarders of their sites" ON public.email_forwarders FOR SELECT TO authenticated USING (has_site_access(auth.uid(), site_id));

DROP POLICY IF EXISTS "Owners and admins can create forwarders" ON public.email_forwarders;
CREATE POLICY "Owners and admins can create forwarders" ON public.email_forwarders FOR INSERT TO authenticated WITH CHECK (get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]));

DROP POLICY IF EXISTS "Owners and admins can update forwarders" ON public.email_forwarders;
CREATE POLICY "Owners and admins can update forwarders" ON public.email_forwarders FOR UPDATE TO authenticated USING (get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]));

DROP POLICY IF EXISTS "Owners and admins can delete forwarders" ON public.email_forwarders;
CREATE POLICY "Owners and admins can delete forwarders" ON public.email_forwarders FOR DELETE TO authenticated USING (get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]));

-- ========== CRON_JOBS ==========
DROP POLICY IF EXISTS "Admins can view all cron jobs" ON public.cron_jobs;
CREATE POLICY "Admins can view all cron jobs" ON public.cron_jobs FOR SELECT TO authenticated USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can create cron jobs" ON public.cron_jobs;
CREATE POLICY "Admins can create cron jobs" ON public.cron_jobs FOR INSERT TO authenticated WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update cron jobs" ON public.cron_jobs;
CREATE POLICY "Admins can update cron jobs" ON public.cron_jobs FOR UPDATE TO authenticated USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete cron jobs" ON public.cron_jobs;
CREATE POLICY "Admins can delete cron jobs" ON public.cron_jobs FOR DELETE TO authenticated USING (is_admin(auth.uid()));

-- ========== CRON_JOB_LOGS ==========
DROP POLICY IF EXISTS "Admins can view cron job logs" ON public.cron_job_logs;
CREATE POLICY "Admins can view cron job logs" ON public.cron_job_logs FOR SELECT TO authenticated USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert cron job logs" ON public.cron_job_logs;
CREATE POLICY "Admins can insert cron job logs" ON public.cron_job_logs FOR INSERT TO authenticated WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete old logs" ON public.cron_job_logs;
CREATE POLICY "Admins can delete old logs" ON public.cron_job_logs FOR DELETE TO authenticated USING (is_admin(auth.uid()));

-- ========== SYSTEM_METRICS ==========
DROP POLICY IF EXISTS "Users can view metrics for their sites" ON public.system_metrics;
CREATE POLICY "Users can view metrics for their sites" ON public.system_metrics FOR SELECT TO authenticated USING (site_id IS NULL OR has_site_access(auth.uid(), site_id));

DROP POLICY IF EXISTS "Allow inserting system metrics" ON public.system_metrics;
CREATE POLICY "Allow inserting system metrics" ON public.system_metrics FOR INSERT TO authenticated WITH CHECK (true);

-- ========== SYSTEM_SETTINGS ==========
DROP POLICY IF EXISTS "Authenticated users can view system settings" ON public.system_settings;
CREATE POLICY "Authenticated users can view system settings" ON public.system_settings FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Super admins can manage system settings" ON public.system_settings;
CREATE POLICY "Super admins can manage system settings" ON public.system_settings FOR ALL TO authenticated USING (has_app_role(auth.uid(), 'super_admin'::app_role));

-- ========== USER_2FA ==========
DROP POLICY IF EXISTS "Users can view their own 2FA settings" ON public.user_2fa;
CREATE POLICY "Users can view their own 2FA settings" ON public.user_2fa FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own 2FA settings" ON public.user_2fa;
CREATE POLICY "Users can insert their own 2FA settings" ON public.user_2fa FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own 2FA settings" ON public.user_2fa;
CREATE POLICY "Users can update their own 2FA settings" ON public.user_2fa FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own 2FA settings" ON public.user_2fa;
CREATE POLICY "Users can delete their own 2FA settings" ON public.user_2fa FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ========== PLUGINS ==========
DROP POLICY IF EXISTS "Authenticated users can view plugins" ON public.plugins;
CREATE POLICY "Authenticated users can view plugins" ON public.plugins FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admins can manage plugins" ON public.plugins;
CREATE POLICY "Admins can manage plugins" ON public.plugins FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- ========== INSTALLED_PLUGINS ==========
DROP POLICY IF EXISTS "Authenticated users can view installed plugins" ON public.installed_plugins;
CREATE POLICY "Authenticated users can view installed plugins" ON public.installed_plugins FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admins can manage installed plugins" ON public.installed_plugins;
CREATE POLICY "Admins can manage installed plugins" ON public.installed_plugins FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- ========== PLUGIN_INSTALLATION_LOGS ==========
DROP POLICY IF EXISTS "Admins can view installation logs" ON public.plugin_installation_logs;
CREATE POLICY "Admins can view installation logs" ON public.plugin_installation_logs FOR SELECT TO authenticated USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert installation logs" ON public.plugin_installation_logs;
CREATE POLICY "Admins can insert installation logs" ON public.plugin_installation_logs FOR INSERT TO authenticated WITH CHECK (is_admin(auth.uid()));

-- ========== Ensure triggers exist ==========
-- Recreate the add_site_owner trigger
DROP TRIGGER IF EXISTS on_site_created ON public.sites;
CREATE TRIGGER on_site_created AFTER INSERT ON public.sites FOR EACH ROW EXECUTE FUNCTION public.add_site_owner();

-- Recreate the handle_new_user trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
