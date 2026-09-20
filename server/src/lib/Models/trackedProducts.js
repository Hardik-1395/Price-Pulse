import getDb from "../db.js";

// The hot scheduler query: every active product whose next scrape is due. `next_scrape_at`
// drives the whole loop, so ordering by it (most-overdue first) is the fairness rule.
export async function listDue() {
    const { data, error } = await getDb()
        .from("tracked_products")
        .select("*")
        .eq("is_active", true)
        .lte("next_scrape_at", new Date().toISOString())
        .order("next_scrape_at");

    if (error) throw error;
    return data ?? [];
}

// Track (or re-track) a product. `next_scrape_at = now()` makes it immediately due. Upserting
// on `product_id` keeps re-tracking idempotent instead of erroring on the unique constraint.
export async function track(productId, { frequencyMinutes = 120 } = {}) {
    const now = new Date().toISOString();

    const { data, error } = await getDb()
        .from("tracked_products")
        .upsert(
            {
                product_id: productId,
                scrape_frequency_minutes: frequencyMinutes,
                next_scrape_at: now,
                is_active: true,
            },
            { onConflict: "product_id" },
        )
        .select()
        .single();

    if (error) throw error;
    return data;
}

// Pause tracking: flip `is_active` off (history stays). Keyed by `product_id` to mirror `track`.
// Returns the updated row, or null when nothing was tracked for that product.
export async function deactivate(productId) {
    const { data, error } = await getDb()
        .from("tracked_products")
        .update({ is_active: false })
        .eq("product_id", productId)
        .select()
        .maybeSingle();

    if (error) throw error;
    return data;
}

export async function markSuccess(id, frequencyMinutes) {
    const now = new Date();
    const next = new Date(now.getTime() + frequencyMinutes * 60_000);

    const { error } = await getDb()
        .from("tracked_products")
        .update({ next_scrape_at: next.toISOString(), last_scraped_at: now.toISOString() })
        .eq("id", id);

    if (error) throw error;
}

// A failed scrape retries on a short fixed delay instead of a full frequency, so a transient
// 503 is picked up soon rather than pushed a whole cycle out.
export async function markFailure(id, retryDelayMinutes) {
    const next = new Date(Date.now() + retryDelayMinutes * 60_000);

    const { error } = await getDb()
        .from("tracked_products")
        .update({ next_scrape_at: next.toISOString() })
        .eq("id", id);

    if (error) throw error;
}
