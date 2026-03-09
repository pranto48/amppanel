-- Drop all existing RESTRICTIVE policies and recreate as PERMISSIVE

-- sites table
DROP POLICY IF EXISTS "Admins can view all sites" ON sites;
DROP POLICY IF EXISTS "Authenticated users can create sites" ON sites;
DROP POLICY IF EXISTS "Only owners can delete sites" ON sites;
DROP POLICY IF EXISTS "Owners and admins can update their sites" ON sites;
DROP POLICY IF EXISTS "Users can view sites they have access to" ON sites;

CREATE POLICY "Admins can view all sites" ON sites FOR SELECT TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Authenticated users can create sites" ON sites FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Only owners can delete sites" ON sites FOR DELETE TO authenticated USING (get_site_role(auth.uid(), id) = 'owner'::site_role);
CREATE POLICY "Owners and admins can update their sites" ON sites FOR UPDATE TO authenticated USING (get_site_role(auth.uid(), id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]));
CREATE POLICY "Users can view sites they have access to" ON sites FOR SELECT TO authenticated USING (has_site_access(auth.uid(), id));

-- profiles table
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;

CREATE POLICY "Admins can delete profiles" ON profiles FOR DELETE TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Admins can insert profiles" ON profiles FOR INSERT TO authenticated WITH CHECK (is_admin(auth.uid()) OR (auth.uid() = id));
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT TO authenticated USING (true);

-- user_roles table
DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;
DROP POLICY IF EXISTS "Super admins can manage roles" ON user_roles;

CREATE POLICY "Admins can view all roles" ON user_roles FOR SELECT TO authenticated USING (is_admin(auth.uid()) OR (user_id = auth.uid()));
CREATE POLICY "Super admins can insert roles" ON user_roles FOR INSERT TO authenticated WITH CHECK (has_app_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Super admins can update roles" ON user_roles FOR UPDATE TO authenticated USING (has_app_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Super admins can delete roles" ON user_roles FOR DELETE TO authenticated USING (has_app_role(auth.uid(), 'super_admin'::app_role));

-- site_members table
DROP POLICY IF EXISTS "Owners and admins can add members" ON site_members;
DROP POLICY IF EXISTS "Owners and admins can update members" ON site_members;
DROP POLICY IF EXISTS "Owners can remove members" ON site_members;
DROP POLICY IF EXISTS "Users can view members of their sites" ON site_members;

CREATE POLICY "Owners and admins can add members" ON site_members FOR INSERT TO authenticated WITH CHECK (get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]));
CREATE POLICY "Owners and admins can update members" ON site_members FOR UPDATE TO authenticated USING (get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]));
CREATE POLICY "Owners can remove members" ON site_members FOR DELETE TO authenticated USING (get_site_role(auth.uid(), site_id) = 'owner'::site_role);
CREATE POLICY "Users can view members of their sites" ON site_members FOR SELECT TO authenticated USING (has_site_access(auth.uid(), site_id));

-- databases table
DROP POLICY IF EXISTS "Owners and admins can create databases" ON databases;
DROP POLICY IF EXISTS "Owners and admins can delete databases" ON databases;
DROP POLICY IF EXISTS "Owners and admins can update databases" ON databases;
DROP POLICY IF EXISTS "Users can view databases of their sites" ON databases;

CREATE POLICY "Owners and admins can create databases" ON databases FOR INSERT TO authenticated WITH CHECK (get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]));
CREATE POLICY "Owners and admins can delete databases" ON databases FOR DELETE TO authenticated USING (get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]));
CREATE POLICY "Owners and admins can update databases" ON databases FOR UPDATE TO authenticated USING (get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]));
CREATE POLICY "Users can view databases of their sites" ON databases FOR SELECT TO authenticated USING (has_site_access(auth.uid(), site_id));

-- cron_jobs table
DROP POLICY IF EXISTS "Admins can create cron jobs" ON cron_jobs;
DROP POLICY IF EXISTS "Admins can delete cron jobs" ON cron_jobs;
DROP POLICY IF EXISTS "Admins can update cron jobs" ON cron_jobs;
DROP POLICY IF EXISTS "Admins can view all cron jobs" ON cron_jobs;

CREATE POLICY "Admins can create cron jobs" ON cron_jobs FOR INSERT TO authenticated WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Admins can delete cron jobs" ON cron_jobs FOR DELETE TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Admins can update cron jobs" ON cron_jobs FOR UPDATE TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Admins can view all cron jobs" ON cron_jobs FOR SELECT TO authenticated USING (is_admin(auth.uid()));

-- cron_job_logs table
DROP POLICY IF EXISTS "Admins can delete old logs" ON cron_job_logs;
DROP POLICY IF EXISTS "Admins can insert cron job logs" ON cron_job_logs;
DROP POLICY IF EXISTS "Admins can view cron job logs" ON cron_job_logs;

CREATE POLICY "Admins can delete old logs" ON cron_job_logs FOR DELETE TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Admins can insert cron job logs" ON cron_job_logs FOR INSERT TO authenticated WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Admins can view cron job logs" ON cron_job_logs FOR SELECT TO authenticated USING (is_admin(auth.uid()));

-- plugins table
DROP POLICY IF EXISTS "Admins can manage plugins" ON plugins;
DROP POLICY IF EXISTS "Authenticated users can view plugins" ON plugins;

CREATE POLICY "Admins can manage plugins" ON plugins FOR ALL TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Authenticated users can view plugins" ON plugins FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

-- installed_plugins table
DROP POLICY IF EXISTS "Admins can manage installed plugins" ON installed_plugins;
DROP POLICY IF EXISTS "Authenticated users can view installed plugins" ON installed_plugins;

CREATE POLICY "Admins can manage installed plugins" ON installed_plugins FOR ALL TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Authenticated users can view installed plugins" ON installed_plugins FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

-- system_settings table
DROP POLICY IF EXISTS "Authenticated users can view system settings" ON system_settings;
DROP POLICY IF EXISTS "Super admins can manage system settings" ON system_settings;

CREATE POLICY "Authenticated users can view system settings" ON system_settings FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Super admins can manage system settings" ON system_settings FOR ALL TO authenticated USING (has_app_role(auth.uid(), 'super_admin'::app_role));

-- activity_logs table
DROP POLICY IF EXISTS "Admins can view site activity logs" ON activity_logs;
DROP POLICY IF EXISTS "Users can create their own activity logs" ON activity_logs;
DROP POLICY IF EXISTS "Users can view their own activity logs" ON activity_logs;

CREATE POLICY "Admins can view site activity logs" ON activity_logs FOR SELECT TO authenticated USING ((site_id IS NOT NULL) AND (get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role])));
CREATE POLICY "Users can create their own activity logs" ON activity_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own activity logs" ON activity_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- backups table
DROP POLICY IF EXISTS "Owners and admins can create backups" ON backups;
DROP POLICY IF EXISTS "Owners and admins can delete backups" ON backups;
DROP POLICY IF EXISTS "Owners and admins can update backups" ON backups;
DROP POLICY IF EXISTS "Users can view backups of their sites" ON backups;

CREATE POLICY "Owners and admins can create backups" ON backups FOR INSERT TO authenticated WITH CHECK (get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]));
CREATE POLICY "Owners and admins can delete backups" ON backups FOR DELETE TO authenticated USING (get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]));
CREATE POLICY "Owners and admins can update backups" ON backups FOR UPDATE TO authenticated USING (get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]));
CREATE POLICY "Users can view backups of their sites" ON backups FOR SELECT TO authenticated USING (has_site_access(auth.uid(), site_id));

-- backup_schedules table
DROP POLICY IF EXISTS "Owners and admins can create schedules" ON backup_schedules;
DROP POLICY IF EXISTS "Owners and admins can delete schedules" ON backup_schedules;
DROP POLICY IF EXISTS "Owners and admins can update schedules" ON backup_schedules;
DROP POLICY IF EXISTS "Users can view schedules of their sites" ON backup_schedules;

CREATE POLICY "Owners and admins can create schedules" ON backup_schedules FOR INSERT TO authenticated WITH CHECK (get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]));
CREATE POLICY "Owners and admins can delete schedules" ON backup_schedules FOR DELETE TO authenticated USING (get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]));
CREATE POLICY "Owners and admins can update schedules" ON backup_schedules FOR UPDATE TO authenticated USING (get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]));
CREATE POLICY "Users can view schedules of their sites" ON backup_schedules FOR SELECT TO authenticated USING (has_site_access(auth.uid(), site_id));

-- email_accounts table
DROP POLICY IF EXISTS "Owners and admins can create email accounts" ON email_accounts;
DROP POLICY IF EXISTS "Owners and admins can delete email accounts" ON email_accounts;
DROP POLICY IF EXISTS "Owners and admins can update email accounts" ON email_accounts;
DROP POLICY IF EXISTS "Users can view email accounts of their sites" ON email_accounts;

CREATE POLICY "Owners and admins can create email accounts" ON email_accounts FOR INSERT TO authenticated WITH CHECK (get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]));
CREATE POLICY "Owners and admins can delete email accounts" ON email_accounts FOR DELETE TO authenticated USING (get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]));
CREATE POLICY "Owners and admins can update email accounts" ON email_accounts FOR UPDATE TO authenticated USING (get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]));
CREATE POLICY "Users can view email accounts of their sites" ON email_accounts FOR SELECT TO authenticated USING (has_site_access(auth.uid(), site_id));

-- email_forwarders table
DROP POLICY IF EXISTS "Owners and admins can create forwarders" ON email_forwarders;
DROP POLICY IF EXISTS "Owners and admins can delete forwarders" ON email_forwarders;
DROP POLICY IF EXISTS "Owners and admins can update forwarders" ON email_forwarders;
DROP POLICY IF EXISTS "Users can view forwarders of their sites" ON email_forwarders;

CREATE POLICY "Owners and admins can create forwarders" ON email_forwarders FOR INSERT TO authenticated WITH CHECK (get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]));
CREATE POLICY "Owners and admins can delete forwarders" ON email_forwarders FOR DELETE TO authenticated USING (get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]));
CREATE POLICY "Owners and admins can update forwarders" ON email_forwarders FOR UPDATE TO authenticated USING (get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]));
CREATE POLICY "Users can view forwarders of their sites" ON email_forwarders FOR SELECT TO authenticated USING (has_site_access(auth.uid(), site_id));

-- email_autoresponders table
DROP POLICY IF EXISTS "Owners and admins can create autoresponders" ON email_autoresponders;
DROP POLICY IF EXISTS "Owners and admins can delete autoresponders" ON email_autoresponders;
DROP POLICY IF EXISTS "Owners and admins can update autoresponders" ON email_autoresponders;
DROP POLICY IF EXISTS "Users can view autoresponders" ON email_autoresponders;

CREATE POLICY "Owners and admins can create autoresponders" ON email_autoresponders FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM email_accounts ea WHERE ea.id = email_autoresponders.email_account_id AND get_site_role(auth.uid(), ea.site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role])));
CREATE POLICY "Owners and admins can delete autoresponders" ON email_autoresponders FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM email_accounts ea WHERE ea.id = email_autoresponders.email_account_id AND get_site_role(auth.uid(), ea.site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role])));
CREATE POLICY "Owners and admins can update autoresponders" ON email_autoresponders FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM email_accounts ea WHERE ea.id = email_autoresponders.email_account_id AND get_site_role(auth.uid(), ea.site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role])));
CREATE POLICY "Users can view autoresponders" ON email_autoresponders FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM email_accounts ea WHERE ea.id = email_autoresponders.email_account_id AND has_site_access(auth.uid(), ea.site_id)));

-- user_2fa table
DROP POLICY IF EXISTS "Users can delete their own 2FA settings" ON user_2fa;
DROP POLICY IF EXISTS "Users can insert their own 2FA settings" ON user_2fa;
DROP POLICY IF EXISTS "Users can update their own 2FA settings" ON user_2fa;
DROP POLICY IF EXISTS "Users can view their own 2FA settings" ON user_2fa;

CREATE POLICY "Users can delete their own 2FA settings" ON user_2fa FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own 2FA settings" ON user_2fa FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own 2FA settings" ON user_2fa FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own 2FA settings" ON user_2fa FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- system_metrics table
DROP POLICY IF EXISTS "Allow inserting system metrics" ON system_metrics;
DROP POLICY IF EXISTS "Users can view metrics for their sites" ON system_metrics;

CREATE POLICY "Allow inserting system metrics" ON system_metrics FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view metrics for their sites" ON system_metrics FOR SELECT TO authenticated USING ((site_id IS NULL) OR has_site_access(auth.uid(), site_id));

-- plugin_installation_logs table
DROP POLICY IF EXISTS "Admins can insert installation logs" ON plugin_installation_logs;
DROP POLICY IF EXISTS "Admins can view installation logs" ON plugin_installation_logs;

CREATE POLICY "Admins can insert installation logs" ON plugin_installation_logs FOR INSERT TO authenticated WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Admins can view installation logs" ON plugin_installation_logs FOR SELECT TO authenticated USING (is_admin(auth.uid()));