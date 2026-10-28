import { createClient } from "@supabase/supabase-js";

// One shared connection to your database, using the public (publishable) key.
// Row-level security in Supabase decides what this key is allowed to do.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);