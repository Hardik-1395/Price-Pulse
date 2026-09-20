import { timingSafeEqual } from "node:crypto";

const HEADER = "x-admin-secret";

// Constant-time compare so a wrong guess can't be narrowed by response timing. Length is checked
// first because timingSafeEqual throws on buffers of different lengths.
function matches(candidate, secret) {
    const a = Buffer.from(candidate);
    const b = Buffer.from(secret);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
}

function presentedSecret(req) {
    const header = req.get(HEADER);
    if (header) return header;

    const auth = req.get("authorization");
    if (auth?.startsWith("Bearer ")) return auth.slice("Bearer ".length).trim();

    return null;
}

// Guards the admin routes. Fails closed: if ADMIN_SECRET is unset the route is disabled (503)
// rather than left open, and a missing/wrong secret is 401.
export function requireAdmin(req, res, next) {
    const secret = process.env.ADMIN_SECRET;

    if (!secret) {
        return res.status(503).json({ error: "Admin API disabled: ADMIN_SECRET is not set" });
    }

    const candidate = presentedSecret(req);

    if (!candidate || !matches(candidate, secret)) {
        return res.status(401).json({ error: "Invalid or missing admin secret" });
    }

    next();
}

export default requireAdmin;
