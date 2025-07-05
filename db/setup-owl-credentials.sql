-- Setup credentials for Owl Mortgage
-- This script creates a user account and sets up proper client association

-- 1. First, you need to create a user account through Supabase Auth
-- This can be done via the Supabase Dashboard or API call
-- For now, we'll prepare the SQL to link the user to the client

-- 2. Function to update user metadata with client_id
-- This function should be called after creating a user account
CREATE OR REPLACE FUNCTION public.assign_user_to_client(
  user_email TEXT,
  target_client_id UUID
)
RETURNS VOID AS $$
BEGIN
  -- Update the user's raw_user_meta_data to include client_id
  -- This will be included in JWT claims for RLS policies
  UPDATE auth.users 
  SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
                          jsonb_build_object('client_id', target_client_id::text)
  WHERE email = user_email;
  
  -- Verify the update
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;
  
  RAISE NOTICE 'Successfully assigned user % to client %', user_email, target_client_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create a default admin user for Owl Mortgage
-- Note: You'll need to create the actual user account first via Supabase Auth
-- Then run this function to assign them to the Owl client

-- Example usage (uncomment and modify after creating the user):
-- SELECT assign_user_to_client('admin@owlmortgage.com', '550e8400-e29b-41d4-a716-446655440000');

-- 4. Function to verify user-client association
CREATE OR REPLACE FUNCTION public.verify_user_client_association(user_email TEXT)
RETURNS TABLE(
  user_id UUID,
  email TEXT,
  client_id TEXT,
  client_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id as user_id,
    u.email::TEXT as email,
    (u.raw_user_meta_data->>'client_id')::TEXT as client_id,
    c.name as client_name
  FROM auth.users u
  LEFT JOIN public.clients c ON c.client_id::TEXT = (u.raw_user_meta_data->>'client_id')
  WHERE u.email = user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Instructions for setting up Owl Mortgage credentials:
/*
STEP-BY-STEP SETUP:

1. Create user account via Supabase Dashboard:
   - Go to Authentication > Users in your Supabase dashboard
   - Click "Add user"
   - Email: admin@owlmortgage.com (or your preferred email)
   - Password: [Choose a secure password]
   - Email Confirm: true

2. Run the assignment function:
   SELECT assign_user_to_client('admin@owlmortgage.com', '550e8400-e29b-41d4-a716-446655440000');

3. Verify the setup:
   SELECT * FROM verify_user_client_association('admin@owlmortgage.com');

4. Test login:
   - Use the email/password in your application
   - The user should have access to the client_owl schema data
   - JWT will include client_id for RLS policies

ALTERNATIVE: Create user via API
If you prefer to create the user programmatically, you can use the Supabase Admin API:

curl -X POST 'https://your-project.supabase.co/auth/v1/admin/users' \
-H "apikey: YOUR_SERVICE_ROLE_KEY" \
-H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
-H "Content-Type: application/json" \
-d '{
  "email": "admin@owlmortgage.com",
  "password": "your-secure-password",
  "email_confirm": true,
  "user_metadata": {
    "client_id": "550e8400-e29b-41d4-a716-446655440000"
  }
}'
*/
