-- Create enum for site status
CREATE TYPE public.site_status AS ENUM ('active', 'pending', 'suspended', 'error');

-- Create enum for site type
CREATE TYPE public.site_type AS ENUM ('wordpress', 'nodejs', 'python', 'php', 'static', 'custom');

-- Create enum for site role (for multi-user access)
CREATE TYPE public.site_role AS ENUM ('owner', 'admin', 'developer', 'viewer');

-- Create enum for database type
CREATE TYPE public.db_type AS ENUM ('mysql', 'postgresql', 'mariadb');

-- Create sites table with full hosting data
CREATE TABLE public.sites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  domain TEXT NOT NULL UNIQUE,
  site_type public.site_type NOT NULL DEFAULT 'php',
  status public.site_status NOT NULL DEFAULT 'pending',
  ssl_enabled BOOLEAN NOT NULL DEFAULT false,
  ssl_expiry TIMESTAMP WITH TIME ZONE,
  php_version TEXT DEFAULT '8.2',
  document_root TEXT DEFAULT '/var/www/html',
  storage_limit_mb INTEGER NOT NULL DEFAULT 5000,
  storage_used_mb INTEGER NOT NULL DEFAULT 0,
  bandwidth_limit_gb INTEGER NOT NULL DEFAULT 100,
  bandwidth_used_gb NUMERIC(10,2) NOT NULL DEFAULT 0,
  ftp_username TEXT,
  ftp_password_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create site_members table for multi-user access
CREATE TABLE public.site_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.site_role NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(site_id, user_id)
);

-- Create databases table (renamed collation to db_collation to avoid reserved word)
CREATE TABLE public.databases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  db_type public.db_type NOT NULL DEFAULT 'mysql',
  username TEXT NOT NULL,
  password_hash TEXT,
  size_mb INTEGER NOT NULL DEFAULT 0,
  db_charset TEXT DEFAULT 'utf8mb4',
  db_collation TEXT DEFAULT 'utf8mb4_unicode_ci',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(site_id, name)
);

-- Enable RLS on all tables
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.databases ENABLE ROW LEVEL SECURITY;

-- Security definer function to check if user has access to a site
CREATE OR REPLACE FUNCTION public.has_site_access(_user_id UUID, _site_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.site_members
    WHERE user_id = _user_id AND site_id = _site_id
  )
$$;

-- Security definer function to check user's role on a site
CREATE OR REPLACE FUNCTION public.get_site_role(_user_id UUID, _site_id UUID)
RETURNS public.site_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.site_members
  WHERE user_id = _user_id AND site_id = _site_id
  LIMIT 1
$$;

-- RLS Policies for sites
CREATE POLICY "Users can view sites they have access to"
ON public.sites FOR SELECT
USING (public.has_site_access(auth.uid(), id));

CREATE POLICY "Owners and admins can update their sites"
ON public.sites FOR UPDATE
USING (public.get_site_role(auth.uid(), id) IN ('owner', 'admin'));

CREATE POLICY "Authenticated users can create sites"
ON public.sites FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Only owners can delete sites"
ON public.sites FOR DELETE
USING (public.get_site_role(auth.uid(), id) = 'owner');

-- RLS Policies for site_members
CREATE POLICY "Users can view members of their sites"
ON public.site_members FOR SELECT
USING (public.has_site_access(auth.uid(), site_id));

CREATE POLICY "Owners and admins can add members"
ON public.site_members FOR INSERT
WITH CHECK (public.get_site_role(auth.uid(), site_id) IN ('owner', 'admin'));

CREATE POLICY "Owners and admins can update members"
ON public.site_members FOR UPDATE
USING (public.get_site_role(auth.uid(), site_id) IN ('owner', 'admin'));

CREATE POLICY "Owners can remove members"
ON public.site_members FOR DELETE
USING (public.get_site_role(auth.uid(), site_id) = 'owner');

-- RLS Policies for databases
CREATE POLICY "Users can view databases of their sites"
ON public.databases FOR SELECT
USING (public.has_site_access(auth.uid(), site_id));

CREATE POLICY "Owners and admins can create databases"
ON public.databases FOR INSERT
WITH CHECK (public.get_site_role(auth.uid(), site_id) IN ('owner', 'admin'));

CREATE POLICY "Owners and admins can update databases"
ON public.databases FOR UPDATE
USING (public.get_site_role(auth.uid(), site_id) IN ('owner', 'admin'));

CREATE POLICY "Owners and admins can delete databases"
ON public.databases FOR DELETE
USING (public.get_site_role(auth.uid(), site_id) IN ('owner', 'admin'));

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_sites_updated_at
BEFORE UPDATE ON public.sites
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_databases_updated_at
BEFORE UPDATE ON public.databases
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to auto-add owner when site is created
CREATE OR REPLACE FUNCTION public.add_site_owner()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.site_members (site_id, user_id, role)
  VALUES (NEW.id, auth.uid(), 'owner');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to add owner on site creation
CREATE TRIGGER add_site_owner_trigger
AFTER INSERT ON public.sites
FOR EACH ROW EXECUTE FUNCTION public.add_site_owner();

-- Indexes for performance
CREATE INDEX idx_site_members_user_id ON public.site_members(user_id);
CREATE INDEX idx_site_members_site_id ON public.site_members(site_id);
CREATE INDEX idx_databases_site_id ON public.databases(site_id);
CREATE INDEX idx_sites_status ON public.sites(status);
CREATE INDEX idx_sites_domain ON public.sites(domain);