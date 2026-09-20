import getDb from "../db.js";

// One row per scrape cycle, success or not. Only a success row carries a price_history_id.
export async function insert(row) {
    const { error } = await getDb().from("scrape_log").insert(row);
    if (error) throw error;
}

// The audit trail, newest first. This table grows one row per scrape *cycle*, so it is capped
// by default rather than returned unbounded. Optional `productId` narrows it to one product.
export async function list({ limit = 200, productId } = {}) {
    let query = getDb()
        .from("scrape_log")
        .select("*")
        .order("attempted_at", { ascending: false })
        .limit(limit);

    if (productId !== undefined) query = query.eq("product_id", productId);

    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
}
