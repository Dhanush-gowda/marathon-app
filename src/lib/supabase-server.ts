import { createClient } from "@supabase/supabase-js";
import { mockDBClient } from "./mock-db";

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (url && key) {
    console.log("🗄️  Using Supabase database");
    return createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  console.log("🗄️  Using local mock database (no Supabase configured)");
  return mockDBClient;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabaseAdmin: any = createAdminClient();
