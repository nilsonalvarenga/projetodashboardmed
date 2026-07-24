'use client';
import { createClient } from '@supabase/supabase-js';

// Cliente público (anon) para o frontend — leitura sujeita a RLS, login, etc.
export const supabaseBrowser = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);
