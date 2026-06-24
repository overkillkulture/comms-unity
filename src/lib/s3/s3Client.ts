import 'server-only';
import { createClient } from '@supabase/supabase-js';

// Supabase client for storage operations (replaces S3)
export const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string,
);

export const STORAGE_BUCKET = 'hq-posts';
