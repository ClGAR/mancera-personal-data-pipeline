import { createClient } from '@supabase/supabase-js';
import { env, flags } from './env.js';

export const supabase = flags.hasSupabase
  ? createClient(env.supabase.url, env.supabase.serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    })
  : null;

export function requireSupabase() {
  if (!supabase) {
    const error = new Error('Supabase is not configured. Add SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY.');
    error.statusCode = 503;
    throw error;
  }

  return supabase;
}
