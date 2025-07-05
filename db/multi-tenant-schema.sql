-- Multi-tenant schema setup for Mortgage Lead Hub
-- This file contains SQL commands to convert a single-tenant database to multi-tenant

-- 1. Create clients table in public schema
CREATE TABLE IF NOT EXISTS public.clients (
  client_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  subdomain VARCHAR(100) UNIQUE,
  logo_url TEXT,
  primary_color VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  active BOOLEAN DEFAULT TRUE
);

-- 2. Add client_id to auth.users (using Supabase's user management)
-- This requires RLS policies and functions to link users to clients

-- Create a function to get the current client_id from user metadata
CREATE OR REPLACE FUNCTION public.get_client_id()
RETURNS UUID AS $$
BEGIN
  RETURN (current_setting('request.jwt.claims', true)::json->>'client_id')::UUID;
EXCEPTION
  WHEN OTHERS THEN RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create a schema for the initial client
-- Replace 'client_123' with your actual client identifier
CREATE SCHEMA IF NOT EXISTS client_owl;

-- 4. Create leads table in client schema with client reference
CREATE TABLE IF NOT EXISTS client_owl.leads (
  lead_id BIGSERIAL PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(client_id),
  external_id TEXT,
  source TEXT,
  service TEXT,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status_code TEXT,
  referral_name TEXT
);

-- 5. Create statuses table in client schema
CREATE TABLE IF NOT EXISTS client_owl.statuses (
  status_code VARCHAR(50) PRIMARY KEY,
  description VARCHAR(255),
  sort_order INTEGER
);

-- 6. Migrate existing data from public schema to client schema
-- Only run this if you have existing data to migrate
-- Skip this section if you don't have existing public.leads or public.statuses tables

-- Uncomment and modify these lines if you have existing data to migrate:
-- INSERT INTO client_123.leads (lead_id, uuid, external_id, source, service, first_name, last_name, email, phone, created_at, status_code, referral_name)
-- SELECT lead_id, uuid::uuid, external_id, source, service, first_name, last_name, email, phone, created_at, status_code, referral_name FROM public.leads;

-- INSERT INTO client_123.statuses
-- SELECT * FROM public.statuses;

-- Insert default statuses for the initial client
INSERT INTO client_owl.statuses (status_code, description, sort_order)
VALUES 
  ('new_lead', 'New Lead', 1),
  ('existing_client', 'Existing Client', 2),
  ('new', 'New', 3)
ON CONFLICT (status_code) DO NOTHING;

-- 7. Set up Row Level Security for client tables
ALTER TABLE client_owl.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_owl.statuses ENABLE ROW LEVEL SECURITY;

-- 8. Create policies for client access
-- Drop existing policies to avoid duplicate errors
DROP POLICY IF EXISTS client_leads_policy ON client_owl.leads;
DROP POLICY IF EXISTS client_statuses_policy ON client_owl.statuses;
-- These policies ensure users can only access data from their assigned client
CREATE POLICY client_leads_policy ON client_owl.leads
  FOR ALL USING (client_id = public.get_client_id());

CREATE POLICY client_statuses_policy ON client_owl.statuses
  FOR ALL USING (true);

-- 9. Create initial client record
-- Use a specific UUID for the owl client for consistency
INSERT INTO public.clients (client_id, name, subdomain)
VALUES ('550e8400-e29b-41d4-a716-446655440000', 'Owl Mortgage', 'owl')
ON CONFLICT (client_id) DO NOTHING;

-- 10. Add client_id to user metadata for existing users
-- This would be done via Supabase admin or API
-- UPDATE auth.users
-- SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object('client_id', 'client_123')
-- WHERE email = 'existing_user@example.com';

-- 11. Create function to create a new client schema and tables
CREATE OR REPLACE FUNCTION public.create_client_schema(client_id UUID)
RETURNS VOID AS $$
DECLARE
  schema_name TEXT;
BEGIN
  -- Convert UUID to string for schema name
  schema_name := 'client_' || replace(client_id::TEXT, '-', '_');
  
  -- Create schema
  EXECUTE 'CREATE SCHEMA IF NOT EXISTS ' || schema_name;
  
  -- Create leads table with client reference
  EXECUTE 'CREATE TABLE IF NOT EXISTS ' || schema_name || '.leads (
    lead_id BIGSERIAL PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES public.clients(client_id),
    external_id TEXT,
    source TEXT,
    service TEXT,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status_code TEXT,
    referral_name TEXT
  )';
  
  -- Create statuses table
  EXECUTE 'CREATE TABLE IF NOT EXISTS ' || schema_name || '.statuses (
    status_code VARCHAR(50) PRIMARY KEY,
    description VARCHAR(255),
    sort_order INTEGER
  )';
  
  -- Enable RLS
  EXECUTE 'ALTER TABLE ' || schema_name || '.leads ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE ' || schema_name || '.statuses ENABLE ROW LEVEL SECURITY';
  
  -- Create RLS policies
  EXECUTE 'DROP POLICY IF EXISTS client_leads_policy ON ' || schema_name || '.leads;';
  EXECUTE 'CREATE POLICY client_leads_policy ON ' || schema_name || '.leads FOR ALL USING (client_id = public.get_client_id())';
    
  EXECUTE 'DROP POLICY IF EXISTS client_statuses_policy ON ' || schema_name || '.statuses;';
  EXECUTE 'CREATE POLICY client_statuses_policy ON ' || schema_name || '.statuses FOR ALL USING (true)';
    
  -- Copy existing leads data if any (uncomment if you have existing data)
  -- EXECUTE 'INSERT INTO ' || schema_name || '.leads (lead_id, uuid, external_id, source, service, first_name, last_name, email, phone, created_at, status_code, referral_name)
  --   SELECT lead_id, uuid::uuid, external_id, source, service, first_name, last_name, email, phone, created_at, status_code, referral_name FROM public.leads;';
  
  -- Insert default statuses
  EXECUTE 'INSERT INTO ' || schema_name || '.statuses (status_code, description, sort_order)
    VALUES 
      (''new_lead'', ''New Lead'', 1),
      (''existing_client'', ''Existing Client'', 2),
      (''new'', ''New'', 3)
    ON CONFLICT (status_code) DO NOTHING';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Example usage: SELECT create_client_schema('client_id_here');

-- =============================================
-- MULTI-TENANT RPC FUNCTIONS
-- =============================================

-- Function to get leads for a specific client schema
CREATE OR REPLACE FUNCTION public.get_leads_for_client(
  client_schema TEXT
) RETURNS SETOF JSONB AS $$
BEGIN
  RETURN QUERY EXECUTE format('
    SELECT to_jsonb(leads.*) FROM %I.leads
    ORDER BY created_at DESC
  ', client_schema);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get a specific lead by ID
CREATE OR REPLACE FUNCTION public.get_lead_by_id(
  client_schema TEXT,
  lead_id BIGINT
) RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  EXECUTE format('
    SELECT to_jsonb(leads.*) FROM %I.leads
    WHERE lead_id = $1
  ', client_schema)
  USING lead_id
  INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update lead status
CREATE OR REPLACE FUNCTION public.update_lead_status(
  client_schema TEXT,
  lead_id BIGINT,
  new_status TEXT
) RETURNS VOID AS $$
BEGIN
  EXECUTE format('
    UPDATE %I.leads 
    SET status_code = $1
    WHERE lead_id = $2
  ', client_schema)
  USING new_status, lead_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update lead
CREATE OR REPLACE FUNCTION public.update_lead(
  client_schema TEXT,
  lead_id BIGINT,
  lead_updates JSONB
) RETURNS JSONB AS $$
DECLARE
  result JSONB;
  update_query TEXT;
  set_clause TEXT;
  key TEXT;
  value TEXT;
BEGIN
  -- Build SET clause dynamically from JSONB
  set_clause := '';
  FOR key, value IN SELECT * FROM jsonb_each_text(lead_updates)
  LOOP
    IF set_clause != '' THEN
      set_clause := set_clause || ', ';
    END IF;
    set_clause := set_clause || key || ' = ' || quote_literal(value);
  END LOOP;
  
  -- Execute update and return updated row
  update_query := format('
    UPDATE %I.leads 
    SET %s
    WHERE lead_id = $1
    RETURNING to_jsonb(leads.*)
  ', client_schema, set_clause);
  
  EXECUTE update_query
  USING lead_id
  INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to delete lead
CREATE OR REPLACE FUNCTION public.delete_lead(
  client_schema TEXT,
  lead_id BIGINT
) RETURNS VOID AS $$
BEGIN
  EXECUTE format('
    DELETE FROM %I.leads
    WHERE lead_id = $1
  ', client_schema)
  USING lead_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get statuses for a client
CREATE OR REPLACE FUNCTION public.get_statuses_for_client(
  client_schema TEXT
) RETURNS SETOF JSONB AS $$
BEGIN
  RETURN QUERY EXECUTE format('
    SELECT to_jsonb(statuses.*) FROM %I.statuses
    ORDER BY sort_order ASC
  ', client_schema);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get lead counts by status
CREATE OR REPLACE FUNCTION public.get_lead_counts_for_client(
  client_schema TEXT
) RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  EXECUTE format('
    SELECT jsonb_object_agg(status_code, lead_count)
    FROM (
      SELECT 
        s.status_code,
        COALESCE(l.lead_count, 0) as lead_count
      FROM %I.statuses s
      LEFT JOIN (
        SELECT status_code, COUNT(*) as lead_count
        FROM %I.leads
        GROUP BY status_code
      ) l ON s.status_code = l.status_code
      ORDER BY s.sort_order
    ) counts
  ', client_schema, client_schema)
  INTO result;
  
  RETURN COALESCE(result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
