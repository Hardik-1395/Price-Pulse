import getDb from "../db.js";

const IDENTITY_COLUMNS = ["id", "slug", "name", "brand", "category", "sku", "description"];

function identityPayload(row, now) {
    const payload = { updated_at: now, last_seen_at: now };
    for (const column of IDENTITY_COLUMNS) {
        if (row[column] !== undefined) payload[column] = row[column];
    }
    return payload;
}

// Pass 1 (catalog sampler) and the identity half of pass 2. Writes identity columns only,
// never `specs` — so a catalog re-sample can't clobber detail a later pass already stored.
// Rows must be homogeneous (both store endpoints always ship all seven identity fields).
export async function upsertIdentity(rows) {
    if (rows.length === 0) return 0;

    const now = new Date().toISOString();
    const payload = rows.map((row) => identityPayload(row, now));

    const { error } = await getDb().from("products").upsert(payload, { onConflict: "id" });
    if (error) throw error;

    return payload.length;
}

// Full record from /api/product/{id}: identity + specs. The only writer of `specs`.
export async function upsertDetail(row) {
    const now = new Date().toISOString();
    const payload = { ...identityPayload(row, now), specs: row.specs ?? {} };

    const { data, error } = await getDb()
        .from("products")
        .upsert(payload, { onConflict: "id" })
        .select()
        .single();

    if (error) throw error;
    return data;
}

// Every id already stored. The fill diffs the dense 1..total range against this, so a
// re-run only walks the ids that are genuinely absent instead of re-fetching the table.
export async function listIds() {
    const { data, error } = await getDb().from("products").select("id");
    if (error) throw error;
    return data.map((row) => row.id);
}

// Every product in the table, ordered by id so a client sync can page deterministically.
export async function list() {
    const { data, error } = await getDb().from("products").select("*").order("id");
    if (error) throw error;
    return data ?? [];
}

export async function getById(id) {
    const { data, error } = await getDb().from("products").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data;
}

// name-only ILIKE; the pg_trgm GIN index on `name` carries `%…%` on this path. Kept to one
// column so the value stays a bound parameter instead of a string-built `.or()` filter.
export async function searchByName(query, { limit = 20 } = {}) {
    const { data, error } = await getDb()
        .from("products")
        .select("id, slug, name, brand, category")
        .ilike("name", `%${query}%`)
        .order("name")
        .limit(limit);

    if (error) throw error;
    return data;
}
