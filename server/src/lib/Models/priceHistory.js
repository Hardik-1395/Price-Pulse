import getDb from "../db.js";

// Append-only. One row per successful scrape; the caller needs the returned `id` to link it
// from scrape_log, so this selects the inserted row back.
export async function insert(row) {
    const { data, error } = await getDb().from("price_history").insert(row).select().single();
    if (error) throw error;
    return data;
}

// The previous snapshot — used as the "before" side of alert comparison. `quoted_at` is the
// store's own timestamp, so "latest" is the store's latest, not ours.
export async function latest(productId) {
    const { data, error } = await getDb()
        .from("price_history")
        .select("*")
        .eq("product_id", productId)
        .order("quoted_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) throw error;
    return data;
}

// The full price series for one product, oldest first so a chart reads left-to-right in time.
// The `(product_id, quoted_at desc)` index carries this scan.
export async function listByProduct(productId) {
    const { data, error } = await getDb()
        .from("price_history")
        .select("*")
        .eq("product_id", productId)
        .order("quoted_at", { ascending: true });

    if (error) throw error;
    return data ?? [];
}
