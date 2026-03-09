-- Attach handle_new_user trigger to auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Attach add_site_owner trigger to sites
CREATE OR REPLACE TRIGGER on_site_created
  AFTER INSERT ON public.sites
  FOR EACH ROW EXECUTE FUNCTION public.add_site_owner();

-- Attach update_updated_at triggers to all tables with updated_at column
CREATE OR REPLACE TRIGGER update_sites_updated_at
  BEFORE UPDATE ON public.sites
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_databases_updated_at
  BEFORE UPDATE ON public.databases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_cron_jobs_updated_at
  BEFORE UPDATE ON public.cron_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_email_accounts_updated_at
  BEFORE UPDATE ON public.email_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_email_forwarders_updated_at
  BEFORE UPDATE ON public.email_forwarders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_email_autoresponders_updated_at
  BEFORE UPDATE ON public.email_autoresponders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_backup_schedules_updated_at
  BEFORE UPDATE ON public.backup_schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_installed_plugins_updated_at
  BEFORE UPDATE ON public.installed_plugins
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_user_2fa_updated_at
  BEFORE UPDATE ON public.user_2fa
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();