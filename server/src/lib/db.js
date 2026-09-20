import { createClient } from "@supabase/supabase-js";

export class DatabaseConfigError extends Error {
    constructor(message) {
        super(message);
        this.name = "DatabaseConfigError";
    }
}
let client = null;
export function getDb() {
    if (client) return client;

    const rawUrl = process.env.SUPABASE_URL ?? "";
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const missing = [
        !rawUrl && "SUPABASE_URL",
        !serviceRoleKey && "SUPABASE_SERVICE_ROLE_KEY",
    ].filter(Boolean);

    if (missing.length > 0) {
        throw new DatabaseConfigError(
            `Missing Supabase config: ${missing.join(", ")} (copy .env.example to .env and fill it in)`,
        );
    }

    // Supabase shows both a Project URL and a REST endpoint. If the REST form is pasted
    // (.../rest/v1/), supabase-js appends its own /rest/v1/ again and every request 404s
    // with PGRST125, so strip it here rather than debugging a doubled path later.
    const url = rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");

    try {
        new URL(url);
    } catch {
        throw new DatabaseConfigError(`Invalid SUPABASE_URL: ${rawUrl}`);
    }

    client = createClient(url, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
    });

    return client;
}

export default getDb;
