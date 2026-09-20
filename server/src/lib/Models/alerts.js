import getDb from "../db.js";

const DEFAULT_TYPES = [
    { type: "price_drop", notified_via: "in_app" },
    { type: "back_in_stock", notified_via: "in_app" },
];

// The built-in alert rules for a product. The table has no unique constraint on
// (product_id, type), so this checks-then-inserts rather than upserting.
export async function ensureDefault(productId) {
    const { data: existing, error } = await getDb()
        .from("alerts")
        .select("type")
        .eq("product_id", productId);

    if (error) throw error;

    const existingTypes = new Set((existing ?? []).map((row) => row.type));
    const rows = DEFAULT_TYPES.filter((row) => !existingTypes.has(row.type)).map((row) => ({
        product_id: productId,
        ...row,
    }));

    if (rows.length === 0) return 0;

    const { error: insertError } = await getDb().from("alerts").insert(rows);
    if (insertError) throw insertError;

    return rows.length;
}

export async function listActive(productId) {
    const { data, error } = await getDb()
        .from("alerts")
        .select("*")
        .eq("product_id", productId)
        .eq("is_active", true);

    if (error) throw error;
    return data ?? [];
}

// Fire an alert once: stamp it and disarm it so it doesn't refire every cycle.
export async function markTriggered(id) {
    const { error } = await getDb()
        .from("alerts")
        .update({ triggered_at: new Date().toISOString(), is_active: false })
        .eq("id", id);

    if (error) throw error;
}

// Disarm an alert rule by id (the inverse of ensureDefault's insert). Returns the updated row,
// or null when the id doesn't exist.
export async function disable(id) {
    const { data, error } = await getDb()
        .from("alerts")
        .update({ is_active: false })
        .eq("id", id)
        .select()
        .maybeSingle();

    if (error) throw error;
    return data;
}
