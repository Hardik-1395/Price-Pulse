import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const db = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

console.log("Testing DB connection...");

// 1. Try to read from scrape_log
const { data: logs, error: logsErr } = await db.from("scrape_log").select("*").limit(1);
if (logsErr) {
  console.error("scrape_log error:", JSON.stringify(logsErr));
} else {
  console.log("scrape_log sample:", JSON.stringify(logs));
}

// 2. Try inserting a minimal row (without attempted_at to see what columns DB has)
const { data: inserted, error: insertErr } = await db.from("scrape_log").insert({
  product_id: 1,
  status: "failed",
  retry_count: 0,
  error_message: "diagnostic test",
}).select().maybeSingle();

if (insertErr) {
  console.error("insert error:", JSON.stringify(insertErr));
} else {
  console.log("inserted row:", JSON.stringify(inserted));
  // cleanup
  if (inserted?.id) {
    await db.from("scrape_log").delete().eq("id", inserted.id);
  }
}

// 3. Check tracked_products
const { data: tracked, error: trackedErr } = await db.from("tracked_products").select("*").eq("is_active", true);
if (trackedErr) {
  console.error("tracked_products error:", JSON.stringify(trackedErr));
} else {
  console.log("tracked_products:", JSON.stringify(tracked));
}
