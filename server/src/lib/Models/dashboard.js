import getDb from "../db.js";

// One row per tracked product: identity + latest price + latest scrape outcome. The `dashboard`
// view (migration 20260919000100) does the "latest row per product" work in Postgres, so this is
// a plain read — no app-side dedup and no N+1 over price_history/scrape_log.
export async function list() {
    const { data, error } = await getDb().from("dashboard").select("*").order("name");
    if (error) throw error;
    return data ?? [];
}
