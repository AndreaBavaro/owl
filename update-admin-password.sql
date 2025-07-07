-- Update admin password in Supabase Auth
-- Run this in Supabase SQL Editor

-- Method 1: Update password directly (if you have access to auth schema)
UPDATE auth.users 
SET encrypted_password = crypt('TOBlueJays2025!', gen_salt('bf'))
WHERE email = 'admin@owlmortgage.com';

-- Method 2: Alternative approach using Supabase functions
-- This is safer and uses Supabase's built-in password hashing
SELECT auth.update_user(
  user_id := (SELECT id FROM auth.users WHERE email = 'admin@owlmortgage.com'),
  attributes := '{"password": "TOBlueJays2025!"}'::jsonb
);

-- Verify the update
SELECT email, created_at, updated_at, last_sign_in_at 
FROM auth.users 
WHERE email = 'admin@owlmortgage.com';
