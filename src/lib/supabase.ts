
import { createClient } from '@supabase/supabase-js';
import { supabase as supabaseClient } from '@/integrations/supabase/client';

// Re-export the client from our integrations folder to maintain a single source of truth
export const supabase = supabaseClient;
