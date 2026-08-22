import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder_service_role_key';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    '⚠️ Warning: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables are missing in backend/.env. Server will run, but database operations require valid credentials.'
  );
}

/**
 * Server-side Supabase admin client.
 * Uses the service role key — bypasses RLS and is safe for server use only.
 * Never expose this key to the frontend.
 */
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export default supabase;
